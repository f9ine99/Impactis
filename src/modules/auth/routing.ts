import type { AppRole } from '@/modules/profiles'

const PUBLIC_PATHS = new Set([
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/signout',
    '/auth/reset-password',
    '/auth/callback',
    '/auth/update-password',
    '/auth/auth-code-error',
])

const AUTH_ENTRY_PATHS = new Set(['/auth/login', '/auth/signup'])
const WORKSPACE_PATH = '/workspace'

const ROLE_ROOT_PATHS: Record<AppRole, string> = {
    founder: '/founder',
    investor: '/investor',
    advisor: '/advisor',
    admin: '/admin',
}

function matchesRoutePrefix(pathname: string, routePrefix: string): boolean {
    return pathname === routePrefix || pathname.startsWith(`${routePrefix}/`)
}

export function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.has(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api')
}

export function isAuthEntryPath(pathname: string): boolean {
    return AUTH_ENTRY_PATHS.has(pathname)
}

export function getDashboardPathForRole(_role: AppRole | null | undefined): string {
    void _role
    return WORKSPACE_PATH
}

export function isWorkspacePath(pathname: string): boolean {
    return pathname === WORKSPACE_PATH
}

export function getProtectedRoleForPath(pathname: string): AppRole | null {
    for (const [role, routePrefix] of Object.entries(ROLE_ROOT_PATHS) as Array<[AppRole, string]>) {
        if (matchesRoutePrefix(pathname, routePrefix)) {
            return role
        }
    }

    return null
}
