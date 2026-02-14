import type { DashboardProfile } from '../types'

export type AdvisorDashboardView = {
    title: string
    subtitle: string
    stats: Array<{
        label: string
        value: string
        note: string
        noteClassName: string
    }>
    meetings: Array<{
        id: string
        title: string
        time: string
        actionLabel: string
        emphasized: boolean
    }>
}

export function getAdvisorDashboardView(profile: DashboardProfile): AdvisorDashboardView {
    const firstName = profile.full_name?.split(' ')[0]

    return {
        title: firstName ? `Advisor Portal, ${firstName}` : 'Advisor Portal',
        subtitle: 'Guide clients and manage your engagements.',
        stats: [
            {
                label: 'Active Clients',
                value: '4',
                note: 'All sessions on track',
                noteClassName: 'text-green-600',
            },
            {
                label: 'Service Requests',
                value: '7',
                note: 'Pending review',
                noteClassName: 'text-blue-600',
            },
            {
                label: 'Earnings (MTD)',
                value: '$8,450',
                note: '+12% vs last month',
                noteClassName: 'text-green-600',
            },
        ],
        meetings: [
            {
                id: 'strategic-review',
                title: 'Strategic Review - EcoTech',
                time: 'Today at 2:00 PM',
                actionLabel: 'Join Call',
                emphasized: true,
            },
            {
                id: 'due-diligence-sync',
                title: 'Due Diligence Sync',
                time: 'Tomorrow at 10:00 AM',
                actionLabel: 'Reschedule',
                emphasized: false,
            },
        ],
    }
}
