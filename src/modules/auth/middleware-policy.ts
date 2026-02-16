import type { User } from '@supabase/supabase-js'
import type { AppRole } from '@/modules/profiles'
import { isOnboardingPath } from '@/modules/onboarding'
import {
    getDashboardPathForRole,
    isWorkspacePath,
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
    | { type: 'redirect'; destination: string }

export function decideMiddlewareNavigation({
    pathname,
    user,
    role,
}: MiddlewareContext): MiddlewareDecision {
    const publicPath = isPublicPath(pathname)

    if (!user && !publicPath) {
        return { type: 'redirect', destination: '/auth/login' }
    }

    if (!user) {
        return { type: 'allow' }
    }

    if (!role) {
        if (isOnboardingPath(pathname) || isWorkspacePath(pathname)) {
            return { type: 'allow' }
        }

        if (isAuthEntryPath(pathname) || !publicPath) {
            return { type: 'redirect', destination: getDashboardPathForRole(role) }
        }

        return { type: 'allow' }
    }

    if (isOnboardingPath(pathname)) {
        return { type: 'redirect', destination: getDashboardPathForRole(role) }
    }

    if (isAuthEntryPath(pathname)) {
        return { type: 'redirect', destination: getDashboardPathForRole(role) }
    }

    return { type: 'allow' }
}
