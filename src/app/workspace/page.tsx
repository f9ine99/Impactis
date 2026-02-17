import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingPath } from '@/modules/onboarding'
import { getPrimaryOrganizationMembershipForUser } from '@/modules/organizations'
import { getResolvedProfileForUser } from '@/modules/profiles'

function toTitleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
}

export default async function WorkspacePage() {
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

    const firstName = profile.full_name?.trim().split(/\s+/)[0] ?? 'there'
    const workspaceLabel = `${toTitleCase(membership.organization.type)} Workspace`
    const roleLabel = membership.organization.type
    const company = membership.organization.name
    const membershipLabel = membership.member_role

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-20">
            <section className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-10 shadow-xl">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0B3D2E]/60">
                    {workspaceLabel}
                </p>
                <h1 className="mt-4 text-3xl font-black text-gray-900">
                    Dear {firstName}, we are building your dashboard.
                </h1>
                <p className="mt-3 text-gray-600">
                    Your workspace is under construction and we are preparing the next release for your team.
                </p>
                <p className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                    Organization: {company}
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-700">
                    Role: <span className="uppercase tracking-wide text-[#0B3D2E]">{roleLabel}</span>
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-700">
                    Membership: <span className="uppercase tracking-wide text-[#0B3D2E]">{membershipLabel}</span>
                </p>
                <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
                    <p className="text-sm font-bold text-gray-900">Coming next</p>
                    <ul className="mt-3 space-y-2 text-sm text-gray-700">
                        <li>Personalized dashboard widgets for your role.</li>
                        <li>Profile and account management tools.</li>
                        <li>Live activity stream and collaboration features.</li>
                    </ul>
                </div>
                <div className="mt-8">
                    <form action="/auth/signout" method="post" className="w-full sm:w-auto">
                        <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center rounded-xl bg-[#0B3D2E] px-5 py-3 font-semibold text-white hover:bg-[#082a20]"
                        >
                            Sign Out
                        </button>
                    </form>
                </div>
            </section>
        </main>
    )
}
