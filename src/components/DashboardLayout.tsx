import Link from 'next/link'
import type { DashboardProfile } from '@/modules/dashboard'
import type { NotificationFeed } from '@/modules/notifications'
import { LogOut, User, LayoutDashboard, Settings, Bell } from 'lucide-react'

type DashboardNav = 'dashboard' | 'notifications' | 'profile' | 'settings'

export default function DashboardLayout({
    children,
    profile,
    notifications,
    activeNav = 'dashboard',
}: {
    children: React.ReactNode
    profile: DashboardProfile
    notifications: NotificationFeed
    activeNav?: DashboardNav
}) {
    const topNotification = notifications.items[0]
    const activeLinkClass = 'flex items-center space-x-3 p-3 rounded-xl bg-white/10 font-semibold'
    const inactiveLinkClass = 'flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition'

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#0B3D2E] text-white hidden lg:flex flex-col">
                <div className="p-8">
                    <Link href="/" className="text-2xl font-bold">Impactis</Link>
                </div>
                <nav className="flex-grow px-4 space-y-2">
                    <Link href={`/${profile.role}/dashboard`} className={activeNav === 'dashboard' ? activeLinkClass : inactiveLinkClass}>
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                    </Link>
                    <Link href="#" className={activeNav === 'profile' ? activeLinkClass : inactiveLinkClass}>
                        <User className="w-5 h-5" />
                        <span>Profile</span>
                    </Link>
                    <Link href="/notifications" className={activeNav === 'notifications' ? activeLinkClass : inactiveLinkClass}>
                        <Bell className="w-5 h-5" />
                        <span>Notifications</span>
                        {notifications.unreadCount > 0 && (
                            <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                                {notifications.unreadCount}
                            </span>
                        )}
                    </Link>
                    <Link href="#" className={activeNav === 'settings' ? activeLinkClass : inactiveLinkClass}>
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                    </Link>
                </nav>
                <div className="p-6 border-t border-white/10">
                    <form action="/auth/signout" method="post">
                        <button type="submit" className="flex items-center space-x-3 p-3 w-full rounded-xl hover:bg-red-500/20 text-red-200 transition">
                            <LogOut className="w-5 h-5" />
                            <span>Sign Out</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow flex flex-col">
                {/* Header */}
                <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-xl font-bold capitalize text-gray-900">{profile?.role} Dashboard</h2>
                        <span className="px-3 py-1 bg-green-50 text-[#0B3D2E] text-xs font-bold rounded-full uppercase tracking-wider border border-green-100">
                            {profile?.role}
                        </span>
                        {topNotification && (
                            <span className="hidden xl:inline-flex max-w-[320px] truncate rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600">
                                {topNotification.title}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Bell className="h-5 w-5 text-gray-500" />
                            {notifications.unreadCount > 0 && (
                                <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0B3D2E] px-1 text-[10px] font-bold text-white">
                                    {notifications.unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-900">{profile?.full_name}</p>
                            <p className="text-xs text-gray-500">{profile?.company}</p>
                        </div>
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-[#0B3D2E]">
                            {profile?.full_name?.charAt(0)}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <section className="p-8 overflow-auto">
                    {children}
                </section>
            </main>
        </div>
    )
}
