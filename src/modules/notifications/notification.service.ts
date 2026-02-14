import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppRole } from '@/modules/profiles'
import { listNotificationTemplatesByRole } from './notification.repository'
import type { NotificationFeed, NotificationInsert, NotificationItem, NotificationRow } from './types'

const NOTIFICATIONS_TABLE = 'notifications'

type NotificationFeedInput = {
    supabase: SupabaseClient
    userId: string
    role: AppRole
    limit?: number
}

type NotificationUpdateInput = {
    supabase: SupabaseClient
    userId: string
    notificationId: string
}

type NotificationMarkAllInput = {
    supabase: SupabaseClient
    userId: string
}

function formatRelativeTime(isoDate: string): string {
    const date = new Date(isoDate)
    const deltaMs = Date.now() - date.getTime()

    if (!Number.isFinite(deltaMs) || deltaMs < 0) {
        return 'Just now'
    }

    const minutes = Math.floor(deltaMs / 60_000)
    if (minutes < 1) {
        return 'Just now'
    }

    if (minutes < 60) {
        return `${minutes} min${minutes === 1 ? '' : 's'} ago`
    }

    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
        return `${hours} hour${hours === 1 ? '' : 's'} ago`
    }

    const days = Math.floor(hours / 24)
    if (days === 1) {
        return 'Yesterday'
    }

    return `${days} days ago`
}

function mapRowToNotificationItem(row: NotificationRow, role: AppRole): NotificationItem {
    return {
        id: row.id,
        role,
        title: row.title,
        body: row.body,
        timeLabel: formatRelativeTime(row.created_at),
        read: row.read,
        severity: row.severity,
    }
}

function mapTemplateToInsertPayload(
    template: NotificationItem,
    userId: string,
    offsetIndex: number
): NotificationInsert {
    return {
        user_id: userId,
        title: template.title,
        body: template.body,
        severity: template.severity,
        read: template.read,
        created_at: new Date(Date.now() - offsetIndex * 45 * 60_000).toISOString(),
    }
}

function isMissingNotificationsTableError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
        return false
    }

    const maybeError = error as { code?: string; message?: string }
    return maybeError.code === '42P01' || maybeError.message?.includes('notifications') === true
}

async function listNotificationRowsForUser(
    supabase: SupabaseClient,
    userId: string,
    limit: number
): Promise<{ rows: NotificationRow[]; error: unknown }> {
    const { data, error } = await supabase
        .from(NOTIFICATIONS_TABLE)
        .select('id, user_id, title, body, severity, read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

    return {
        rows: ((data ?? []) as NotificationRow[]),
        error,
    }
}

async function getUnreadCountForUser(
    supabase: SupabaseClient,
    userId: string
): Promise<number | null> {
    const { count, error } = await supabase
        .from(NOTIFICATIONS_TABLE)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

    if (error) {
        return null
    }

    return typeof count === 'number' ? count : null
}

async function seedTemplateNotificationsForUser(
    supabase: SupabaseClient,
    userId: string,
    role: AppRole
): Promise<boolean> {
    const templates = listNotificationTemplatesByRole(role)
    if (templates.length === 0) {
        return false
    }

    const payload = templates.map((template, index) =>
        mapTemplateToInsertPayload(template, userId, index)
    )

    const { error } = await supabase.from(NOTIFICATIONS_TABLE).insert(payload)
    return !error
}

function buildTemplateFallbackFeed(role: AppRole, limit: number): NotificationFeed {
    const items = listNotificationTemplatesByRole(role).slice(0, limit)
    const unreadCount = items.filter((notification) => !notification.read).length
    return { items, unreadCount }
}

async function buildFeedFromRows(
    supabase: SupabaseClient,
    userId: string,
    role: AppRole,
    rows: NotificationRow[]
): Promise<NotificationFeed> {
    const items = rows.map((row) => mapRowToNotificationItem(row, role))
    const unreadCount = await getUnreadCountForUser(supabase, userId)

    return {
        items,
        unreadCount: unreadCount ?? items.filter((notification) => !notification.read).length,
    }
}

export async function getNotificationFeedForUser({
    supabase,
    userId,
    role,
    limit = 3,
}: NotificationFeedInput): Promise<NotificationFeed> {
    const firstAttempt = await listNotificationRowsForUser(supabase, userId, limit)

    if (firstAttempt.rows.length > 0) {
        return buildFeedFromRows(supabase, userId, role, firstAttempt.rows)
    }

    if (firstAttempt.error && isMissingNotificationsTableError(firstAttempt.error)) {
        return buildTemplateFallbackFeed(role, limit)
    }

    if (!firstAttempt.error) {
        await seedTemplateNotificationsForUser(supabase, userId, role)
        const secondAttempt = await listNotificationRowsForUser(supabase, userId, limit)
        if (secondAttempt.rows.length > 0) {
            return buildFeedFromRows(supabase, userId, role, secondAttempt.rows)
        }
    }

    return buildTemplateFallbackFeed(role, limit)
}

export async function listRecentNotificationsForUser(
    input: NotificationFeedInput
): Promise<NotificationItem[]> {
    const feed = await getNotificationFeedForUser(input)
    return feed.items
}

export async function getUnreadNotificationCountForUser(
    input: NotificationFeedInput
): Promise<number> {
    const feed = await getNotificationFeedForUser(input)
    return feed.unreadCount
}

export async function markNotificationAsReadForUser({
    supabase,
    userId,
    notificationId,
}: NotificationUpdateInput): Promise<void> {
    await supabase
        .from(NOTIFICATIONS_TABLE)
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
}

export async function markAllNotificationsAsReadForUser({
    supabase,
    userId,
}: NotificationMarkAllInput): Promise<void> {
    await supabase
        .from(NOTIFICATIONS_TABLE)
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
}
