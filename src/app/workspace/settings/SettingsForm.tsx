'use client'

import { useActionState } from 'react'
import {
    updateOrganizationSettingsAction,
    type UpdateOrganizationSettingsActionState,
} from './actions'

type SettingsFormProps = {
    defaultOrganizationName: string
    defaultOrganizationLocation: string
    defaultOrganizationIndustryTags: string
    canEdit: boolean
}

const initialState: UpdateOrganizationSettingsActionState = {
    error: null,
    success: null,
}

export default function SettingsForm({
    defaultOrganizationName,
    defaultOrganizationLocation,
    defaultOrganizationIndustryTags,
    canEdit,
}: SettingsFormProps) {
    const [state, formAction, isPending] = useActionState(updateOrganizationSettingsAction, initialState)

    return (
        <form action={formAction} className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5">
            <p className="text-sm font-bold text-gray-900">Edit Organization</p>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label htmlFor="organizationName" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
                        Organization Name
                    </label>
                    <input
                        id="organizationName"
                        name="organizationName"
                        defaultValue={defaultOrganizationName}
                        disabled={!canEdit}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#0B3D2E] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label htmlFor="organizationLocation" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
                        Location
                    </label>
                    <input
                        id="organizationLocation"
                        name="organizationLocation"
                        defaultValue={defaultOrganizationLocation}
                        disabled={!canEdit}
                        placeholder="City, Country"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#0B3D2E] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label htmlFor="organizationIndustryTags" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
                        Industry Tags
                    </label>
                    <input
                        id="organizationIndustryTags"
                        name="organizationIndustryTags"
                        defaultValue={defaultOrganizationIndustryTags}
                        disabled={!canEdit}
                        placeholder="Fintech, Climate, Health"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#0B3D2E] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    <p className="mt-2 text-xs text-gray-500">Separate tags with commas.</p>
                </div>
            </div>

            {!canEdit ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                    Only organization owner or admin can edit these settings.
                </p>
            ) : null}
            {state.error ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                    {state.error}
                </p>
            ) : null}
            {state.success ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                    {state.success}
                </p>
            ) : null}

            <button
                type="submit"
                disabled={!canEdit || isPending}
                className="inline-flex items-center justify-center rounded-xl bg-[#0B3D2E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#082a20] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isPending ? 'Saving...' : 'Save Organization'}
            </button>
        </form>
    )
}
