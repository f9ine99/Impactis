import type { AppRole } from '@/modules/profiles'
import type { NotificationItem } from './types'

const NOTIFICATIONS_BY_ROLE: Record<AppRole, NotificationItem[]> = {
    founder: [
        {
            id: 'founder-deck-reminder',
            role: 'founder',
            title: 'Pitch deck reminder',
            body: 'Upload your latest deck to keep your deal room current.',
            timeLabel: '10 mins ago',
            read: false,
            severity: 'warning',
        },
        {
            id: 'founder-new-view',
            role: 'founder',
            title: 'New profile views',
            body: '3 new investors viewed your profile today.',
            timeLabel: '1 hour ago',
            read: false,
            severity: 'info',
        },
        {
            id: 'founder-checklist-complete',
            role: 'founder',
            title: 'Checklist update',
            body: 'Your legal docs checklist is 100% complete.',
            timeLabel: 'Yesterday',
            read: true,
            severity: 'success',
        },
    ],
    investor: [
        {
            id: 'investor-due-diligence',
            role: 'investor',
            title: 'Due diligence update',
            body: 'HydroNet Labs uploaded new compliance files.',
            timeLabel: '22 mins ago',
            read: false,
            severity: 'info',
        },
        {
            id: 'investor-new-match',
            role: 'investor',
            title: 'New matching opportunity',
            body: 'A clean-water startup now matches your criteria.',
            timeLabel: '2 hours ago',
            read: false,
            severity: 'success',
        },
        {
            id: 'investor-market-brief',
            role: 'investor',
            title: 'Weekly market brief',
            body: 'Your curated sector brief is ready.',
            timeLabel: 'Yesterday',
            read: true,
            severity: 'info',
        },
    ],
    advisor: [
        {
            id: 'advisor-call-reminder',
            role: 'advisor',
            title: 'Upcoming call reminder',
            body: 'Strategic Review - EcoTech starts in 45 minutes.',
            timeLabel: '15 mins ago',
            read: false,
            severity: 'warning',
        },
        {
            id: 'advisor-new-request',
            role: 'advisor',
            title: 'New service request',
            body: 'A founder requested advisory support for due diligence.',
            timeLabel: '3 hours ago',
            read: false,
            severity: 'info',
        },
        {
            id: 'advisor-payout',
            role: 'advisor',
            title: 'Payout processed',
            body: 'Your monthly payout has been scheduled.',
            timeLabel: 'Yesterday',
            read: true,
            severity: 'success',
        },
    ],
    admin: [
        {
            id: 'admin-verification-queue',
            role: 'admin',
            title: 'Verification queue alert',
            body: '12 accounts are waiting for identity verification.',
            timeLabel: '8 mins ago',
            read: false,
            severity: 'warning',
        },
        {
            id: 'admin-policy-flag',
            role: 'admin',
            title: 'Policy flag detected',
            body: '1 profile requires moderation review.',
            timeLabel: '1 hour ago',
            read: false,
            severity: 'warning',
        },
        {
            id: 'admin-backup-complete',
            role: 'admin',
            title: 'System backup completed',
            body: 'Daily backup completed successfully.',
            timeLabel: 'Today',
            read: true,
            severity: 'success',
        },
    ],
}

export function listNotificationTemplatesByRole(role: AppRole): NotificationItem[] {
    return NOTIFICATIONS_BY_ROLE[role]
}
