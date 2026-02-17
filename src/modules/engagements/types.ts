export type EngagementRequestStatus = 'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled'
export type EngagementRequestDecision = 'accepted' | 'rejected'
export type AdvisorDirectoryVerificationStatus = 'unverified' | 'pending' | 'approved' | 'rejected'

export type AdvisorDirectoryEntry = {
    id: string
    name: string
    location: string | null
    industry_tags: string[]
    verification_status: AdvisorDirectoryVerificationStatus
}

export type EngagementRequest = {
    id: string
    startup_org_id: string
    startup_org_name: string
    advisor_org_id: string
    advisor_org_name: string
    status: EngagementRequestStatus
    created_at: string
    responded_at: string | null
    prep_room_id: string | null
}
