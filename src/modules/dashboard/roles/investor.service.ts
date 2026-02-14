import type { DashboardProfile } from '../types'
import { getInvestorDealMetrics, listInvestorFeaturedDeals } from '@/modules/deals'

export type InvestorDashboardView = {
    greeting: string
    subtitle: string
    stats: Array<{
        label: string
        value: string
        note: string
        noteClassName: string
    }>
    recentDeals: Array<{
        id: string
        name: string
        sector: string
        stage: string
        targetRaise: string
    }>
}

export function getInvestorDashboardView(profile: DashboardProfile): InvestorDashboardView {
    const firstName = profile.full_name?.split(' ')[0]
    const dealMetrics = getInvestorDealMetrics()

    return {
        greeting: firstName ? `Welcome, ${firstName}` : 'Welcome',
        subtitle: 'Manage your portfolio and discover new opportunities.',
        stats: [
            {
                label: 'New Opportunities',
                value: String(dealMetrics.newOpportunities),
                note: 'Matching your criteria',
                noteClassName: 'text-blue-600',
            },
            {
                label: 'Ongoing Due Diligence',
                value: String(dealMetrics.dueDiligenceCount),
                note: 'Updates required',
                noteClassName: 'text-orange-600',
            },
            {
                label: 'Portfolio Companies',
                value: String(dealMetrics.portfolioCompanies),
                note: 'Stable performance',
                noteClassName: 'text-gray-400',
            },
        ],
        recentDeals: listInvestorFeaturedDeals(3),
    }
}
