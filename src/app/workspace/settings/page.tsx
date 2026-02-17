import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingPath } from '@/modules/onboarding'
import {
    getOrganizationVerificationStatusByOrgId,
    getPrimaryOrganizationMembershipForUser,
    type OrganizationVerificationStatus,
} from '@/modules/organizations'
import SettingsForm from './SettingsForm'

function toTitleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
}

function resolveTheme(value: string | string[] | undefined): 'light' | 'dark' {
    if (typeof value === 'string' && value.toLowerCase() === 'light') {
        return 'light'
    }

    if (Array.isArray(value) && value.some((entry) => entry.toLowerCase() === 'light')) {
        return 'light'
    }

    return 'dark'
}

function getVerificationBadge(status: OrganizationVerificationStatus): {
    label: string
    className: string
} {
    if (status === 'approved') {
        return {
            label: 'Approved',
            className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        }
    }

    if (status === 'pending') {
        return {
            label: 'Pending Review',
            className: 'border-amber-200 bg-amber-50 text-amber-800',
        }
    }

    if (status === 'rejected') {
        return {
            label: 'Rejected',
            className: 'border-rose-200 bg-rose-50 text-rose-800',
        }
    }

    return {
        label: 'Unverified',
        className: 'border-slate-200 bg-slate-50 text-slate-700',
    }
}

export default async function WorkspaceSettingsPage({
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

    const membership = await getPrimaryOrganizationMembershipForUser(supabase, user)
    if (!membership) {
        redirect(getOnboardingPath())
    }

    const resolvedSearchParams = await searchParams
    const theme = resolveTheme(resolvedSearchParams.theme)
    const verificationStatus = await getOrganizationVerificationStatusByOrgId(supabase, membership.org_id)
    const verificationBadge = getVerificationBadge(verificationStatus)
    const canEdit = membership.member_role === 'owner' || membership.member_role === 'admin'
    const industryTags =
        membership.organization.industry_tags.length > 0
            ? membership.organization.industry_tags.join(', ')
            : 'No industry tags set'

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-20">
            <section className="mx-auto max-w-3xl rounded-3xl border border-gray-100 bg-white p-10 shadow-xl">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0B3D2E]/60">
                    Workspace Settings
                </p>
                <h1 className="mt-4 text-3xl font-black text-gray-900">
                    Organization Settings
                </h1>
                <p className="mt-3 text-gray-600">
                    Review and manage your organization details.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-gray-300 bg-gray-50 p-1">
                        <Link
                            href={`/workspace?theme=${theme}`}
                            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-700 hover:border-gray-400"
                        >
                            Overview
                        </Link>
                        <Link
                            href={`/workspace/profile?theme=${theme}`}
                            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-700 hover:border-gray-400"
                        >
                            Profile
                        </Link>
                        <Link
                            href={`/workspace/settings?theme=${theme}`}
                            className="rounded-full border border-[#0B3D2E]/30 bg-[#0B3D2E]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0B3D2E]"
                        >
                            Settings
                        </Link>
                        <Link
                            href="/workspace/settings?theme=light"
                            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${theme === 'light' ? 'border-[#0B3D2E]/30 bg-[#0B3D2E]/10 text-[#0B3D2E]' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}`}
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
                            href="/workspace/settings?theme=dark"
                            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${theme === 'dark' ? 'border-[#0B3D2E]/30 bg-[#0B3D2E]/10 text-[#0B3D2E]' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}`}
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
                            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-rose-700 hover:bg-rose-100"
                        >
                            Sign Out
                        </button>
                    </form>
                </div>

                <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Organization Name</p>
                    <p className="mt-2 text-base font-semibold text-gray-900">{membership.organization.name}</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Organization Type</p>
                            <p className="mt-2 text-sm font-semibold text-gray-900">
                                {toTitleCase(membership.organization.type)}
                            </p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Membership Role</p>
                            <p className="mt-2 text-sm font-semibold text-gray-900">
                                {toTitleCase(membership.member_role)}
                            </p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 sm:col-span-2">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Verification</p>
                            <p className="mt-2">
                                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${verificationBadge.className}`}>
                                    {verificationBadge.label}
                                </span>
                            </p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 sm:col-span-2">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Industry Tags</p>
                            <p className="mt-2 text-sm font-semibold text-gray-900">{industryTags}</p>
                        </div>
                    </div>
                </div>

                <SettingsForm
                    defaultOrganizationName={membership.organization.name}
                    defaultOrganizationLocation={membership.organization.location ?? ''}
                    defaultOrganizationIndustryTags={membership.organization.industry_tags.join(', ')}
                    canEdit={canEdit}
                />

                <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                        href={`/workspace?theme=${theme}`}
                        className="inline-flex items-center justify-center rounded-xl bg-[#0B3D2E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#082a20]"
                    >
                        Back To Workspace
                    </Link>
                </div>
            </section>
        </main>
    )
}
