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

type UserMetadata = {
    full_name?: unknown
    company?: unknown
}

function getUserMetadata(user: User): UserMetadata {
    return (user.user_metadata ?? {}) as UserMetadata
}

export function getProfileFallbackFromAuthUser(user: User): UserProfile {
    const metadata = getUserMetadata(user)

    return {
        id: user.id,
        role: null,
        full_name: normalizeText(metadata.full_name),
        company: normalizeText(metadata.company),
    }
}

export async function getProfileByUserId(
    supabase: SupabaseClient,
    userId: string
): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, role, full_name, company')
        .eq('id', userId)
        .maybeSingle()

    if (error || !data) {
        return null
    }

    const row = data as ProfileRow
    return {
        id: row.id,
        role: normalizeRole(row.role),
        full_name: row.full_name ?? null,
        company: row.company ?? null,
    }
}

export async function getRoleByUserId(
    supabase: SupabaseClient,
    userId: string
): Promise<AppRole | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

    if (error || !data) {
        return null
    }

    return normalizeRole((data as { role: unknown }).role)
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
    const fallback = getProfileFallbackFromAuthUser(user)

    if (!profile) {
        return fallback
    }

    return {
        id: profile.id,
        role: profile.role,
        full_name: profile.full_name ?? fallback.full_name,
        company: profile.company ?? fallback.company,
    }
}
