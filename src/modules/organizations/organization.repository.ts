import type { PostgrestError, SupabaseClient, User } from '@supabase/supabase-js'
import type {
    OrganizationCapability,
    OrganizationCapabilityGateResult,
    OrganizationCapabilityGateReason,
    CreateOrganizationInput,
    Organization,
    OrganizationMembership,
    OrganizationMemberRole,
    OrganizationType,
    OrganizationVerification,
    OrganizationVerificationOverview,
    OrganizationVerificationStatus,
} from './types'

const ORGANIZATION_TYPES = new Set<OrganizationType>(['startup', 'investor', 'advisor'])
const ORGANIZATION_MEMBER_ROLES = new Set<OrganizationMemberRole>(['owner', 'admin', 'member'])
const ORGANIZATION_VERIFICATION_STATUSES = new Set<OrganizationVerificationStatus>([
    'unverified',
    'pending',
    'approved',
    'rejected',
])
const MISSING_SCHEMA_ERROR_CODES = new Set(['42P01', '42883', 'PGRST205'])

type OrganizationRow = {
    id: string
    type: string
    name: string
    location: string | null
    industry_tags: string[] | null
    created_at: string
}

type OrganizationMembershipRow = {
    org_id: string
    user_id: string
    member_role: string
    created_at: string
}

type OrganizationMembershipWithOrganizationRow = OrganizationMembershipRow & {
    organization: OrganizationRow
}

type OrganizationVerificationRow = {
    org_id: string
    status: string
    reviewed_by: string | null
    reviewed_at: string | null
    notes: string | null
}

function isMissingSchemaError(error: PostgrestError | null): boolean {
    return typeof error?.code === 'string' && MISSING_SCHEMA_ERROR_CODES.has(error.code)
}

function normalizeText(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function normalizeArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return []
    }

    return Array.from(
        new Set(
            value
                .filter((item): item is string => typeof item === 'string')
                .map((item) => item.trim())
                .filter((item) => item.length > 0)
        )
    )
}

function normalizeOrganizationType(value: unknown): OrganizationType | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return ORGANIZATION_TYPES.has(normalized as OrganizationType) ? (normalized as OrganizationType) : null
}

function normalizeOrganizationMemberRole(value: unknown): OrganizationMemberRole | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    return ORGANIZATION_MEMBER_ROLES.has(normalized as OrganizationMemberRole)
        ? (normalized as OrganizationMemberRole)
        : null
}

function normalizeOrganizationVerificationStatus(value: unknown): OrganizationVerificationStatus {
    if (typeof value !== 'string') {
        return 'unverified'
    }

    const normalized = value.trim().toLowerCase()
    return ORGANIZATION_VERIFICATION_STATUSES.has(normalized as OrganizationVerificationStatus)
        ? (normalized as OrganizationVerificationStatus)
        : 'unverified'
}

function mapOrganization(row: OrganizationRow): Organization | null {
    const type = normalizeOrganizationType(row.type)
    const name = normalizeText(row.name)

    if (!type || !name) {
        return null
    }

    return {
        id: row.id,
        type,
        name,
        location: normalizeText(row.location),
        industry_tags: normalizeArray(row.industry_tags),
        created_at: row.created_at,
    }
}

function mapOrganizationMembershipWithOrganization(
    row: OrganizationMembershipWithOrganizationRow
): OrganizationMembership | null {
    const memberRole = normalizeOrganizationMemberRole(row.member_role)
    if (!memberRole) {
        return null
    }

    const organization = mapOrganization(row.organization)
    if (!organization) {
        return null
    }

    return {
        org_id: row.org_id,
        user_id: row.user_id,
        member_role: memberRole,
        created_at: row.created_at,
        organization,
    }
}

function getDefaultVerification(orgId: string): OrganizationVerification {
    return {
        org_id: orgId,
        status: 'unverified',
        reviewed_by: null,
        reviewed_at: null,
        notes: null,
    }
}

function mapOrganizationVerification(row: OrganizationVerificationRow): OrganizationVerification {
    return {
        org_id: row.org_id,
        status: normalizeOrganizationVerificationStatus(row.status),
        reviewed_by: normalizeText(row.reviewed_by),
        reviewed_at: normalizeText(row.reviewed_at),
        notes: normalizeText(row.notes),
    }
}

export function mapAppRoleToOrganizationType(role: unknown): OrganizationType | null {
    if (typeof role !== 'string') {
        return null
    }

    const normalized = role.trim().toLowerCase()
    if (normalized === 'founder' || normalized === 'startup') {
        return 'startup'
    }

    if (normalized === 'investor') {
        return 'investor'
    }

    if (normalized === 'advisor') {
        return 'advisor'
    }

    return null
}

export function parseIndustryTags(rawValue: string): string[] {
    return Array.from(
        new Set(
            rawValue
                .split(',')
                .map((segment) => segment.trim())
                .filter((segment) => segment.length > 0)
        )
    )
}

function getRequiredOrganizationTypeForCapability(capability: OrganizationCapability): OrganizationType {
    if (capability === 'advisor_intro_send') {
        return 'advisor'
    }

    return 'investor'
}

function getCapabilityDescription(capability: OrganizationCapability): string {
    if (capability === 'advisor_intro_send') {
        return 'send investor intro requests'
    }

    if (capability === 'investor_intro_receive') {
        return 'receive advisor intros'
    }

    return 'accept advisor intros'
}

function buildCapabilityResult(input: {
    capability: OrganizationCapability
    reason: OrganizationCapabilityGateReason
    organizationType: OrganizationType | null
    verificationStatus: OrganizationVerificationStatus | null
}): OrganizationCapabilityGateResult {
    const requiredOrganizationType = getRequiredOrganizationTypeForCapability(input.capability)
    const capabilityDescription = getCapabilityDescription(input.capability)

    if (input.reason === 'ok') {
        return {
            capability: input.capability,
            allowed: true,
            reason: input.reason,
            requiredOrganizationType,
            organizationType: input.organizationType,
            verificationStatus: input.verificationStatus,
            message: `Organization is verified and can ${capabilityDescription}.`,
        }
    }

    if (input.reason === 'missing_membership') {
        return {
            capability: input.capability,
            allowed: false,
            reason: input.reason,
            requiredOrganizationType,
            organizationType: input.organizationType,
            verificationStatus: input.verificationStatus,
            message: 'Organization membership is required.',
        }
    }

    if (input.reason === 'wrong_org_type') {
        return {
            capability: input.capability,
            allowed: false,
            reason: input.reason,
            requiredOrganizationType,
            organizationType: input.organizationType,
            verificationStatus: input.verificationStatus,
            message: `Only ${requiredOrganizationType} organizations can ${capabilityDescription}.`,
        }
    }

    return {
        capability: input.capability,
        allowed: false,
        reason: input.reason,
        requiredOrganizationType,
        organizationType: input.organizationType,
        verificationStatus: input.verificationStatus,
        message: 'Organization verification approval is required.',
    }
}

export function evaluateOrganizationCapability(input: {
    capability: OrganizationCapability
    organizationType: OrganizationType | null
    verificationStatus: OrganizationVerificationStatus | null
}): OrganizationCapabilityGateResult {
    if (!input.organizationType) {
        return buildCapabilityResult({
            capability: input.capability,
            reason: 'missing_membership',
            organizationType: input.organizationType,
            verificationStatus: input.verificationStatus,
        })
    }

    const requiredOrganizationType = getRequiredOrganizationTypeForCapability(input.capability)
    if (input.organizationType !== requiredOrganizationType) {
        return buildCapabilityResult({
            capability: input.capability,
            reason: 'wrong_org_type',
            organizationType: input.organizationType,
            verificationStatus: input.verificationStatus,
        })
    }

    if (input.verificationStatus !== 'approved') {
        return buildCapabilityResult({
            capability: input.capability,
            reason: 'verification_required',
            organizationType: input.organizationType,
            verificationStatus: input.verificationStatus,
        })
    }

    return buildCapabilityResult({
        capability: input.capability,
        reason: 'ok',
        organizationType: input.organizationType,
        verificationStatus: input.verificationStatus,
    })
}

export async function getPrimaryOrganizationMembershipByUserId(
    supabase: SupabaseClient,
    userId: string
): Promise<OrganizationMembership | null> {
    const { data: membershipData, error: membershipError } = await supabase
        .from('org_members')
        .select('org_id, user_id, member_role, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

    if (membershipError) {
        if (!isMissingSchemaError(membershipError)) {
            console.warn(
                `[organizations] Failed to load primary membership for user ${userId}: `
                + `${membershipError.code ?? 'unknown'} ${membershipError.message ?? 'unknown'}`
            )
        }

        return null
    }

    if (!membershipData) {
        return null
    }

    const membershipRow = membershipData as OrganizationMembershipRow
    const { data: organizationData, error: organizationError } = await supabase
        .from('organizations')
        .select('id, type, name, location, industry_tags, created_at')
        .eq('id', membershipRow.org_id)
        .maybeSingle()

    if (organizationError) {
        if (!isMissingSchemaError(organizationError)) {
            console.warn(
                `[organizations] Failed to load organization ${membershipRow.org_id} for user ${userId}: `
                + `${organizationError.code ?? 'unknown'} ${organizationError.message ?? 'unknown'}`
            )
        }

        return null
    }

    if (!organizationData) {
        return null
    }

    return mapOrganizationMembershipWithOrganization({
        ...membershipRow,
        organization: organizationData as OrganizationRow,
    })
}

export async function getPrimaryOrganizationMembershipForUser(
    supabase: SupabaseClient,
    user: User
): Promise<OrganizationMembership | null> {
    return getPrimaryOrganizationMembershipByUserId(supabase, user.id)
}

export async function hasOrganizationMembershipForUser(
    supabase: SupabaseClient,
    user: User
): Promise<boolean> {
    const { data, error } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

    if (error) {
        if (!isMissingSchemaError(error)) {
            console.warn(
                `[organizations] Failed to check membership for user ${user.id}: `
                + `${error.code ?? 'unknown'} ${error.message ?? 'unknown'}`
            )
        }

        return false
    }

    return !!data
}

export async function getOrganizationVerificationByOrgId(
    supabase: SupabaseClient,
    orgId: string
): Promise<OrganizationVerification> {
    const { data, error } = await supabase
        .from('org_verifications')
        .select('org_id, status, reviewed_by, reviewed_at, notes')
        .eq('org_id', orgId)
        .maybeSingle()

    if (error) {
        if (!isMissingSchemaError(error)) {
            console.warn(
                `[organizations] Failed to load verification for org ${orgId}: `
                + `${error.code ?? 'unknown'} ${error.message ?? 'unknown'}`
            )
        }

        return getDefaultVerification(orgId)
    }

    if (!data) {
        return getDefaultVerification(orgId)
    }

    return mapOrganizationVerification(data as OrganizationVerificationRow)
}

export async function getOrganizationVerificationStatusByOrgId(
    supabase: SupabaseClient,
    orgId: string
): Promise<OrganizationVerificationStatus> {
    const verification = await getOrganizationVerificationByOrgId(supabase, orgId)
    return verification.status
}

export async function evaluateOrganizationCapabilityForUser(
    supabase: SupabaseClient,
    user: User,
    capability: OrganizationCapability
): Promise<OrganizationCapabilityGateResult> {
    const membership = await getPrimaryOrganizationMembershipForUser(supabase, user)
    if (!membership) {
        return evaluateOrganizationCapability({
            capability,
            organizationType: null,
            verificationStatus: null,
        })
    }

    const verificationStatus = await getOrganizationVerificationStatusByOrgId(supabase, membership.org_id)

    return evaluateOrganizationCapability({
        capability,
        organizationType: membership.organization.type,
        verificationStatus,
    })
}

export async function assertOrganizationCapabilityForUser(
    supabase: SupabaseClient,
    user: User,
    capability: OrganizationCapability
): Promise<OrganizationCapabilityGateResult> {
    const result = await evaluateOrganizationCapabilityForUser(supabase, user, capability)
    if (!result.allowed) {
        throw new Error(result.message)
    }

    return result
}

export async function listOrganizationsWithVerification(
    supabase: SupabaseClient,
    limit = 100
): Promise<OrganizationVerificationOverview[]> {
    const { data: organizationsData, error: organizationsError } = await supabase
        .from('organizations')
        .select('id, type, name, location, industry_tags, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (organizationsError) {
        if (!isMissingSchemaError(organizationsError)) {
            console.warn(
                `[organizations] Failed to list organizations: `
                + `${organizationsError.code ?? 'unknown'} ${organizationsError.message ?? 'unknown'}`
            )
        }

        return []
    }

    const organizations = (organizationsData ?? [])
        .map((row) => mapOrganization(row as OrganizationRow))
        .filter((organization): organization is Organization => !!organization)

    if (organizations.length === 0) {
        return []
    }

    const organizationIds = organizations.map((organization) => organization.id)
    const { data: verificationsData, error: verificationsError } = await supabase
        .from('org_verifications')
        .select('org_id, status, reviewed_by, reviewed_at, notes')
        .in('org_id', organizationIds)

    if (verificationsError && !isMissingSchemaError(verificationsError)) {
        console.warn(
            `[organizations] Failed to load org verifications: `
            + `${verificationsError.code ?? 'unknown'} ${verificationsError.message ?? 'unknown'}`
        )
    }

    const verificationMap = new Map<string, OrganizationVerification>()
    for (const row of verificationsData ?? []) {
        const verification = mapOrganizationVerification(row as OrganizationVerificationRow)
        verificationMap.set(verification.org_id, verification)
    }

    return organizations.map((organization) => ({
        organization,
        verification: verificationMap.get(organization.id) ?? getDefaultVerification(organization.id),
    }))
}

export async function setOrganizationVerificationStatusByOrgId(
    supabase: SupabaseClient,
    input: {
        orgId: string
        status: OrganizationVerificationStatus
        reviewedByUserId?: string | null
        notes?: string | null
    }
): Promise<OrganizationVerification> {
    const orgId = normalizeText(input.orgId)
    if (!orgId) {
        throw new Error('Organization id is required.')
    }

    const status = normalizeOrganizationVerificationStatus(input.status)
    const reviewedBy = normalizeText(input.reviewedByUserId ?? null)
    const notes = normalizeText(input.notes ?? null)
    const shouldMarkReviewed = status === 'approved' || status === 'rejected'

    const { data, error } = await supabase
        .from('org_verifications')
        .upsert({
            org_id: orgId,
            status,
            reviewed_by: shouldMarkReviewed ? reviewedBy : null,
            reviewed_at: shouldMarkReviewed ? new Date().toISOString() : null,
            notes,
        }, { onConflict: 'org_id' })
        .select('org_id, status, reviewed_by, reviewed_at, notes')
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return mapOrganizationVerification(data as OrganizationVerificationRow)
}

export async function createOrganizationWithOwner(
    supabase: SupabaseClient,
    input: CreateOrganizationInput
): Promise<string> {
    const name = normalizeText(input.name)
    if (!name) {
        throw new Error('Organization name is required.')
    }

    const type = normalizeOrganizationType(input.type)
    if (!type) {
        throw new Error('Invalid organization type.')
    }

    const location = normalizeText(input.location ?? null)
    const industryTags = normalizeArray(input.industryTags)

    const { data, error } = await supabase.rpc('create_organization_with_owner', {
        p_name: name,
        p_type: type,
        p_location: location,
        p_industry_tags: industryTags,
    })

    if (error) {
        if (isMissingSchemaError(error)) {
            throw new Error('Organization migration is missing. Apply the latest Supabase migrations.')
        }

        throw new Error(error.message)
    }

    if (typeof data !== 'string' || data.trim().length === 0) {
        throw new Error('Unexpected response while creating organization.')
    }

    return data
}

export async function updateMyOrganizationSettings(
    supabase: SupabaseClient,
    input: {
        name: string
        location?: string | null
        industryTags?: string[]
    }
): Promise<string> {
    const name = normalizeText(input.name)
    if (!name || name.length < 2) {
        throw new Error('Organization name must be at least 2 characters.')
    }

    const location = normalizeText(input.location ?? null)
    const industryTags = normalizeArray(input.industryTags)

    const { data, error } = await supabase.rpc('update_my_organization_settings', {
        p_name: name,
        p_location: location,
        p_industry_tags: industryTags,
    })

    if (error) {
        if (isMissingSchemaError(error)) {
            throw new Error('Organization settings migration is missing. Apply the latest Supabase migrations.')
        }

        throw new Error(error.message)
    }

    if (typeof data !== 'string' || data.trim().length === 0) {
        throw new Error('Unexpected response while updating organization settings.')
    }

    return data
}
