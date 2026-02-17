import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingPath } from '@/modules/onboarding'
import { getPrimaryOrganizationMembershipForUser } from '@/modules/organizations'
import { getResolvedProfileForUser } from '@/modules/profiles'
import ProfileForm from './ProfileForm'

type WorkspaceTheme = 'light' | 'dark'

function getValue(value: string | null): string {
    return value && value.trim().length > 0 ? value : 'Not set yet'
}

function resolveTheme(value: string | string[] | undefined): WorkspaceTheme {
    if (typeof value === 'string' && value.toLowerCase() === 'light') {
        return 'light'
    }

    if (Array.isArray(value) && value.some((entry) => entry.toLowerCase() === 'light')) {
        return 'light'
    }

    return 'dark'
}

function getProfileCompleteness(input: {
    fullName: string | null
    location: string | null
    bio: string | null
}): {
    completed: number
    total: number
    percent: number
    label: string
    className: string
} {
    const total = 3
    let completed = 0

    if (input.fullName && input.fullName.trim().length > 1) {
        completed += 1
    }

    if (input.location && input.location.trim().length > 1) {
        completed += 1
    }

    if (input.bio && input.bio.trim().length >= 20) {
        completed += 1
    }

    const percent = Math.round((completed / total) * 100)

    if (percent === 100) {
        return { completed, total, percent, label: 'Excellent', className: 'text-emerald-300' }
    }

    if (percent >= 67) {
        return { completed, total, percent, label: 'Good', className: 'text-cyan-300' }
    }

    if (percent > 0) {
        return { completed, total, percent, label: 'In Progress', className: 'text-amber-300' }
    }

    return { completed, total, percent, label: 'Getting Started', className: 'text-slate-300' }
}

export default async function WorkspaceProfilePage({
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
    const theme = resolveTheme(resolvedSearchParams.theme)
    const isLight = theme === 'light'
    const themeQuery = `theme=${theme}`
    const navPillActiveClass = isLight
        ? 'border-emerald-300 bg-emerald-100 text-emerald-900'
        : 'border-[#2CF8A2]/30 bg-[#2CF8A2]/15 text-[#9AFCD5]'
    const navPillInactiveClass = isLight
        ? 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
        : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'

    const firstName = profile.full_name?.trim().split(/\s+/)[0] ?? 'there'
    const initial = firstName.charAt(0).toUpperCase()
    const completeness = getProfileCompleteness({
        fullName: profile.full_name,
        location: profile.location,
        bio: profile.bio,
    })

    return (
        <main className={`relative min-h-screen overflow-hidden ${isLight ? 'workspace-theme-light bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
            <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-[52vh] min-h-[380px] [mask-image:linear-gradient(to_bottom,black_0%,black_72%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_72%,transparent_100%)] ${isLight ? 'bg-[radial-gradient(circle_at_12%_8%,rgba(16,185,129,0.14),transparent_36%),radial-gradient(circle_at_90%_4%,rgba(14,165,233,0.12),transparent_34%)]' : 'bg-[radial-gradient(circle_at_12%_8%,rgba(44,248,162,0.20),transparent_36%),radial-gradient(circle_at_90%_4%,rgba(14,165,233,0.16),transparent_34%)]'}`}
            />

            <div className="relative mx-auto max-w-6xl px-4 py-10">
                <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#8DF2C6]">Workspace Profile</p>
                            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
                                Profile for {firstName}
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
                                Maintain your public identity details used across onboarding, rooms, and introductions.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2CF8A2]/30 bg-[#2CF8A2]/15 text-lg font-black text-[#9AFCD5]">
                                {initial}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-100">{getValue(profile.full_name)}</p>
                                <p className="text-xs text-slate-400">{membership.organization.name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-slate-700 bg-slate-900 p-1">
                            <Link
                                href={`/workspace?${themeQuery}`}
                                className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${navPillInactiveClass}`}
                            >
                                Overview
                            </Link>
                            <Link
                                href={`/workspace/profile?${themeQuery}`}
                                className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${navPillActiveClass}`}
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
                                href="/workspace/profile?theme=light"
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
                                href="/workspace/profile?theme=dark"
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
                </section>

                <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
                    <aside className="space-y-6">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-300">Profile Snapshot</p>
                            <div className="mt-4 space-y-3">
                                <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Full Name</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-100">{getValue(profile.full_name)}</p>
                                </div>
                                <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Location</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-100">{getValue(profile.location)}</p>
                                </div>
                                <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Organization</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-100">{membership.organization.name}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-300">Profile Completeness</p>
                            <p className={`mt-2 text-lg font-black ${completeness.className}`}>
                                {completeness.percent}%
                            </p>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                {completeness.label} ({completeness.completed}/{completeness.total} key fields)
                            </p>
                            <div className="mt-3 h-2 rounded-full bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                                    style={{ width: `${completeness.percent}%` }}
                                />
                            </div>
                        </div>
                    </aside>

                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-300">Current Profile Details</p>
                            <div className="mt-4 grid gap-3">
                                <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Bio</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-200">{getValue(profile.bio)}</p>
                                </div>
                            </div>
                        </div>

                        <ProfileForm
                            defaultFullName={profile.full_name ?? ''}
                            defaultLocation={profile.location ?? ''}
                            defaultBio={profile.bio ?? ''}
                        />
                    </div>
                </section>
            </div>
        </main>
    )
}
