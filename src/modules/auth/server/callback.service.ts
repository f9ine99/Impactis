import type { SupabaseClient } from '@supabase/supabase-js'
import { hasOrganizationMembershipForUser } from '@/modules/organizations'
import { getPostAuthRedirectPath } from '../routing'

function sanitizeNextPath(nextPathParam: string | null): string | null {
    if (!nextPathParam) {
        return null
    }

    if (!nextPathParam.startsWith('/') || nextPathParam.startsWith('//')) {
        return null
    }

    return nextPathParam
}

export async function resolveCallbackRedirectPath(
    supabase: SupabaseClient,
    nextPathParam: string | null
): Promise<string> {
    const safeNextPath = sanitizeNextPath(nextPathParam)
    if (safeNextPath) {
        return safeNextPath
    }

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return '/'
    }

    const hasOrganizationMembership = await hasOrganizationMembershipForUser(supabase, user)
    return getPostAuthRedirectPath(hasOrganizationMembership)
}
