import { listDeals } from './deal.repository'
import type { FounderDealMetrics, InvestorDealCard, InvestorDealMetrics } from './types'

function formatUsdCompact(amount: number): string {
    if (amount >= 1_000_000) {
        return `$${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
    }

    if (amount >= 1_000) {
        return `$${(amount / 1_000).toFixed(0)}K`
    }

    return `$${amount}`
}

export function getFounderDealMetrics(): FounderDealMetrics {
    const deals = listDeals()
    const activeDeals = deals.filter((deal) => deal.status === 'active')
    const primaryDeal = activeDeals[0] ?? deals[0]

    if (!primaryDeal) {
        return {
            dealRoomStatus: 'Inactive',
            dealRoomCompletionPercent: 0,
            investorInterests: 0,
        }
    }

    const investorInterests = deals.reduce((sum, deal) => sum + deal.interestedInvestors, 0)

    return {
        dealRoomStatus: 'Active',
        dealRoomCompletionPercent: primaryDeal.completionPercent,
        investorInterests,
    }
}

export function getInvestorDealMetrics(): InvestorDealMetrics {
    const deals = listDeals()

    const newOpportunities = deals.filter((deal) => deal.status === 'active').length
    const dueDiligenceCount = deals.filter((deal) => deal.status === 'due_diligence').length

    return {
        newOpportunities,
        dueDiligenceCount,
        portfolioCompanies: 8,
    }
}

export function listInvestorFeaturedDeals(limit = 3): InvestorDealCard[] {
    return listDeals()
        .slice(0, limit)
        .map((deal) => ({
            id: deal.id,
            name: deal.name,
            sector: deal.sector,
            stage: deal.stage,
            targetRaise: formatUsdCompact(deal.targetRaiseUsd),
        }))
}
