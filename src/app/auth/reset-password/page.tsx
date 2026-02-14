'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)
    const supabase = createClient()

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
            })

            if (error) {
                toast.error(error.message)
            } else {
                toast.success('Reset link sent to your email!')
                setIsSent(true)
            }
        } catch {
            toast.error('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <Link href="/" className="text-3xl font-bold text-[#0B3D2E]">
                        Impactis
                    </Link>
                    <h1 className="mt-4 text-2xl font-semibold text-gray-900">Reset Password</h1>
                    <p className="mt-2 text-gray-600">Enter your email for a password reset link</p>
                </div>

                {isSent ? (
                    <div className="text-center">
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6">
                            Check your email for the reset link.
                        </div>
                        <Link href="/auth/login" className="font-semibold text-[#0B3D2E] hover:underline">
                            Back to Sign In
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleReset} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0B3D2E] focus:border-transparent outline-none transition"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#0B3D2E] text-white py-3 rounded-xl font-semibold hover:bg-[#082a20] transition disabled:opacity-50"
                        >
                            {isLoading ? 'Sending link...' : 'Send Reset Link'}
                        </button>

                        <div className="text-center">
                            <Link href="/auth/login" className="font-semibold text-[#0B3D2E] hover:underline">
                                Back to Sign In
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
