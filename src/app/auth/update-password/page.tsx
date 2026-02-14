'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters.')
            return
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match.')
            return
        }

        setIsLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) {
                toast.error(error.message)
                return
            }

            toast.success('Password updated. Please sign in.')
            router.push('/auth/login')
        } catch {
            toast.error('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-20">
            <section className="mx-auto max-w-md rounded-3xl border border-gray-100 bg-white p-10 shadow-xl">
                <h1 className="text-2xl font-black text-gray-900">Set New Password</h1>
                <p className="mt-3 text-gray-600">Choose a new password for your account.</p>

                <form onSubmit={handleUpdatePassword} className="mt-8 space-y-5">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">New Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#0B3D2E]"
                            placeholder="Minimum 6 characters"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Confirm Password</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#0B3D2E]"
                            placeholder="Repeat password"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-xl bg-[#0B3D2E] px-5 py-3 font-semibold text-white transition hover:bg-[#082a20] disabled:opacity-50"
                    >
                        {isLoading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/auth/login" className="font-semibold text-[#0B3D2E] hover:underline">
                        Back to Sign In
                    </Link>
                </div>
            </section>
        </main>
    )
}
