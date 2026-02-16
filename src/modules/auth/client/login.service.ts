import type { AuthApiError, SupabaseClient } from '@supabase/supabase-js'
import { getResolvedRoleForUser } from '@/modules/profiles'
import { getDashboardPathForRole } from '../routing'

type LoginErrorInput = Pick<AuthApiError, 'message' | 'code'>

export function mapLoginErrorMessage(error: LoginErrorInput): string {
    const normalizedMessage = error.message.toLowerCase()
    const normalizedCode = error.code?.toLowerCase()

    if (
        normalizedCode === 'email_not_confirmed'
        || normalizedMessage.includes('email not confirmed')
    ) {
        return 'Your email is not verified yet. Please verify your account from your inbox.'
    }

    if (
        normalizedCode === 'invalid_credentials'
        || normalizedMessage.includes('invalid login credentials')
        || normalizedMessage.includes('invalid credentials')
    ) {
        return 'Incorrect email or password.'
    }

    return error.message
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
