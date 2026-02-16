import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDashboardPathForRole } from '@/modules/auth'
import { getResolvedProfileForUser } from '@/modules/profiles'

export default async function OnboardingPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const profile = await getResolvedProfileForUser(supabase, user)
    if (profile?.role) {
        redirect(getDashboardPathForRole(profile.role))
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-20">
            <section className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-10 shadow-xl">
                <h1 className="text-3xl font-black text-gray-900">Onboarding</h1>
                <p className="mt-3 text-gray-600">
                    Your account is active, but your profile setup is not complete yet.
                </p>
                <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
                    <p className="text-sm font-semibold text-amber-800">
                        We are currently working on your dashboard experience.
                    </p>
                    <p className="mt-1 text-sm text-amber-700">
                        Once your workspace is ready, you will be automatically routed there after login.
                    </p>
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Back To Home
                    </Link>
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
