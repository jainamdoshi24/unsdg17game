// ─── Auth Types ──────────────────────────────────────────────────────────────
export type UserRole = 'student' | 'teacher' | 'ngo_admin'

export interface User {
    _id: string
    id?: string              // alias for _id returned by toPublicProfile
    displayName: string
    name?: string            // legacy alias
    email: string
    role: UserRole
    grade?: number
    totalXP?: number
    badges?: string[]
    skillRating?: number
    lastActiveAt?: string
    createdAt?: string
    updatedAt?: string
}

export interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
}

// ─── SDG Types ────────────────────────────────────────────────────────────────
export type SdgId =
    | 'SDG_01' | 'SDG_02' | 'SDG_03' | 'SDG_04' | 'SDG_05' | 'SDG_06'
    | 'SDG_07' | 'SDG_08' | 'SDG_09' | 'SDG_10' | 'SDG_11' | 'SDG_12'
    | 'SDG_13' | 'SDG_14' | 'SDG_15' | 'SDG_16' | 'SDG_17'

export interface SdgMeta {
    id: SdgId
    number: number
    title: string
    shortTitle: string
    color: string
    emoji: string
    description: string
    theme: string
}

// ─── Simulation Types ──────────────────────────────────────────────────────────
export interface SimAction {
    id: string
    label: string
    cost: number
    description?: string
    emoji?: string
    effect?: string
}



export interface SimEvent {
    turn: number
    actionId: string
    params: Record<string, unknown>
    consequences: string[]
    events: string[]
}

export interface SimSession {
    sessionId: string
    sdgId: SdgId
    difficulty: number
    seed: string
    worldState: Record<string, unknown>
    turn: number
    maxTurns: number
    availableActions: SimAction[]
    status: 'running' | 'won' | 'lost' | 'abandoned'
    finalScore: number | null

    eventLog?: SimEvent[]
}

export interface ActionResult {
    sessionId: string
    worldState: Record<string, unknown>
    turn: number
    consequences: string[]
    events: string[]
    availableActions: SimAction[]
    isTerminal: boolean
    outcome: 'won' | 'lost' | null
    finalScore: number | null
    xpEarned?: number
    newBadges?: { id: string; label: string; icon: string }[]
}


// ─── Progress Types ────────────────────────────────────────────────────────────
export interface SdgProgress {
    sdgId: SdgId
    completions: number
    bestScore: number
    totalXP: number
    lastPlayedAt: string | null
    unlocked: boolean
}

export interface Badge {
    id: string
    title: string
    description: string
    icon: string
    sdgId?: SdgId
    earnedAt: string
}

export interface UserProgress {
    totalXP: number
    level: number
    sdgProgress: SdgProgress[]
    badges: Badge[]
    streak: number
}

// ─── Dashboard Types ───────────────────────────────────────────────────────────
export interface LeaderboardEntry {
    rank: number
    userId: string
    name: string
    totalXP: number
    sdgsCompleted: number
    avatar?: string
}

export interface ClassStudent {
    id: string
    name: string
    email: string
    totalXP: number
    sdgsCompleted: number
    lastActive: string
    avgScore: number
}

// ─── API Types ────────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
    data: T
    message?: string
}

export interface ApiError {
    error: string
    details?: unknown
}
