import api from './api'
import type { UserProgress, LeaderboardEntry } from '@/types'

export const progressService = {
    getMyProgress: async (): Promise<UserProgress> => {
        const { data } = await api.get<UserProgress>('/progress/me')
        return data
    },
}

export const leaderboardService = {
    getGlobal: async (limit = 20): Promise<LeaderboardEntry[]> => {
        const { data } = await api.get<LeaderboardEntry[]>(`/leaderboard?limit=${limit}`)
        return data
    },
}
