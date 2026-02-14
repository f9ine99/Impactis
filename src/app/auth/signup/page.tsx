'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    buildSignupMetadata,
    getPostSignupRedirectPath,
    getSignupEmailRedirectUrl,
    getSignupRoleFromSearchParams,
} from '@/modules/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Rocket, TrendingUp, Briefcase, Check, Mail, Lock, User, Building, MapPin } from 'lucide-react'

const roles = [
    { id: 'founder', title: 'Founder', icon: Rocket, description: 'Raising capital or seeking strategic partners.' },
    { id: 'investor', title: 'Investor', icon: TrendingUp, description: 'Seeking high-impact investment opportunities.' },
    { id: 'advisor', title: 'Advisor', icon: Briefcase, description: 'Providing expert professional advisory services.' },
]

const industryOptions = ['Fintech', 'Renewable Energy', 'Healthcare', 'EdTech', 'AgriTech', 'SaaS', 'Clean Water']

export default function SignupPage() {
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: '',
        company: '',
        location: '',
        bio: '',
        industry_tags: [] as string[]
    })

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search)
        const roleFromSearch = getSignupRoleFromSearchParams(searchParams)
        if (roleFromSearch) {
            setFormData(prev => ({ ...prev, role: roleFromSearch }))
            setStep(2) // Jump to account details if role is pre-selected
        }
    }, [])

    const handleNext = () => setStep(step + 1)
    const handleBack = () => setStep(step - 1)

    const toggleTag = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            industry_tags: prev.industry_tags.includes(tag)
                ? prev.industry_tags.filter(t => t !== tag)
                : [...prev.industry_tags, tag]
        }))
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const metadata = buildSignupMetadata(formData)
            const { data, error: signupError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: metadata,
                    emailRedirectTo: getSignupEmailRedirectUrl(window.location.origin),
                },
            })

            if (signupError) {
                toast.error(signupError.message)
                setIsLoading(false)
                return
            }

            if (data.user) {
                toast.success('Account created! Please check your email for confirmation.')
                router.push(getPostSignupRedirectPath())
            }
        } catch {
            toast.error('An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-xl w-full">
                {/* Brand Header */}
                <div className="text-center mb-10">
                    <Link href="/" className="text-4xl font-black text-[#0B3D2E] tracking-tighter">
                        Impactis
                    </Link>
                </div>

                {/* Step Progress */}
                <div className="mb-12 flex justify-between items-center px-4">
                    {[1, 2, 3].map((num) => (
                        <div key={num} className="flex items-center flex-1 last:flex-none">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${step >= num ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]' : 'bg-white text-gray-400 border-gray-200'
                                }`}>
                                {step > num ? <Check className="w-5 h-5" /> : num}
                            </div>
                            {num < 3 && (
                                <div className={`flex-1 h-0.5 mx-4 ${step > num ? 'bg-[#0B3D2E]' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 p-8 md:p-12 border border-gray-100">
                    {/* Step 1: Role Selection */}
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">How will you participate?</h2>
                                <p className="mt-2 text-gray-500 font-medium tracking-tight">Select your primary role in the ecosystem.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {roles.map((role) => (
                                    <button
                                        key={role.id}
                                        onClick={() => {
                                            setFormData({ ...formData, role: role.id })
                                            handleNext()
                                        }}
                                        className={`p-6 rounded-3xl border-2 text-left transition-all group ${formData.role === role.id ? 'border-[#0B3D2E] bg-green-50' : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${formData.role === role.id ? 'bg-[#0B3D2E] text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'
                                                }`}>
                                                <role.icon className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-xl text-gray-900">{role.title}</h3>
                                                <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Account Details */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Create your account</h2>
                                <p className="mt-2 text-gray-500 font-medium tracking-tight">You selected <span className="text-[#0B3D2E] font-bold capitalize">{formData.role}</span></p>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:ring-4 focus:ring-green-500/10 focus:border-[#0B3D2E] outline-none transition-all font-medium"
                                            placeholder="John Doe"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:ring-4 focus:ring-green-500/10 focus:border-[#0B3D2E] outline-none transition-all font-medium"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:ring-4 focus:ring-green-500/10 focus:border-[#0B3D2E] outline-none transition-all font-medium"
                                            placeholder="Minimum 6 characters"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-4 pt-4">
                                <button onClick={handleBack} className="flex-1 py-4 rounded-2xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition">Back</button>
                                <button
                                    disabled={!formData.fullName || !formData.email || formData.password.length < 6}
                                    onClick={handleNext}
                                    className="flex-[2] py-4 rounded-2xl bg-[#0B3D2E] text-white font-black text-lg hover:shadow-xl hover:shadow-green-900/20 transition disabled:opacity-50"
                                >
                                    Next: Profile Info
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Profile Details */}
                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Complete your profile</h2>
                                <p className="mt-2 text-gray-500 font-medium tracking-tight">Help us tailor your experience.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Organization</label>
                                    <div className="relative">
                                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:ring-4 focus:ring-green-500/10 focus:border-[#0B3D2E] outline-none transition-all font-medium"
                                            placeholder="Company Name"
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:ring-4 focus:ring-green-500/10 focus:border-[#0B3D2E] outline-none transition-all font-medium"
                                            placeholder="Addis Ababa, ET"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-4 px-1">Industry Focus</label>
                                <div className="flex flex-wrap gap-2">
                                    {industryOptions.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${formData.industry_tags.includes(tag) ? 'bg-[#0B3D2E] text-white shadow-lg shadow-green-900/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Professional Bio</label>
                                <textarea
                                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:ring-4 focus:ring-green-500/10 focus:border-[#0B3D2E] outline-none transition-all font-medium resize-none"
                                    rows={3}
                                    placeholder="Tell us about your background..."
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>

                            <div className="flex space-x-4 pt-4">
                                <button onClick={handleBack} className="flex-1 py-4 rounded-2xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition">Back</button>
                                <button
                                    onClick={handleSignup}
                                    disabled={isLoading || !formData.company || !formData.location}
                                    className="flex-[2] py-4 rounded-2xl bg-[#0B3D2E] text-white font-black text-lg hover:shadow-xl hover:shadow-green-900/40 transition disabled:opacity-50"
                                >
                                    {isLoading ? 'Creating Account...' : 'Complete Registration'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-10 text-center">
                        <p className="text-gray-400 font-medium">Already part of the network? <Link href="/auth/login" className="text-[#0B3D2E] font-bold hover:underline">Sign In</Link></p>
                    </div>
                </div>
            </div>
        </div>
    )
}
