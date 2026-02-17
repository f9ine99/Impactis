import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type {
    AdvisorDirectoryEntry,
    AdvisorDirectoryVerificationStatus,
    EngagementRequest,
    EngagementRequestDecision,
    EngagementRequestStatus,
} from './types'

const MISSING_SCHEMA_ERROR_CODES = new Set(['42P01', '42883', 'PGRST202', 'PGRST205'])
const ADVISOR_DIRECTORY_VERIFICATION_STATUSES = new Set<AdvisorDirectoryVerificationStatus>([
    'unverified',
    'pending',
    'approved',
    'rejected',
])
const ENGAGEMENT_REQUEST_STATUSES = new Set<EngagementRequestStatus>([
    'sent',
    'accepted',
    'rejected',
    'expired',
    'cancelled',
])

type AdvisorDirectoryRow = {
    id: string
    name: string
    location: string | null
    industry_tags: string[] | null
    verification_status: string
}

type EngagementRequestRow = {
    id: string
    startup_org_id: string
    startup_org_name: string
    advisor_org_id: string
    advisor_org_name: string
    status: string
    created_at: string
    responded_at: string | null
    prep_room_id: string | null
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

function normalizeAdvisorDirectoryVerificationStatus(value: unknown): AdvisorDirectoryVerificationStatus {
    if (typeof value !== 'string') {
        return 'unverified'
    }

    const normalized = value.trim().toLowerCase()
    return ADVISOR_DIRECTORY_VERIFICATION_STATUSES.has(normalized as AdvisorDirectoryVerificationStatus)
        ? (normalized as AdvisorDirectoryVerificationStatus)
        : 'unverified'
}

function normalizeEngagementRequestStatus(value: unknown): EngagementRequestStatus {
    if (typeof value !== 'string') {
        return 'sent'
    }

    const normalized = value.trim().toLowerCase()
    return ENGAGEMENT_REQUEST_STATUSES.has(normalized as EngagementRequestStatus)
        ? (normalized as EngagementRequestStatus)
        : 'sent'
}

function mapAdvisorDirectoryRow(row: AdvisorDirectoryRow): AdvisorDirectoryEntry | null {
    const name = normalizeText(row.name)
    if (!name) {
        return null
    }

    return {
        id: row.id,
        name,
        location: normalizeText(row.location),
        industry_tags: normalizeArray(row.industry_tags),
        verification_status: normalizeAdvisorDirectoryVerificationStatus(row.verification_status),
    }
}

function mapEngagementRequestRow(row: EngagementRequestRow): EngagementRequest | null {
    const startupOrgName = normalizeText(row.startup_org_name)
    const advisorOrgName = normalizeText(row.advisor_org_name)
    if (!startupOrgName || !advisorOrgName) {
        return null
    }

    return {
        id: row.id,
        startup_org_id: row.startup_org_id,
        startup_org_name: startupOrgName,
        advisor_org_id: row.advisor_org_id,
        advisor_org_name: advisorOrgName,
        status: normalizeEngagementRequestStatus(row.status),
        created_at: row.created_at,
        responded_at: normalizeText(row.responded_at),
        prep_room_id: normalizeText(row.prep_room_id),
    }
}

export async function listAdvisorDirectory(supabase: SupabaseClient): Promise<AdvisorDirectoryEntry[]> {
    const { data, error } = await supabase.rpc('list_advisor_organizations')

    if (error) {
        if (!isMissingSchemaError(error)) {
            console.warn(
                `[engagements] Failed to load advisor directory: `
                + `${error.code ?? 'unknown'} ${error.message ?? 'unknown'}`
            )
        }

        return []
    }

    return (data as AdvisorDirectoryRow[] | null ?? [])
        .map((row) => mapAdvisorDirectoryRow(row))
        .filter((entry): entry is AdvisorDirectoryEntry => !!entry)
}

export async function listEngagementRequestsForCurrentUser(supabase: SupabaseClient): Promise<EngagementRequest[]> {
    const { data, error } = await supabase.rpc('list_engagement_requests_for_current_user')

    if (error) {
        if (!isMissingSchemaError(error)) {
            console.warn(
                `[engagements] Failed to load engagement requests: `
                + `${error.code ?? 'unknown'} ${error.message ?? 'unknown'}`
            )
        }

        return []
    }

    return (data as EngagementRequestRow[] | null ?? [])
        .map((row) => mapEngagementRequestRow(row))
        .filter((request): request is EngagementRequest => !!request)
}

export async function createEngagementRequestForCurrentUser(
    supabase: SupabaseClient,
    advisorOrgId: string
): Promise<string> {
    const normalizedAdvisorOrgId = normalizeText(advisorOrgId)
    if (!normalizedAdvisorOrgId) {
        throw new Error('Advisor organization is required.')
    }

    const { data, error } = await supabase.rpc('create_engagement_request', {
        p_advisor_org_id: normalizedAdvisorOrgId,
        p_expires_at: null,
    })

    if (error) {
        if (isMissingSchemaError(error)) {
            throw new Error('Engagement migration is missing. Apply the latest Supabase migrations.')
        }

        throw new Error(error.message)
    }

    if (typeof data !== 'string' || data.trim().length === 0) {
        throw new Error('Unexpected response while creating engagement request.')
    }

    return data
}

export async function respondToEngagementRequestForCurrentUser(
    supabase: SupabaseClient,
    input: { requestId: string; decision: EngagementRequestDecision }
): Promise<string | null> {
    const requestId = normalizeText(input.requestId)
    if (!requestId) {
        throw new Error('Engagement request id is required.')
    }

    const decision = input.decision
    if (decision !== 'accepted' && decision !== 'rejected') {
        throw new Error('Invalid engagement decision.')
    }

    const { data, error } = await supabase.rpc('respond_to_engagement_request', {
        p_request_id: requestId,
        p_decision: decision,
    })

    if (error) {
        if (isMissingSchemaError(error)) {
            throw new Error('Engagement migration is missing. Apply the latest Supabase migrations.')
        }

        throw new Error(error.message)
    }

    const roomId = normalizeText(data)
    return roomId
}
