import api from './api'
import type { SimSession, ActionResult, SdgId } from '@/types'

export const simService = {
    start: async (sdgId: SdgId, difficulty = 1): Promise<SimSession> => {
        const { data } = await api.post<SimSession>('/sim/start', { sdgId, difficulty })
        return data
    },

    action: async (sessionId: string, actionId: string, params: Record<string, unknown> = {}): Promise<ActionResult> => {
        const { data } = await api.post<ActionResult>('/sim/action', { sessionId, actionId, params })
        return data
    },

    tick: async (sessionId: string): Promise<ActionResult> => {
        const { data } = await api.post<ActionResult>('/sim/tick', { sessionId })
        return data
    },

    getState: async (sessionId: string): Promise<SimSession> => {
        const { data } = await api.get<SimSession>(`/sim/state/${sessionId}`)
        return data
    },

    end: async (sessionId: string): Promise<{ sessionId: string; status: string; finalScore: number }> => {
        const { data } = await api.post('/sim/end', { sessionId })
        return data
    },
}
