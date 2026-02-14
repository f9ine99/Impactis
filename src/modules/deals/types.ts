export type DealStatus = 'active' | 'due_diligence' | 'watchlist'

export type DealRecord = {
    id: string
    name: string
    sector: string
    stage: string
    targetRaiseUsd: number
    status: DealStatus
    completionPercent: number
    interestedInvestors: number
}

export type InvestorDealCard = {
    id: string
    name: string
    sector: string
    stage: string
    targetRaise: string
}

export type FounderDealMetrics = {
    dealRoomStatus: 'Active' | 'Inactive'
    dealRoomCompletionPercent: number
    investorInterests: number
}

export type InvestorDealMetrics = {
    newOpportunities: number
    dueDiligenceCount: number
    portfolioCompanies: number
}
