import type { AppRole } from '@/modules/profiles'

export type NotificationSeverity = 'info' | 'warning' | 'success'

export type NotificationItem = {
    id: string
    role: AppRole
    title: string
    body: string
    timeLabel: string
    read: boolean
    severity: NotificationSeverity
}

export type NotificationFeed = {
    items: NotificationItem[]
    unreadCount: number
}

export type NotificationRow = {
    id: string
    user_id: string
    title: string
    body: string
    severity: NotificationSeverity
    read: boolean
    created_at: string
}

export type NotificationInsert = {
    user_id: string
    title: string
    body: string
    severity: NotificationSeverity
    read: boolean
    created_at?: string
}
