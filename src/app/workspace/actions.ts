'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
    createEngagementRequestForCurrentUser,
    respondToEngagementRequestForCurrentUser,
    type EngagementRequestDecision,
} from '@/modules/engagements'
import {
    getOrganizationVerificationStatusByOrgId,
    getPrimaryOrganizationMembershipForUser,
} from '@/modules/organizations'

function normalizeText(value: FormDataEntryValue | null): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function normalizeDecision(value: FormDataEntryValue | null): EngagementRequestDecision | null {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = value.trim().toLowerCase()
    if (normalized === 'accepted' || normalized === 'rejected') {
        return normalized
    }

    return null
}

export async function sendEngagementRequestAction(formData: FormData): Promise<void> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const membership = await getPrimaryOrganizationMembershipForUser(supabase, user)
    if (!membership || membership.organization.type !== 'startup') {
        throw new Error('Only startup organizations can send engagement requests.')
    }

    const advisorOrgId = normalizeText(formData.get('advisorOrgId'))
    if (!advisorOrgId) {
        throw new Error('Advisor organization is required.')
    }

    await createEngagementRequestForCurrentUser(supabase, advisorOrgId)
    revalidatePath('/workspace')
}

export async function respondEngagementRequestAction(formData: FormData): Promise<void> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const membership = await getPrimaryOrganizationMembershipForUser(supabase, user)
    if (!membership || membership.organization.type !== 'advisor') {
        throw new Error('Only advisor organizations can process engagement requests.')
    }

    const verificationStatus = await getOrganizationVerificationStatusByOrgId(supabase, membership.org_id)
    if (verificationStatus !== 'approved') {
        throw new Error('Advisor verification approval is required before processing requests.')
    }

    const requestId = normalizeText(formData.get('requestId'))
    const decision = normalizeDecision(formData.get('decision'))
    if (!requestId || !decision) {
        throw new Error('Missing engagement response parameters.')
    }

    await respondToEngagementRequestForCurrentUser(supabase, {
        requestId,
        decision,
    })

    revalidatePath('/workspace')
}
