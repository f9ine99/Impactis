export type AppRole = 'founder' | 'investor' | 'advisor' | 'admin'

export type UserProfile = {
    id: string
    role: AppRole | null
    full_name: string | null
    company: string | null
    location: string | null
    bio: string | null
    industry_tags: string[]
    avatar_url: string | null
    is_verified: boolean
}
