'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getPrimaryOrganizationMembershipForUser } from '@/modules/organizations'
import { updateProfileForUser } from '@/modules/profiles'

export type UpdateProfileActionState = {
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

export async function updateProfileAction(
    _previousState: UpdateProfileActionState,
    formData: FormData
): Promise<UpdateProfileActionState> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Your session has expired. Please log in again.', success: null }
    }

    const membership = await getPrimaryOrganizationMembershipForUser(supabase, user)
    if (!membership) {
        return { error: 'Complete onboarding before editing your profile.', success: null }
    }

    const fullName = normalizeText(formData.get('fullName'))
    const location = normalizeText(formData.get('location'))
    const bio = normalizeText(formData.get('bio'))

    if (fullName && fullName.length < 2) {
        return { error: 'Full name must be at least 2 characters.', success: null }
    }

    if (bio && bio.length > 500) {
        return { error: 'Bio cannot be longer than 500 characters.', success: null }
    }

    try {
        await updateProfileForUser(supabase, user, {
            fullName,
            location,
            bio,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update profile right now.'
        return { error: message, success: null }
    }

    revalidatePath('/workspace')
    revalidatePath('/workspace/profile')

    return { error: null, success: 'Profile updated successfully.' }
}
