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

export function getSignupEmailRedirectUrl(origin: string): string {
    return `${origin}/auth/callback`
}

export function getPostSignupRedirectPath(): string {
    return '/auth/login?registered=true'
}
