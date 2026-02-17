import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
    listAdvisorDirectory,
    listEngagementRequestsForCurrentUser,
    type AdvisorDirectoryEntry,
    type AdvisorDirectoryVerificationStatus,
    type EngagementRequest,
    type EngagementRequestStatus,
} from '@/modules/engagements'
import { getOnboardingPath } from '@/modules/onboarding'
import {
    evaluateOrganizationCapability,
    getOrganizationVerificationStatusByOrgId,
    getPrimaryOrganizationMembershipForUser,
    type OrganizationCapabilityGateResult,
    type OrganizationVerificationStatus,
} from '@/modules/organizations'
import { getResolvedProfileForUser } from '@/modules/profiles'
import { respondEngagementRequestAction, sendEngagementRequestAction } from './actions'

type WorkspaceTheme = 'light' | 'dark'

function toTitleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
}

function resolveWorkspaceTheme(value: string | string[] | undefined): WorkspaceTheme {
    if (typeof value === 'string' && value.toLowerCase() === 'light') {
        return 'light'
    }

    if (Array.isArray(value) && value.some((entry) => entry.toLowerCase() === 'light')) {
        return 'light'
    }

    return 'dark'
}

function formatDate(value: string): string {
    const parsed = Date.parse(value)
    if (Number.isNaN(parsed)) {
        return 'Unknown'
    }

    return new Date(parsed).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    })
}

function getVerificationBadge(status: OrganizationVerificationStatus): {
    label: string
    className: string
} {
    if (status === 'approved') {
        return {
            label: 'Approved',
            className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        }
    }

    if (status === 'pending') {
        return {
            label: 'Pending Review',
            className: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
        }
    }

    if (status === 'rejected') {
        return {
            label: 'Rejected',
            className: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
        }
    }

    return {
        label: 'Unverified',
        className: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
    }
}

function getCapabilityBadge(result: OrganizationCapabilityGateResult): {
    label: string
    className: string
} {
    if (result.allowed) {
        return {
            label: 'Enabled',
            className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        }
    }

    return {
        label: 'Blocked',
        className: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    }
}

function getAdvisorVerificationBadge(status: AdvisorDirectoryVerificationStatus): {
    label: string
    className: string
} {
    if (status === 'approved') {
        return {
            label: 'Approved',
            className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        }
    }

    if (status === 'pending') {
        return {
            label: 'Pending',
            className: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
        }
    }

    if (status === 'rejected') {
        return {
            label: 'Rejected',
            className: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
        }
    }

    return {
        label: 'Unverified',
        className: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
    }
}

function getEngagementStatusBadge(status: EngagementRequestStatus): {
    label: string
    className: string
} {
    if (status === 'accepted') {
        return {
            label: 'Accepted',
            className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        }
    }

    if (status === 'rejected') {
        return {
            label: 'Rejected',
            className: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
        }
    }

    if (status === 'cancelled') {
        return {
            label: 'Cancelled',
            className: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
        }
    }

    if (status === 'expired') {
        return {
            label: 'Expired',
            className: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
        }
    }

    return {
        label: 'Sent',
        className: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    }
}

function getUpcomingPages(input: { organizationType: 'startup' | 'advisor' | 'investor' }): Array<{
    title: string
    description: string
    eta: string
    href?: string
}> {
    const commonPages = [
        {
            title: 'Profile',
            description: 'Manage personal identity details and public presence.',
            eta: 'Available',
            href: '/workspace/profile',
        },
        {
            title: 'Settings',
            description: 'Update org details, team members, and verification data.',
            eta: 'Available',
            href: '/workspace/settings',
        },
    ]

    if (input.organizationType === 'startup') {
        return [
            ...commonPages,
            {
                title: 'Prep Room',
                description: 'Track advisor collaboration timeline, docs, and milestones.',
                eta: 'In Progress',
            },
            {
                title: 'Deal Room',
                description: 'Investor execution workspace with messaging and files.',
                eta: 'Planned',
            },
        ]
    }

    if (input.organizationType === 'advisor') {
        return [
            ...commonPages,
            {
                title: 'Engagement Inbox',
                description: 'Manage startup requests, responses, and prep-room activity.',
                eta: 'In Progress',
            },
            {
                title: 'Investor Intro Console',
                description: 'Send and track intros to verified investors.',
                eta: 'Planned',
            },
        ]
    }

    return [
        ...commonPages,
        {
            title: 'Intro Inbox',
            description: 'Review advisor intros and approve opportunities.',
            eta: 'Planned',
        },
        {
            title: 'Deal Room',
            description: 'Collaborate on execution with startup and advisor participants.',
            eta: 'Planned',
        },
    ]
}

function DashboardMetricCard(input: {
    label: string
    value: string
    helper: string
    className: string
}) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{input.label}</p>
            <p className={`mt-3 text-2xl font-black ${input.className}`}>{input.value}</p>
            <p className="mt-1 text-xs text-slate-500">{input.helper}</p>
        </div>
    )
}

function StartupEngagementSection(input: {
    advisorDirectory: AdvisorDirectoryEntry[]
    outgoingRequests: EngagementRequest[]
    accentActionClass: string
}) {
    const openAdvisorRequestIds = new Set(
        input.outgoingRequests
            .filter((request) => request.status === 'sent')
            .map((request) => request.advisor_org_id)
    )

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-300">Advisor Directory</p>
                    <p className="mt-1 text-sm text-slate-400">
                        Request advisory engagement from verified advisor organizations.
                    </p>
                </div>
            </div>

            {input.advisorDirectory.length === 0 ? (
                <p className="mt-4 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-400">
                    No advisors are available yet.
                </p>
            ) : (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                    <div className="grid grid-cols-[1.3fr_0.9fr_1fr] gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        <p>Advisor</p>
                        <p>Verification</p>
                        <p>Action</p>
                    </div>
                    <div className="divide-y divide-slate-800">
                        {input.advisorDirectory.map((advisor) => {
                            const verificationBadge = getAdvisorVerificationBadge(advisor.verification_status)
                            const canRequest = advisor.verification_status === 'approved'
                            const hasOpenRequest = openAdvisorRequestIds.has(advisor.id)

                            return (
                                <div key={advisor.id} className="grid grid-cols-[1.3fr_0.9fr_1fr] gap-3 px-4 py-4 text-sm">
                                    <div>
                                        <p className="font-semibold text-slate-100">{advisor.name}</p>
                                        <p className="mt-1 text-xs text-slate-400">{advisor.location ?? 'Location unavailable'}</p>
                                        {advisor.industry_tags.length > 0 ? (
                                            <p className="mt-1 text-xs text-slate-500">{advisor.industry_tags.join(', ')}</p>
                                        ) : null}
                                    </div>
                                    <p>
                                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${verificationBadge.className}`}>
                                            {verificationBadge.label}
                                        </span>
                                    </p>
                                    <div>
                                        {canRequest ? (
                                            hasOpenRequest ? (
                                                <span className="inline-flex rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-300">
                                                    Pending
                                                </span>
                                            ) : (
                                                <form action={sendEngagementRequestAction}>
                                                    <input type="hidden" name="advisorOrgId" value={advisor.id} />
                                                    <button
                                                        type="submit"
                                                        className={`rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] ${input.accentActionClass}`}
                                                    >
                                                        Request
                                                    </button>
                                                </form>
                                            )
                                        ) : (
                                            <button
                                                type="button"
                                                disabled
                                                className="cursor-not-allowed rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
                                            >
                                                Unavailable
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

function AdvisorEngagementSection(input: {
    incomingRequests: EngagementRequest[]
    verificationStatus: OrganizationVerificationStatus
}) {
    const canRespond = input.verificationStatus === 'approved'

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-300">Engagement Inbox</p>
            <p className="mt-1 text-sm text-slate-400">
                Review startup engagement requests and respond from this inbox.
            </p>
            {input.incomingRequests.length === 0 ? (
                <p className="mt-4 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-400">
                    No incoming requests yet.
                </p>
            ) : (
                <div className="mt-4 space-y-3">
                    {input.incomingRequests.map((request) => {
                        const statusBadge = getEngagementStatusBadge(request.status)

                        return (
                            <div key={request.id} className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-slate-100">
                                        {request.startup_org_name}
                                        <span className="ml-2 text-xs font-medium text-slate-500">
                                            {formatDate(request.created_at)}
                                        </span>
                                    </p>
                                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge.className}`}>
                                        {statusBadge.label}
                                    </span>
                                </div>
                                {request.status === 'sent' ? (
                                    canRespond ? (
                                        <form action={respondEngagementRequestAction} className="mt-3 flex items-center gap-2">
                                            <input type="hidden" name="requestId" value={request.id} />
                                            <button
                                                type="submit"
                                                name="decision"
                                                value="accepted"
                                                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-300 hover:bg-emerald-500/20"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                type="submit"
                                                name="decision"
                                                value="rejected"
                                                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-rose-300 hover:bg-rose-500/20"
                                            >
                                                Reject
                                            </button>
                                        </form>
                                    ) : (
                                        <p className="mt-3 text-sm font-semibold text-rose-300">
                                            Advisor verification approval is required before you can accept or reject requests.
                                        </p>
                                    )
                                ) : null}
                                {request.prep_room_id ? (
                                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">
                                        Prep room created for this engagement.
                                    </p>
                                ) : null}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function EngagementHistorySection(input: {
    title: string
    emptyMessage: string
    requests: EngagementRequest[]
}) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-300">{input.title}</p>
            {input.requests.length === 0 ? (
                <p className="mt-4 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-400">
                    {input.emptyMessage}
                </p>
            ) : (
                <div className="mt-4 space-y-2">
                    {input.requests.map((request) => {
                        const statusBadge = getEngagementStatusBadge(request.status)

                        return (
                            <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                                <p className="text-sm font-semibold text-slate-100">
                                    {request.startup_org_name} <span className="text-slate-500">to</span> {request.advisor_org_name}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">{formatDate(request.created_at)}</span>
                                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge.className}`}>
                                        {statusBadge.label}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default async function WorkspacePage({
    searchParams,
}: {
    searchParams: Promise<{ theme?: string | string[] }>
}) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const [profile, membership] = await Promise.all([
        getResolvedProfileForUser(supabase, user),
        getPrimaryOrganizationMembershipForUser(supabase, user),
    ])

    if (!membership) {
        redirect(getOnboardingPath())
    }

    const resolvedSearchParams = await searchParams
    const theme = resolveWorkspaceTheme(resolvedSearchParams.theme)
    const isLight = theme === 'light'
    const themeQuery = `theme=${theme}`
    const navPillActiveClass = isLight
        ? 'border-emerald-300 bg-emerald-100 text-emerald-900'
        : 'border-[#2CF8A2]/30 bg-[#2CF8A2]/15 text-[#9AFCD5]'
    const navPillInactiveClass = isLight
        ? 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
        : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
    const accentActionClass = isLight
        ? 'border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
        : 'border-[#2CF8A2]/30 bg-[#2CF8A2]/15 text-[#9AFCD5] hover:bg-[#2CF8A2]/25'

    const firstName = profile.full_name?.trim().split(/\s+/)[0] ?? 'there'
    const workspaceLabel = `${toTitleCase(membership.organization.type)} Workspace`
    const [verificationStatus, engagementRequests, advisorDirectory] = await Promise.all([
        getOrganizationVerificationStatusByOrgId(supabase, membership.org_id),
        listEngagementRequestsForCurrentUser(supabase),
        membership.organization.type === 'startup'
            ? listAdvisorDirectory(supabase)
            : Promise.resolve([] as AdvisorDirectoryEntry[]),
    ])
    const verificationBadge = getVerificationBadge(verificationStatus)
    const upcomingPages = getUpcomingPages({ organizationType: membership.organization.type })

    const introCapability =
        membership.organization.type === 'advisor'
            ? evaluateOrganizationCapability({
                capability: 'advisor_intro_send',
                organizationType: membership.organization.type,
                verificationStatus,
            })
            : membership.organization.type === 'investor'
                ? evaluateOrganizationCapability({
                    capability: 'investor_intro_receive',
                    organizationType: membership.organization.type,
                    verificationStatus,
                })
                : null
    const introCapabilityBadge = introCapability ? getCapabilityBadge(introCapability) : null

    const requestsForCurrentOrganization =
        membership.organization.type === 'startup'
            ? engagementRequests.filter((request) => request.startup_org_id === membership.org_id)
            : membership.organization.type === 'advisor'
                ? engagementRequests.filter((request) => request.advisor_org_id === membership.org_id)
                : []

    const pendingRequestsCount = requestsForCurrentOrganization.filter((request) => request.status === 'sent').length
    const acceptedRequestsCount = requestsForCurrentOrganization.filter((request) => request.status === 'accepted').length
    const prepRoomsCount = requestsForCurrentOrganization.filter((request) => !!request.prep_room_id).length

    return (
        <main className={`relative min-h-screen overflow-hidden ${isLight ? 'workspace-theme-light bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
            <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-[56vh] min-h-[420px] [mask-image:linear-gradient(to_bottom,black_0%,black_72%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_72%,transparent_100%)] ${isLight ? 'bg-[radial-gradient(circle_at_12%_8%,rgba(16,185,129,0.14),transparent_36%),radial-gradient(circle_at_90%_4%,rgba(14,165,233,0.12),transparent_34%)]' : 'bg-[radial-gradient(circle_at_12%_8%,rgba(44,248,162,0.20),transparent_36%),radial-gradient(circle_at_90%_4%,rgba(14,165,233,0.16),transparent_34%)]'}`}
            />
            <div className="relative mx-auto max-w-7xl px-4 py-10">
                <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                            <p className={`text-[11px] font-black uppercase tracking-[0.28em] ${isLight ? 'text-emerald-700' : 'text-[#8DF2C6]'}`}>
                                {workspaceLabel}
                            </p>
                            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
                                Welcome back, {firstName}
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
                                Command center for your organization activity, verification status, and engagement pipeline.
                            </p>
                        </div>
                        <div className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Organization</p>
                            <p className="text-base font-bold text-slate-100">{membership.organization.name}</p>
                            <p className="text-xs text-slate-400">
                                Role: <span className="font-semibold text-slate-200">{toTitleCase(membership.organization.type)}</span>
                                {' · '}
                                Membership: <span className="font-semibold text-slate-200">{toTitleCase(membership.member_role)}</span>
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${verificationBadge.className}`}>
                                    Verification: {verificationBadge.label}
                                </span>
                                {introCapability && introCapabilityBadge ? (
                                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${introCapabilityBadge.className}`}>
                                        Intro Access: {introCapabilityBadge.label}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-slate-700 bg-slate-900 p-1">
                            <Link
                                href={`/workspace?${themeQuery}`}
                                className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${navPillActiveClass}`}
                            >
                                Overview
                            </Link>
                            <Link
                                href={`/workspace/profile?${themeQuery}`}
                                className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${navPillInactiveClass}`}
                            >
                                Profile
                            </Link>
                            <Link
                                href={`/workspace/settings?${themeQuery}`}
                                className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${navPillInactiveClass}`}
                            >
                                Settings
                            </Link>
                            <Link
                                href="/workspace?theme=light"
                                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${isLight ? navPillActiveClass : navPillInactiveClass}`}
                            >
                                <svg
                                    aria-hidden="true"
                                    viewBox="0 0 24 24"
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <circle cx="12" cy="12" r="4" />
                                    <path d="M12 2v2.2M12 19.8V22M4.22 4.22l1.56 1.56M18.22 18.22l1.56 1.56M2 12h2.2M19.8 12H22M4.22 19.78l1.56-1.56M18.22 5.78l1.56-1.56" />
                                </svg>
                                Light
                            </Link>
                            <Link
                                href="/workspace?theme=dark"
                                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${!isLight ? navPillActiveClass : navPillInactiveClass}`}
                            >
                                <svg
                                    aria-hidden="true"
                                    viewBox="0 0 24 24"
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <path d="M20.3 14.7A8 8 0 1 1 9.3 3.7a7 7 0 1 0 11 11z" />
                                </svg>
                                Dark
                            </Link>
                        </div>
                        <form action="/auth/signout" method="post">
                            <button
                                type="submit"
                                className="rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-rose-300 hover:bg-rose-500/20"
                            >
                                Sign Out
                            </button>
                        </form>
                    </div>
                    {introCapability && !introCapability.allowed ? (
                        <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">
                            {introCapability.message}
                        </p>
                    ) : null}
                </section>

                <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <DashboardMetricCard
                        label="Pending Requests"
                        value={String(pendingRequestsCount)}
                        helper="Awaiting response in your pipeline"
                        className="text-slate-100"
                    />
                    <DashboardMetricCard
                        label="Accepted Requests"
                        value={String(acceptedRequestsCount)}
                        helper="Converted engagements"
                        className="text-slate-100"
                    />
                    <DashboardMetricCard
                        label="Prep Rooms"
                        value={String(prepRoomsCount)}
                        helper="Rooms created from accepted requests"
                        className="text-slate-100"
                    />
                    <DashboardMetricCard
                        label="Verification"
                        value={verificationBadge.label}
                        helper="Organization trust status"
                        className="text-slate-200"
                    />
                </section>

                <section className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
                    <div className="space-y-6">
                        {membership.organization.type === 'startup' ? (
                            <StartupEngagementSection
                                advisorDirectory={advisorDirectory}
                                outgoingRequests={engagementRequests.filter((request) => request.startup_org_id === membership.org_id)}
                                accentActionClass={accentActionClass}
                            />
                        ) : null}

                        {membership.organization.type === 'advisor' ? (
                            <AdvisorEngagementSection
                                incomingRequests={engagementRequests.filter((request) => request.advisor_org_id === membership.org_id)}
                                verificationStatus={verificationStatus}
                            />
                        ) : null}

                        {membership.organization.type === 'investor' ? (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                                <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-300">Investor Activity</p>
                                <p className="mt-1 text-sm text-slate-400">
                                    Advisor intro inbox and deal-room execution views are planned next.
                                </p>
                            </div>
                        ) : null}

                        <EngagementHistorySection
                            title="Recent Engagement Activity"
                            emptyMessage="No engagement activity for your organization yet."
                            requests={requestsForCurrentOrganization.slice(0, 8)}
                        />
                    </div>

                    <aside className="space-y-6">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-300">Upcoming Pages</p>
                            <p className="mt-1 text-sm text-slate-400">
                                Product roadmap items connected to your workspace role.
                            </p>
                            <div className="mt-4 space-y-3">
                                {upcomingPages.map((page) => (
                                    <div key={page.title} className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-slate-100">{page.title}</p>
                                            <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300">
                                                {page.eta}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-400">{page.description}</p>
                                        {page.href ? (
                                            <Link
                                                href={`${page.href}?${themeQuery}`}
                                                className={`mt-3 inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${accentActionClass}`}
                                            >
                                                Open
                                            </Link>
                                        ) : (
                                            <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                                Coming Soon
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-300">Workspace Note</p>
                            <p className="mt-2 text-sm text-slate-400">
                                This dashboard is now operational for core identity, verification visibility, and startup-advisor engagement.
                            </p>
                        </div>
                    </aside>
                </section>
            </div>
        </main>
    )
}
