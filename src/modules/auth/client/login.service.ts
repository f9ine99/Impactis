import type { SupabaseClient } from '@supabase/supabase-js'
import { getResolvedRoleForUser } from '@/modules/profiles'
import { getDashboardPathForRole } from '../routing'

export function mapLoginErrorMessage(message: string): string {
    const normalizedMessage = message.toLowerCase()

    if (normalizedMessage.includes('email not confirmed')) {
        return 'Email not confirmed. Please check your inbox.'
    }

    if (normalizedMessage.includes('invalid login credentials')) {
        return 'Invalid email or password. Please verify your credentials.'
    }

    return message
}

export async function resolvePostLoginRedirect(supabase: SupabaseClient): Promise<string> {
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return '/'
    }

    const role = await getResolvedRoleForUser(supabase, user)
    return getDashboardPathForRole(role)
}
