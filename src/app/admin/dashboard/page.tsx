import DashboardLayout from '@/components/DashboardLayout'
import DashboardPlaceholder from '@/components/DashboardPlaceholder'
import { createClient } from '@/lib/supabase/server'
import { getDashboardPathForRole } from '@/modules/auth'
import { getOnboardingPath } from '@/modules/onboarding'
import { getDashboardAccessState, getPlaceholderDashboardView } from '@/modules/dashboard'
import { getNotificationFeedForUser } from '@/modules/notifications'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
    const supabase = await createClient()
    const accessState = await getDashboardAccessState(supabase)

    if (accessState.status === 'unauthenticated') {
        redirect('/auth/login')
    }

    if (accessState.status === 'onboarding') {
        redirect(getOnboardingPath())
    }

    if (accessState.profile.role !== 'admin') {
        redirect(getDashboardPathForRole(accessState.profile.role))
    }

    const view = getPlaceholderDashboardView(accessState.profile)
    const notifications = await getNotificationFeedForUser({
        supabase,
        userId: accessState.profile.id,
        role: accessState.profile.role,
    })

    return (
        <DashboardLayout profile={accessState.profile} notifications={notifications} activeNav="dashboard">
            <DashboardPlaceholder view={view} />
        </DashboardLayout>
    )
}
