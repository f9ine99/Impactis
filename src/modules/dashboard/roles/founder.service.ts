import type { DashboardProfile } from '../types'
import { getFounderDealMetrics } from '@/modules/deals'

export type FounderDashboardView = {
    greeting: string
    subtitle: string
    stats: Array<{
        label: string
        value: string
        note: string
        noteClassName: string
        progressPercent?: number
    }>
    nextSteps: Array<{
        number: number
        title: string
        description: string
        completed: boolean
    }>
}

export function getFounderDashboardView(profile: DashboardProfile): FounderDashboardView {
    const firstName = profile.full_name?.split(' ')[0]
    const dealMetrics = getFounderDealMetrics()

    return {
        greeting: firstName ? `Welcome back, ${firstName}!` : 'Welcome back!',
        subtitle: 'Here is what is happening with your venture today.',
        stats: [
            {
                label: 'Deal Room Status',
                value: dealMetrics.dealRoomStatus,
                note: `${dealMetrics.dealRoomCompletionPercent}% complete`,
                noteClassName: 'text-gray-400',
                progressPercent: dealMetrics.dealRoomCompletionPercent,
            },
            {
                label: 'Investor Interests',
                value: String(dealMetrics.investorInterests),
                note: 'Across active opportunities',
                noteClassName: 'text-green-600',
            },
            {
                label: 'Profile Views',
                value: '248',
                note: '+15% from last month',
                noteClassName: 'text-green-600',
            },
        ],
        nextSteps: [
            {
                number: 1,
                title: 'Complete your pitch deck',
                description: 'Upload your latest PDF to the deal room.',
                completed: true,
            },
            {
                number: 2,
                title: 'Schedule investor calls',
                description: 'Connect your calendar to start booking meetings.',
                completed: false,
            },
        ],
    }
}
