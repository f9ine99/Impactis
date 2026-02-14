export type AppRole = 'founder' | 'investor' | 'advisor' | 'admin'

export type UserProfile = {
    id: string
    role: AppRole | null
    full_name: string | null
    company: string | null
}
