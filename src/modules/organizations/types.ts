export type OrganizationType = 'startup' | 'investor' | 'advisor'
export type OrganizationMemberRole = 'owner' | 'admin' | 'member'
export type OrganizationVerificationStatus = 'unverified' | 'pending' | 'approved' | 'rejected'
export type OrganizationLifecycleStatus = 'active' | 'suspended' | 'deleted'

export const ORGANIZATION_TYPES: OrganizationType[] = ['startup', 'investor', 'advisor']
export const ORGANIZATION_MEMBER_ROLES: OrganizationMemberRole[] = ['owner', 'admin', 'member']

export type Organization = {
    id: string
    type: OrganizationType
    name: string
    location: string | null
    industry_tags: string[]
    created_at: string
}

export type OrganizationMembership = {
    org_id: string
    user_id: string
    member_role: OrganizationMemberRole
    created_at: string
    organization: Organization
}

export type CreateOrganizationInput = {
    type: OrganizationType
    name: string
    location?: string | null
    industryTags?: string[]
}
