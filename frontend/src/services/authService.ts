import api from './api'
import type { User } from '@/types'

export interface LoginPayload { email: string; password: string }
export interface SignupPayload {
    displayName: string
    email: string
    password: string
    role?: 'student' | 'teacher'
    grade?: number
}

interface BackendAuthResponse {
    message: string
    token: string
    user: User
}
export interface AuthResult { token: string; user: User }

export const authService = {
    login: async (payload: LoginPayload): Promise<AuthResult> => {
        const { data } = await api.post<BackendAuthResponse>('/auth/login', payload)
        return { token: data.token, user: data.user }
    },

    signup: async (payload: SignupPayload): Promise<AuthResult> => {
        const { data } = await api.post<BackendAuthResponse>('/auth/register', payload)
        return { token: data.token, user: data.user }
    },

    me: async (): Promise<User> => {
        const { data } = await api.get<{ user: User }>('/auth/me')
        return data.user
    },

    refresh: async (): Promise<AuthResult> => {
        const { data } = await api.post<{ token: string; user: User }>('/auth/refresh')
        return { token: data.token, user: data.user }
    },
}
