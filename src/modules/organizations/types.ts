export type OrganizationType = 'startup' | 'investor' | 'advisor'
export type OrganizationMemberRole = 'owner' | 'admin' | 'member'
export type OrganizationVerificationStatus = 'unverified' | 'pending' | 'approved' | 'rejected'
export type OrganizationLifecycleStatus = 'active' | 'suspended' | 'deleted'
export type OrganizationCapability = 'advisor_intro_send' | 'investor_intro_receive' | 'investor_intro_accept'
export type OrganizationCapabilityGateReason = 'ok' | 'missing_membership' | 'wrong_org_type' | 'verification_required'

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

export type OrganizationVerification = {
    org_id: string
    status: OrganizationVerificationStatus
    reviewed_by: string | null
    reviewed_at: string | null
    notes: string | null
}

export type OrganizationMembership = {
    org_id: string
    user_id: string
    member_role: OrganizationMemberRole
    created_at: string
    organization: Organization
}

export type OrganizationVerificationOverview = {
    organization: Organization
    verification: OrganizationVerification
}

export type OrganizationCapabilityGateResult = {
    capability: OrganizationCapability
    allowed: boolean
    reason: OrganizationCapabilityGateReason
    requiredOrganizationType: OrganizationType
    organizationType: OrganizationType | null
    verificationStatus: OrganizationVerificationStatus | null
    message: string
}

export type CreateOrganizationInput = {
    type: OrganizationType
    name: string
    location?: string | null
    industryTags?: string[]
}
