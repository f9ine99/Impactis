'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { mapLoginErrorMessage, resolvePostLoginRedirect } from '@/modules/auth'
import TurnstileWidget from '@/components/auth/TurnstileWidget'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '0x4AAAAAACd7X251ebzrdbGy'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [captchaToken, setCaptchaToken] = useState<string | null>(null)
    const [captchaResetSignal, setCaptchaResetSignal] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()

        const trimmedEmail = email.trim()
        if (!captchaToken) {
            toast.error('Please complete the security check.')
            return
        }

        setIsLoading(true)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: trimmedEmail,
                password,
                options: {
                    captchaToken,
                },
            })

            if (error) {
                toast.error(mapLoginErrorMessage(error))
                setCaptchaResetSignal((current) => current + 1)
            } else {
                toast.success('Successfully logged in!')
                const redirectPath = await resolvePostLoginRedirect(supabase)
                router.push(redirectPath)
            }
        } catch (err) {
            console.error('Unexpected auth catch:', err)
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
                    <h1 className="mt-4 text-2xl font-semibold text-gray-900">Welcome Back</h1>
                    <p className="mt-2 text-gray-600">Enter your credentials to access your account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
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

                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <Link href="/auth/reset-password" className="text-sm font-medium text-[#0B3D2E] hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0B3D2E] focus:border-transparent outline-none transition"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <TurnstileWidget
                        siteKey={TURNSTILE_SITE_KEY}
                        onTokenChange={setCaptchaToken}
                        resetSignal={captchaResetSignal}
                        className="flex justify-center"
                    />

                    <button
                        type="submit"
                        disabled={isLoading || !captchaToken}
                        className="w-full bg-[#0B3D2E] text-white py-3 rounded-xl font-semibold hover:bg-[#082a20] transition disabled:opacity-50"
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-gray-600">
                        Don&apos;t have an account?{' '}
                        <Link href="/auth/signup" className="font-semibold text-[#0B3D2E] hover:underline">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
