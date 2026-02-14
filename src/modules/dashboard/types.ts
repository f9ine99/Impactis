import type { AppRole, UserProfile } from '@/modules/profiles'

export type DashboardProfile = UserProfile & { role: AppRole }
