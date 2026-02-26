import { create } from 'zustand'
import type { SimSession, ActionResult } from '@/types'

interface SimStore {
    session: SimSession | null
    isLoading: boolean
    isSubmitting: boolean
    eventFeed: string[]
    // Real-time game loop state
    actionCooldowns: Record<string, number>  // actionId → seconds remaining
    elapsedSeconds: number
    isPaused: boolean
    isTicking: boolean

    setSession: (s: SimSession) => void
    applyResult: (result: ActionResult) => void
    applyTick: (result: ActionResult) => void
    addEvent: (msg: string) => void
    reset: () => void
    setLoading: (v: boolean) => void
    setSubmitting: (v: boolean) => void
    // Cooldown management
    startCooldown: (actionId: string, seconds: number) => void
    decrementCooldowns: () => void
    // Timer
    incrementElapsed: () => void
    setPaused: (v: boolean) => void
    setTicking: (v: boolean) => void
}

export const useSimStore = create<SimStore>((set) => ({
    session: null,
    isLoading: false,
    isSubmitting: false,
    eventFeed: [],
    actionCooldowns: {},
    elapsedSeconds: 0,
    isPaused: false,
    isTicking: false,

    setSession: (session) => set({ session }),

    applyResult: (result) =>
        set((state) => ({
            session: state.session
                ? {
                    ...state.session,
                    worldState: result.worldState,
                    turn: result.turn,
                    availableActions: result.availableActions,
                    status: result.isTerminal
                        ? (result.outcome as SimSession['status'])
                        : 'running',
                    finalScore: result.finalScore,
                }
                : null,
            eventFeed: [
                ...result.consequences,
                ...result.events,
                ...(state.eventFeed.slice(0, 8)),
            ],
        })),

    applyTick: (result) =>
        set((state) => ({
            session: state.session
                ? {
                    ...state.session,
                    worldState: result.worldState,
                    turn: result.turn,
                    status: (result.isTerminal && result.outcome)
                        ? (result.outcome as SimSession['status'])
                        : 'running',
                    finalScore: result.finalScore ?? state.session.finalScore,
                }
                : null,
            eventFeed: result.events && result.events.length > 0
                ? [...result.events, ...state.eventFeed.slice(0, 7)]
                : state.eventFeed,
        })),

    addEvent: (msg) =>
        set((state) => ({ eventFeed: [msg, ...state.eventFeed.slice(0, 9)] })),

    reset: () =>
        set({
            session: null,
            isLoading: false,
            isSubmitting: false,
            eventFeed: [],
            actionCooldowns: {},
            elapsedSeconds: 0,
            isPaused: false,
            isTicking: false,
        }),

    setLoading: (v) => set({ isLoading: v }),
    setSubmitting: (v) => set({ isSubmitting: v }),

    startCooldown: (actionId, seconds) =>
        set((state) => ({
            actionCooldowns: { ...state.actionCooldowns, [actionId]: seconds },
        })),

    decrementCooldowns: () =>
        set((state) => {
            const next: Record<string, number> = {}
            for (const [id, val] of Object.entries(state.actionCooldowns)) {
                if (val > 1) next[id] = val - 1
            }
            return { actionCooldowns: next }
        }),

    incrementElapsed: () =>
        set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),

    setPaused: (v) => set({ isPaused: v }),
    setTicking: (v) => set({ isTicking: v }),
}))
