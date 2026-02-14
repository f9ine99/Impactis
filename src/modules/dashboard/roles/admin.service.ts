import type { DashboardProfile } from '../types'

export type AdminDashboardView = {
    title: string
    subtitle: string
    stats: Array<{
        label: string
        value: string
        valueClassName?: string
    }>
    activity: Array<{
        id: string
        userEmail: string
        userType: string
        action: string
        status: string
        time: string
    }>
}

export function getAdminDashboardView(profile: DashboardProfile): AdminDashboardView {
    const firstName = profile.full_name?.split(' ')[0]

    return {
        title: firstName ? `Admin Control Center, ${firstName}` : 'Admin Control Center',
        subtitle: 'Platform oversight and governance.',
        stats: [
            { label: 'Total Users', value: '1,284' },
            { label: 'Pending Verifications', value: '42' },
            { label: 'Active Deals', value: '156' },
            { label: 'System Status', value: 'Healthy', valueClassName: 'text-green-600' },
        ],
        activity: [1, 2, 3, 4, 5].map((i) => ({
            id: `activity-${i}`,
            userEmail: `User_${i}@example.com`,
            userType: 'Startup',
            action: 'Profile Update',
            status: 'Success',
            time: '2 mins ago',
        })),
    }
}
