import type { PostgrestError, SupabaseClient, User } from '@supabase/supabase-js'
import type {
    CreateOrganizationInput,
    Organization,
    OrganizationMembership,
    OrganizationMemberRole,
    OrganizationType,
} from './types'

const ORGANIZATION_TYPES = new Set<OrganizationType>(['startup', 'investor', 'advisor'])
const ORGANIZATION_MEMBER_ROLES = new Set<OrganizationMemberRole>(['owner', 'admin', 'member'])
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
