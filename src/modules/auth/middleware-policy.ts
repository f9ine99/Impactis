import type { User } from '@supabase/supabase-js'
import type { AppRole } from '@/modules/profiles'
import { getOnboardingPath, isOnboardingPath } from '@/modules/onboarding'
import {
    getDashboardPathForRole,
    getProtectedRoleForPath,
    isAuthEntryPath,
    isPublicPath,
} from './routing'

type MiddlewareContext = {
    pathname: string
    user: User | null
    role: AppRole | null
}

export type MiddlewareDecision =
    | { type: 'allow' }
    | { type: 'redirect'; destination: string; unauthorized?: boolean }

export function decideMiddlewareNavigation({
    pathname,
    user,
    role,
}: MiddlewareContext): MiddlewareDecision {
    const publicPath = isPublicPath(pathname)
    const onboardingPath = getOnboardingPath()

    if (!user && !publicPath) {
        return { type: 'redirect', destination: '/auth/login' }
    }

    if (!user) {
        return { type: 'allow' }
    }

    if (!role) {
        if (isOnboardingPath(pathname)) {
            return { type: 'allow' }
        }

        if (isAuthEntryPath(pathname) || !publicPath) {
            return { type: 'redirect', destination: onboardingPath }
        }

        return { type: 'allow' }
    }

    const requiredRole = getProtectedRoleForPath(pathname)
    if (requiredRole && role !== requiredRole) {
        return {
            type: 'redirect',
            destination: getDashboardPathForRole(role),
            unauthorized: true,
        }
    }

    if (isOnboardingPath(pathname)) {
        return { type: 'redirect', destination: getDashboardPathForRole(role) }
    }

    if (isAuthEntryPath(pathname)) {
        return { type: 'redirect', destination: getDashboardPathForRole(role) }
    }

    return { type: 'allow' }
}
