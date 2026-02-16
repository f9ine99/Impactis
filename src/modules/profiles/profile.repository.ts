import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { AppRole, UserProfile } from './types'

const APP_ROLES = new Set<AppRole>(['founder', 'investor', 'advisor', 'admin'])
const APP_ROLE_ALIASES: Record<string, AppRole> = {
    founder: 'founder',
    startup: 'founder',
    investor: 'investor',
    advisor: 'advisor',
    admin: 'admin',
}

type ProfileRow = {
    id: string
    role: string | null
    full_name: string | null
    company: string | null
    location: string | null
    bio: string | null
    industry_tags: string[] | null
    avatar_url: string | null
    is_verified: boolean | null
}

export function isAppRole(value: unknown): value is AppRole {
    return typeof value === 'string' && APP_ROLES.has(value as AppRole)
}

function normalizeRole(role: unknown): AppRole | null {
    if (typeof role !== 'string') {
        return null
    }

    const normalized = role.trim().toLowerCase()
    return APP_ROLE_ALIASES[normalized] ?? null
}

function normalizeText(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function normalizeTextArray(value: unknown): string[] | null {
    if (!Array.isArray(value)) {
        return null
    }

    const normalized = value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)

    return normalized.length > 0 ? Array.from(new Set(normalized)) : null
}

function mapRowToUserProfile(row: ProfileRow): UserProfile {
    return {
        id: row.id,
        role: normalizeRole(row.role),
        full_name: normalizeText(row.full_name),
        company: normalizeText(row.company),
        location: normalizeText(row.location),
        bio: normalizeText(row.bio),
        industry_tags: normalizeTextArray(row.industry_tags) ?? [],
        avatar_url: normalizeText(row.avatar_url),
        is_verified: Boolean(row.is_verified),
    }
}

function getEmptyProfileFallback(userId: string): UserProfile {
    return {
        id: userId,
        role: null,
        full_name: null,
        company: null,
        location: null,
        bio: null,
        industry_tags: [],
        avatar_url: null,
        is_verified: false,
    }
}

export async function getProfileByUserId(
    supabase: SupabaseClient,
    userId: string
): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, role, full_name, company, location, bio, industry_tags, avatar_url, is_verified')
        .eq('id', userId)
        .maybeSingle()

    if (!error && data) {
        return mapRowToUserProfile(data as ProfileRow)
    }

    const {
        data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser || currentUser.id !== userId) {
        return null
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_profile')
    if (rpcError) {
        console.warn(
            `[profiles] Unable to load profile for user ${userId}. `
            + `Select error: ${error?.code ?? 'none'} ${error?.message ?? ''}. `
            + `RPC error: ${rpcError.code ?? 'unknown'} ${rpcError.message ?? 'unknown'}.`
        )
        return null
    }

    const rpcRow = Array.isArray(rpcData) ? rpcData[0] : rpcData
    if (!rpcRow || typeof rpcRow !== 'object') {
        return null
    }

    return mapRowToUserProfile(rpcRow as ProfileRow)
}

export async function getRoleByUserId(
    supabase: SupabaseClient,
    userId: string
): Promise<AppRole | null> {
    const profile = await getProfileByUserId(supabase, userId)
    return profile?.role ?? null
}

export async function getResolvedRoleForUser(
    supabase: SupabaseClient,
    user: User
): Promise<AppRole | null> {
    // Authorization role must come from persistent profile state, not auth metadata.
    return getRoleByUserId(supabase, user.id)
}

export async function getResolvedProfileForUser(
    supabase: SupabaseClient,
    user: User
): Promise<UserProfile> {
    const profile = await getProfileByUserId(supabase, user.id)

    if (!profile) {
        return getEmptyProfileFallback(user.id)
    }

    return profile
}
