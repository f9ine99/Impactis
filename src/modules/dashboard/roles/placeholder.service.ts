import type { DashboardProfile } from '../types'

type PlaceholderStat = {
    label: string
    value: string
    note: string
}

export type PlaceholderDashboardView = {
    badge: string
    title: string
    subtitle: string
    stats: PlaceholderStat[]
    plannedSections: string[]
}

function getFirstName(profile: DashboardProfile): string | null {
    return profile.full_name?.trim().split(/\s+/)[0] ?? null
}

function getFounderPlaceholderView(profile: DashboardProfile): PlaceholderDashboardView {
    const firstName = getFirstName(profile)

    return {
        badge: 'Founder Placeholder',
        title: firstName ? `Founder workspace for ${firstName}` : 'Founder workspace',
        subtitle: 'This dashboard is in placeholder mode while we connect live pipeline and fundraising widgets.',
        stats: [
            { label: 'Pipeline Widgets', value: 'Coming Soon', note: 'Deal-room metrics will appear here.' },
            { label: 'Investor Signals', value: 'Coming Soon', note: 'Interest and outreach signals are being integrated.' },
            { label: 'Milestone Tracking', value: 'Coming Soon', note: 'Product and growth milestones will be available.' },
        ],
        plannedSections: [
            'Deal room readiness checklist',
            'Investor activity timeline',
            'Fundraising milestone tracker',
        ],
    }
}

function getInvestorPlaceholderView(profile: DashboardProfile): PlaceholderDashboardView {
    const firstName = getFirstName(profile)

    return {
        badge: 'Investor Placeholder',
        title: firstName ? `Investor workspace for ${firstName}` : 'Investor workspace',
        subtitle: 'This dashboard is in placeholder mode while we connect sourcing, diligence, and portfolio panels.',
        stats: [
            { label: 'Deal Sourcing', value: 'Coming Soon', note: 'Matched opportunities feed will load here.' },
            { label: 'Diligence Queue', value: 'Coming Soon', note: 'Open diligence tasks and updates are in progress.' },
            { label: 'Portfolio Health', value: 'Coming Soon', note: 'Portfolio summaries and changes will be available.' },
        ],
        plannedSections: [
            'Curated opportunities stream',
            'Due diligence board',
            'Portfolio watchlist and alerts',
        ],
    }
}

function getAdvisorPlaceholderView(profile: DashboardProfile): PlaceholderDashboardView {
    const firstName = getFirstName(profile)

    return {
        badge: 'Advisor Placeholder',
        title: firstName ? `Advisor workspace for ${firstName}` : 'Advisor workspace',
        subtitle: 'This dashboard is in placeholder mode while we connect session management and advisory insights.',
        stats: [
            { label: 'Client Sessions', value: 'Coming Soon', note: 'Upcoming advisory sessions will appear here.' },
            { label: 'Requests Inbox', value: 'Coming Soon', note: 'Founder and investor requests are being wired.' },
            { label: 'Performance Summary', value: 'Coming Soon', note: 'Utilization and outcomes dashboard is planned.' },
        ],
        plannedSections: [
            'Upcoming calls and prep notes',
            'Open advisory requests',
            'Engagement outcome tracker',
        ],
    }
}

function getAdminPlaceholderView(profile: DashboardProfile): PlaceholderDashboardView {
    const firstName = getFirstName(profile)

    return {
        badge: 'Admin Placeholder',
        title: firstName ? `Admin workspace for ${firstName}` : 'Admin workspace',
        subtitle: 'This dashboard is in placeholder mode while we connect platform governance and operations data.',
        stats: [
            { label: 'Platform Overview', value: 'Coming Soon', note: 'Usage and growth metrics will appear here.' },
            { label: 'Verification Queue', value: 'Coming Soon', note: 'Pending reviews and moderation actions are in progress.' },
            { label: 'System Health', value: 'Coming Soon', note: 'Operational status panels will be enabled here.' },
        ],
        plannedSections: [
            'Platform activity timeline',
            'Moderation and verification queue',
            'Reliability and incident summary',
        ],
    }
}

export function getPlaceholderDashboardView(profile: DashboardProfile): PlaceholderDashboardView {
    switch (profile.role) {
        case 'founder':
            return getFounderPlaceholderView(profile)
        case 'investor':
            return getInvestorPlaceholderView(profile)
        case 'advisor':
            return getAdvisorPlaceholderView(profile)
        case 'admin':
            return getAdminPlaceholderView(profile)
        default:
            return {
                badge: 'Dashboard Placeholder',
                title: 'Workspace',
                subtitle: 'Your dashboard is currently in placeholder mode.',
                stats: [
                    { label: 'Module A', value: 'Coming Soon', note: 'This section is being prepared.' },
                    { label: 'Module B', value: 'Coming Soon', note: 'This section is being prepared.' },
                    { label: 'Module C', value: 'Coming Soon', note: 'This section is being prepared.' },
                ],
                plannedSections: ['Core widgets', 'Activity feed', 'Settings panel'],
            }
    }
}
