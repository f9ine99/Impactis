'use client'

import { useActionState } from 'react'
import { updateProfileAction, type UpdateProfileActionState } from './actions'

type ProfileFormProps = {
    defaultFullName: string
    defaultLocation: string
    defaultBio: string
}

const initialState: UpdateProfileActionState = {
    error: null,
    success: null,
}

export default function ProfileForm({
    defaultFullName,
    defaultLocation,
    defaultBio,
}: ProfileFormProps) {
    const [state, formAction, isPending] = useActionState(updateProfileAction, initialState)

    return (
        <form action={formAction} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-300">Edit Profile</p>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Live
                </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label htmlFor="fullName" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                        Full Name
                    </label>
                    <input
                        id="fullName"
                        name="fullName"
                        defaultValue={defaultFullName}
                        placeholder="Your full name"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-[#2CF8A2]"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label htmlFor="location" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                        Location
                    </label>
                    <input
                        id="location"
                        name="location"
                        defaultValue={defaultLocation}
                        placeholder="City, Country"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-[#2CF8A2]"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label htmlFor="bio" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                        Bio
                    </label>
                    <textarea
                        id="bio"
                        name="bio"
                        defaultValue={defaultBio}
                        rows={4}
                        placeholder="Short profile summary"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-[#2CF8A2]"
                    />
                    <p className="mt-2 text-xs text-slate-500">Maximum 500 characters.</p>
                </div>
            </div>

            {state.error ? (
                <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-300">
                    {state.error}
                </p>
            ) : null}
            {state.success ? (
                <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300">
                    {state.success}
                </p>
            ) : null}

            <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-xl border border-[#2CF8A2]/30 bg-[#2CF8A2]/15 px-5 py-3 text-sm font-semibold text-[#9AFCD5] hover:bg-[#2CF8A2]/25 disabled:opacity-60"
            >
                {isPending ? 'Saving...' : 'Save Profile'}
            </button>
        </form>
    )
}
