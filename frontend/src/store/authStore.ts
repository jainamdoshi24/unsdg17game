import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthStore {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    setAuth: (user: User, token: string) => void
    logout: () => void
    updateUser: (partial: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            setAuth: (user, token) =>
                set({ user, token, isAuthenticated: true }),

            logout: () =>
                set({ user: null, token: null, isAuthenticated: false }),

            updateUser: (partial) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...partial } : null,
                })),
        }),
        {
            name: 'sdg-auth',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)
