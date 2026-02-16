import type { AppRole } from '@/modules/profiles'

export type SignupRole = Extract<AppRole, 'founder' | 'investor' | 'advisor'>

export const SIGNUP_ROLES: SignupRole[] = ['founder', 'investor', 'advisor']

export type SignupFormPayload = {
    fullName: string
    role: string
    company: string
    location: string
    bio: string
    industry_tags: string[]
}

const AUTH_CALLBACK_PATH = '/auth/callback'
const UPDATE_PASSWORD_PATH = '/auth/update-password'

type SignupMetadata = {
    full_name: string
    role: SignupRole | null
    company: string
    location: string
    bio: string
    industry_tags: string[]
}

function isSignupRole(value: unknown): value is SignupRole {
    return typeof value === 'string' && SIGNUP_ROLES.includes(value as SignupRole)
}

function normalizeBaseUrl(value: string): string {
    return value.trim().replace(/\/+$/, '')
}

export function getSignupRoleFromSearchParams(searchParams: URLSearchParams): SignupRole | null {
    const roleParam = searchParams.get('role')
    return isSignupRole(roleParam) ? roleParam : null
}

export function buildSignupMetadata(formData: SignupFormPayload): SignupMetadata {
    // This metadata only seeds `public.profiles` at signup time via DB trigger.
    // It is scrubbed from `auth.users.raw_user_meta_data` after sync.
    return {
        full_name: formData.fullName,
        role: isSignupRole(formData.role) ? formData.role : null,
        company: formData.company,
        location: formData.location,
        bio: formData.bio,
        industry_tags: formData.industry_tags,
    }
}

export function getAuthRedirectBaseUrl(origin: string): string {
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!configuredSiteUrl) {
        return normalizeBaseUrl(origin)
    }

    const normalizedConfiguredSiteUrl = normalizeBaseUrl(configuredSiteUrl)
    if (!normalizedConfiguredSiteUrl) {
        return normalizeBaseUrl(origin)
    }

    try {
        return new URL(normalizedConfiguredSiteUrl).origin
    } catch {
        return normalizedConfiguredSiteUrl
    }
}

export function getSignupEmailRedirectUrl(origin: string): string {
    return `${getAuthRedirectBaseUrl(origin)}${AUTH_CALLBACK_PATH}`
}

export function getResetPasswordEmailRedirectUrl(origin: string): string {
    const nextPath = encodeURIComponent(UPDATE_PASSWORD_PATH)
    return `${getAuthRedirectBaseUrl(origin)}${AUTH_CALLBACK_PATH}?next=${nextPath}`
}

export function getPostSignupRedirectPath(): string {
    return '/auth/login?registered=true'
}
