import type { User } from '@supabase/supabase-js'
import { isOnboardingPath } from '@/modules/onboarding'
import {
    getPostAuthRedirectPath,
    isWorkspacePath,
    isAuthEntryPath,
    isPublicPath,
} from './routing'

type MiddlewareContext = {
    pathname: string
    user: User | null
    hasOrganizationMembership: boolean
}

export type MiddlewareDecision =
    | { type: 'allow' }
    | { type: 'redirect'; destination: string }

export function decideMiddlewareNavigation({
    pathname,
    user,
    hasOrganizationMembership,
}: MiddlewareContext): MiddlewareDecision {
    const publicPath = isPublicPath(pathname)

    if (!user && !publicPath) {
        return { type: 'redirect', destination: '/auth/login' }
    }

    if (!user) {
        return { type: 'allow' }
    }

    if (!hasOrganizationMembership) {
        if (isOnboardingPath(pathname)) {
            return { type: 'allow' }
        }

        if (isWorkspacePath(pathname) || isAuthEntryPath(pathname) || !publicPath) {
            return { type: 'redirect', destination: getPostAuthRedirectPath(false) }
        }

        return { type: 'allow' }
    }

    if (isOnboardingPath(pathname)) {
        return { type: 'redirect', destination: getPostAuthRedirectPath(true) }
    }

    if (isAuthEntryPath(pathname)) {
        return { type: 'redirect', destination: getPostAuthRedirectPath(true) }
    }

    return { type: 'allow' }
}
