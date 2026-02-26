import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

// __API_BASE__ is injected by vite define: '/api' in dev, 'http://localhost:5000/api' in prod
declare const __API_BASE__: string

const api = axios.create({
    baseURL: __API_BASE__,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
})

// ─── Request Interceptor: attach Bearer token ──────────────────────────────
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// ─── Response Interceptor: auto-refresh token on 401, handle errors ────────
let _isRefreshing = false
let _failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null = null) {
    _failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error)
        else resolve(token!)
    })
    _failedQueue = []
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        const status = error.response?.status
        const serverMsg = error.response?.data?.error ?? error.message

        // ── Auto-refresh on 401 (token expired) — but not on /auth/refresh itself
        if (status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
            if (_isRefreshing) {
                // Queue concurrent requests while a refresh is in-flight
                return new Promise<string>((resolve, reject) => {
                    _failedQueue.push({ resolve, reject })
                }).then((newToken) => {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`
                    return api(originalRequest)
                })
            }

            originalRequest._retry = true
            _isRefreshing = true

            try {
                const { data } = await api.post<{ token: string; user: unknown }>('/auth/refresh')
                const newToken = data.token
                useAuthStore.getState().setAuth(data.user as import('@/types').User, newToken)
                api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
                processQueue(null, newToken)
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return api(originalRequest)
            } catch (refreshErr) {
                processQueue(refreshErr, null)
                useAuthStore.getState().logout()
                toast.error('Session expired. Please log in again.')
                window.location.href = '/login'
                return Promise.reject(refreshErr)
            } finally {
                _isRefreshing = false
            }
        }

        // ── Other status codes ──────────────────────────────────────────────
        if (status === 403) {
            toast.error('You do not have permission to do that.')
        } else if (status === 429) {
            toast.error('Too many requests. Please slow down.')
        } else if (status >= 500) {
            toast.error('Server error. Please try again.')
        }

        return Promise.reject(error)
    }
)

export default api
