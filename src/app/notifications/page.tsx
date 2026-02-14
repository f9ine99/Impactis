import DashboardLayout from '@/components/DashboardLayout'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getDashboardAccessState } from '@/modules/dashboard'
import {
    getNotificationFeedForUser,
    markAllNotificationsAsReadForUser,
    markNotificationAsReadForUser,
} from '@/modules/notifications'
import { getOnboardingPath } from '@/modules/onboarding'
import { redirect } from 'next/navigation'

const severityStyles: Record<'info' | 'warning' | 'success', string> = {
    info: 'bg-blue-50 text-blue-700 border-blue-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    success: 'bg-green-50 text-green-700 border-green-100',
}

export default async function NotificationsPage() {
    const supabase = await createClient()
    const accessState = await getDashboardAccessState(supabase)

    if (accessState.status === 'unauthenticated') {
        redirect('/auth/login')
    }

    if (accessState.status === 'onboarding') {
        redirect(getOnboardingPath())
    }

    const dashboardPath = `/${accessState.profile.role}/dashboard`
    const notificationsFeed = await getNotificationFeedForUser({
        supabase,
        userId: accessState.profile.id,
        role: accessState.profile.role,
        limit: 20,
    })
    const notifications = notificationsFeed.items

    async function markNotificationAsReadAction(formData: FormData) {
        'use server'

        const notificationId = formData.get('notificationId')
        if (typeof notificationId !== 'string' || notificationId.length === 0) {
            return
        }

        const actionSupabase = await createClient()
        const {
            data: { user },
        } = await actionSupabase.auth.getUser()

        if (!user) {
            redirect('/auth/login')
        }

        await markNotificationAsReadForUser({
            supabase: actionSupabase,
            userId: user.id,
            notificationId,
        })

        revalidatePath('/notifications')
        revalidatePath(dashboardPath)
    }

    async function markAllAsReadAction() {
        'use server'

        const actionSupabase = await createClient()
        const {
            data: { user },
        } = await actionSupabase.auth.getUser()

        if (!user) {
            redirect('/auth/login')
        }

        await markAllNotificationsAsReadForUser({
            supabase: actionSupabase,
            userId: user.id,
        })

        revalidatePath('/notifications')
        revalidatePath(dashboardPath)
    }

    return (
        <DashboardLayout
            profile={accessState.profile}
            notifications={notificationsFeed}
            activeNav="notifications"
        >
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-600 mt-2">Recent updates for your {accessState.profile.role} workspace.</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Activity Feed</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-[#0B3D2E] bg-green-50 border border-green-100 rounded-full px-3 py-1">
                                {notificationsFeed.unreadCount} Unread
                            </span>
                            <form action={markAllAsReadAction}>
                                <button
                                    type="submit"
                                    disabled={notificationsFeed.unreadCount === 0}
                                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Mark all read
                                </button>
                            </form>
                        </div>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="px-6 py-10 text-center text-gray-500">No notifications yet.</div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {notifications.map((notification) => (
                                <li
                                    key={notification.id}
                                    className={`px-6 py-5 ${notification.read ? 'bg-white' : 'bg-gray-50/70'}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-gray-900">{notification.title}</p>
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${severityStyles[notification.severity]}`}
                                                >
                                                    {notification.severity}
                                                </span>
                                                {!notification.read && (
                                                    <span className="inline-flex rounded-full bg-[#0B3D2E] px-2 py-0.5 text-[10px] font-bold text-white">
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">{notification.body}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="text-xs text-gray-400 whitespace-nowrap">{notification.timeLabel}</span>
                                            {!notification.read && (
                                                <form action={markNotificationAsReadAction}>
                                                    <input type="hidden" name="notificationId" value={notification.id} />
                                                    <button
                                                        type="submit"
                                                        className="rounded-md border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Mark read
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
