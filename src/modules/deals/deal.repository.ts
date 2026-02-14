import type { DealRecord } from './types'

const DEALS: DealRecord[] = [
    {
        id: 'deal-greenfuture-a',
        name: 'GreenFuture Corp',
        sector: 'Renewable Energy',
        stage: 'Series A',
        targetRaiseUsd: 2_400_000,
        status: 'active',
        completionPercent: 67,
        interestedInvestors: 12,
    },
    {
        id: 'deal-hydronet-seed',
        name: 'HydroNet Labs',
        sector: 'Clean Water',
        stage: 'Seed',
        targetRaiseUsd: 1_200_000,
        status: 'due_diligence',
        completionPercent: 54,
        interestedInvestors: 7,
    },
    {
        id: 'deal-medroute-seed',
        name: 'MedRoute AI',
        sector: 'Healthcare',
        stage: 'Seed',
        targetRaiseUsd: 1_800_000,
        status: 'watchlist',
        completionPercent: 39,
        interestedInvestors: 5,
    },
    {
        id: 'deal-agriwave-preseed',
        name: 'AgriWave Systems',
        sector: 'AgriTech',
        stage: 'Pre-Seed',
        targetRaiseUsd: 750_000,
        status: 'active',
        completionPercent: 42,
        interestedInvestors: 4,
    },
]

export function listDeals(): DealRecord[] {
    return DEALS
}
