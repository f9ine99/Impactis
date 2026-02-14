import type { SupabaseClient } from '@supabase/supabase-js'
import { getResolvedProfileForUser } from '@/modules/profiles'
import type { DashboardProfile } from '../types'

export type DashboardAccessState =
    | { status: 'unauthenticated' }
    | { status: 'onboarding' }
    | { status: 'ready'; profile: DashboardProfile }

function hasDashboardRole(profile: Awaited<ReturnType<typeof getResolvedProfileForUser>>): profile is DashboardProfile {
    return !!profile?.role
}

export async function getDashboardAccessState(supabase: SupabaseClient): Promise<DashboardAccessState> {
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { status: 'unauthenticated' }
    }

    const profile = await getResolvedProfileForUser(supabase, user)
    if (!hasDashboardRole(profile)) {
        return { status: 'onboarding' }
    }

    return {
        status: 'ready',
        profile,
    }
}
