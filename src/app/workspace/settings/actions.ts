'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
    getPrimaryOrganizationMembershipForUser,
    parseIndustryTags,
    updateMyOrganizationSettings,
} from '@/modules/organizations'

export type UpdateOrganizationSettingsActionState = {
    error: string | null
    success: string | null
}

function normalizeText(value: FormDataEntryValue | null): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

export async function updateOrganizationSettingsAction(
    _previousState: UpdateOrganizationSettingsActionState,
    formData: FormData
): Promise<UpdateOrganizationSettingsActionState> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Your session has expired. Please log in again.', success: null }
    }

    const membership = await getPrimaryOrganizationMembershipForUser(supabase, user)
    if (!membership) {
        return { error: 'Complete onboarding before updating organization settings.', success: null }
    }

    if (membership.member_role !== 'owner' && membership.member_role !== 'admin') {
        return { error: 'Only organization owner or admin can update settings.', success: null }
    }

    const organizationName = normalizeText(formData.get('organizationName'))
    const organizationLocation = normalizeText(formData.get('organizationLocation'))
    const organizationIndustryTagsRaw = normalizeText(formData.get('organizationIndustryTags')) ?? ''
    const industryTags = parseIndustryTags(organizationIndustryTagsRaw)

    if (!organizationName || organizationName.length < 2) {
        return { error: 'Organization name must be at least 2 characters.', success: null }
    }

    try {
        await updateMyOrganizationSettings(supabase, {
            name: organizationName,
            location: organizationLocation,
            industryTags,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update organization settings right now.'
        return { error: message, success: null }
    }

    revalidatePath('/workspace')
    revalidatePath('/workspace/settings')

    return { error: null, success: 'Organization settings updated successfully.' }
}
