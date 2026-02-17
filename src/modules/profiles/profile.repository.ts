import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { UserProfile } from './types'

type ProfileRow = {
    id: string
    full_name: string | null
    location: string | null
    bio: string | null
    avatar_url: string | null
}

function normalizeText(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function mapRowToUserProfile(row: ProfileRow): UserProfile {
    return {
        id: row.id,
        full_name: normalizeText(row.full_name),
        location: normalizeText(row.location),
        bio: normalizeText(row.bio),
        avatar_url: normalizeText(row.avatar_url),
    }
}

function getEmptyProfileFallback(userId: string): UserProfile {
    return {
        id: userId,
        full_name: null,
        location: null,
        bio: null,
        avatar_url: null,
    }
}

export async function getProfileByUserId(
    supabase: SupabaseClient,
    userId: string
): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, location, bio, avatar_url')
        .eq('id', userId)
        .maybeSingle()

    if (!error && data) {
        return mapRowToUserProfile(data as ProfileRow)
    }
    if (error) {
        console.warn(
            `[profiles] Unable to load profile for user ${userId}: `
            + `${error.code ?? 'unknown'} ${error.message ?? 'unknown'}.`
        )
    }

    return null
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

export async function updateProfileForUser(
    supabase: SupabaseClient,
    user: User,
    input: {
        fullName?: string | null
        location?: string | null
        bio?: string | null
    }
): Promise<UserProfile> {
    const fullName = normalizeText(input.fullName ?? null)
    const location = normalizeText(input.location ?? null)
    const bio = normalizeText(input.bio ?? null)

    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            full_name: fullName,
            location,
            bio,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
        .select('id, full_name, location, bio, avatar_url')
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return mapRowToUserProfile(data as ProfileRow)
}
