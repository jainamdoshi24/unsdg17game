import React, { useEffect, useCallback, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, RotateCcw, Clock, Zap, Pause, Play, HelpCircle, BookOpen
} from 'lucide-react'
import { useSimStore } from '@/store/simStore'
import { simService } from '@/services/simService'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ProgressBar, Badge } from '@/components/Badge'
import { LoadingScreen } from '@/components/Spinner'
import { SDG_MAP, SDG_INFO } from '@/utils/sdgConfig'
import type { SdgId, SimAction } from '@/types'
import toast from 'react-hot-toast'

const TICK_MS = 3000
const COOLDOWN_SEC = 12

export default function SimulationGame() {
    const { sdgId } = useParams<{ sdgId: string }>()
    const navigate = useNavigate()

    const {
        session, isLoading, isSubmitting, eventFeed,
        setSession, applyResult, applyTick, setLoading, setSubmitting, reset,
        actionCooldowns, startCooldown, decrementCooldowns,
        elapsedSeconds, incrementElapsed,
        isPaused, setPaused,
    } = useSimStore()

    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const clockRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const sessionRef = useRef(session)
    const pausedRef = useRef(isPaused)
    const [showHowTo, setShowHowTo] = useState(false)
    const [showAbout, setShowAbout] = useState(false)
    const [gameEnded, setGameEnded] = useState(false)

    useEffect(() => { sessionRef.current = session }, [session])
    useEffect(() => { pausedRef.current = isPaused }, [isPaused])

    const meta = SDG_MAP[sdgId as SdgId]
    const info = SDG_INFO[sdgId as SdgId]
    const color = meta?.color ?? '#6366F1'

    // ── Start session on mount ──────────────────────────────────────────────────
    useEffect(() => {
        if (!sdgId) return
        reset()
        setGameEnded(false)

        const go = async () => {
            setLoading(true)
            try {
                const s = await simService.start(sdgId as SdgId, 1)
                setSession(s)
                startTicks()
            } catch {
                toast.error('Could not start simulation. Is the backend running?')
                navigate('/dashboard')
            } finally {
                setLoading(false)
            }
        }
        go()

        return () => stopTicks()
    }, [sdgId])

    // ── Interval helpers ────────────────────────────────────────────────────────
    function startTicks() {
        stopTicks()  // safety: clear any stale intervals

        // 1. World tick every 3 seconds
        tickRef.current = setInterval(async () => {
            const s = sessionRef.current
            if (!s || pausedRef.current || s.status !== 'running') return
            try {
                const res = await simService.tick(s.sessionId)
                applyTick(res)
                if (res.isTerminal) endGame()
            } catch { /* silent */ }
        }, TICK_MS)

        // 2. Clock + cooldown decrement every second
        clockRef.current = setInterval(() => {
            if (!pausedRef.current) {
                incrementElapsed()
                decrementCooldowns()
            }
        }, 1000)
    }

    function stopTicks() {
        if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
        if (clockRef.current) { clearInterval(clockRef.current); clockRef.current = null }
    }

    function endGame() {
        stopTicks()
        setGameEnded(true)
    }

    // ── Player action ────────────────────────────────────────────────────────────
    const handleAction = useCallback(async (action: SimAction) => {
        if (!session || isSubmitting || gameEnded) return
        if ((actionCooldowns[action.id] ?? 0) > 0) {
            toast(`⏳ ${action.label} ready in ${actionCooldowns[action.id]}s`, { duration: 1500 })
            return
        }
        setSubmitting(true)
        try {
            const res = await simService.action(session.sessionId, action.id, {})
            applyResult(res)
            startCooldown(action.id, COOLDOWN_SEC)
            if (res.isTerminal) {
                endGame()
                const won = res.outcome === 'won'
                toast.success(won ? '🎉 Mission Complete!' : '💔 Simulation Ended', { duration: 6000 })
                if (res.xpEarned && res.xpEarned > 0) {
                    setTimeout(() => toast.success(`+${res.xpEarned} XP earned!`, { duration: 4000 }), 1500)
                }
                res.newBadges?.forEach(b => {
                    setTimeout(() => toast.success(`🏅 Badge: ${b.label}!`, { duration: 5000 }), 2500)
                })
            }
        } catch {
            toast.error('Action failed. Try again.')
        } finally {
            setSubmitting(false)
        }
    }, [session, isSubmitting, actionCooldowns, gameEnded])

    const handleQuit = async () => {
        stopTicks()
        if (session?.sessionId && !gameEnded) {
            try { await simService.end(session.sessionId) } catch { }
        }
        navigate('/dashboard')
    }

    const togglePause = () => {
        const next = !isPaused
        setPaused(next)
        toast(next ? '⏸ Paused' : '▶️ Resumed!', { duration: 1000 })
    }

    // ── Guards ──────────────────────────────────────────────────────────────────
    if (isLoading || !session) return (
        <div className="min-h-screen bg-brand-surface flex items-center justify-center">
            <LoadingScreen text={`Starting ${meta?.shortTitle ?? 'SDG'} simulation…`} />
        </div>
    )

    const isTerminal = gameEnded || (session.status !== 'running' && session.status !== undefined)
    const elapsed = `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}`
    const turnsLeft = (session.maxTurns ?? 25) - (session.turn ?? 0)

    return (
        <div className="min-h-screen bg-brand-surface">
            {/* ── STICKY HEADER ──────────────────────────────────────────── */}
            <div className="sticky top-0 z-20 bg-brand-surface/90 backdrop-blur border-b border-brand-border">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
                    <button onClick={handleQuit} className="p-2 rounded-xl hover:bg-white/10 text-brand-subtext hover:text-white transition-colors">
                        <ArrowLeft size={18} />
                    </button>

                    {/* SDG badge */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                            className="w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white font-black font-display text-xs flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
                        >
                            <span className="text-[8px] opacity-70">SDG</span>
                            <span className="text-sm">{meta?.number}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{meta?.shortTitle}</p>
                            <p className="text-xs text-brand-subtext truncate">{meta?.theme}</p>
                        </div>
                    </div>

                    {/* Right side indicators */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Live timer */}
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${isPaused ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'}`} />
                            {elapsed}
                        </div>

                        {/* Turn counter */}
                        <div className="flex items-center gap-1 text-xs text-brand-subtext">
                            <Clock size={12} />
                            <span className="text-white font-semibold">{session.turn ?? 0}/{session.maxTurns ?? 25}</span>
                        </div>

                        {turnsLeft <= 5 && !isTerminal && (
                            <span className="text-xs font-bold text-red-400 bg-red-500/20 px-2 py-1 rounded-lg">⏰ {turnsLeft} left!</span>
                        )}

                        {/* Score */}
                        <div className="hidden sm:flex items-center gap-1 text-xs text-brand-subtext">
                            <Zap size={12} className="text-yellow-400" />
                            <span className="text-white font-semibold">{session.finalScore ?? '—'}</span>
                        </div>

                        {/* Pause */}
                        {!isTerminal && (
                            <button
                                onClick={togglePause}
                                className={`p-1.5 rounded-lg transition-all ${isPaused ? 'bg-yellow-500/30 text-yellow-400' : 'hover:bg-white/10 text-brand-subtext hover:text-white'}`}
                            >
                                {isPaused ? <Play size={15} /> : <Pause size={15} />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Turn progress */}
                <div className="max-w-5xl mx-auto px-4 pb-2">
                    <ProgressBar value={session.turn ?? 0} max={session.maxTurns ?? 25} color={color} height={3} />
                </div>
            </div>

            {/* ── FLOATING INFO BUTTONS ──────────────────────────────────── */}
            {!isTerminal && (
                <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
                    <button
                        onClick={() => setShowHowTo(true)}
                        className="w-11 h-11 rounded-full text-white shadow-xl flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: '#22c55e' }}
                        title="How to Play"
                    >
                        <HelpCircle size={18} />
                    </button>
                    <button
                        onClick={() => setShowAbout(true)}
                        className="w-11 h-11 rounded-full text-white shadow-xl flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: '#3b82f6' }}
                        title="About this SDG"
                    >
                        <BookOpen size={18} />
                    </button>
                </div>
            )}

            {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-4 py-6 grid lg:grid-cols-3 gap-5">

                {/* Left column: Stats + Actions */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Pause notice */}
                    {isPaused && !isTerminal && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
                            <Pause size={14} className="text-yellow-400" />
                            <span className="text-yellow-300 text-sm font-semibold">Paused — world is frozen</span>
                            <button onClick={togglePause} className="ml-auto text-xs text-yellow-400 underline">Resume</button>
                        </div>
                    )}

                    {/* Terminal result screen */}
                    {isTerminal && (
                        <div className="rounded-2xl border text-center p-8" style={{ borderColor: session.status === 'won' ? '#4C9F3866' : '#E5243B66', background: session.status === 'won' ? '#4C9F3810' : '#E5243B10' }}>
                            <div className="text-6xl mb-3">{session.status === 'won' ? '🏆' : '💔'}</div>
                            <h2 className="text-2xl font-display font-black text-white mb-1">
                                {session.status === 'won' ? 'Mission Complete!' : 'Mission Failed'}
                            </h2>
                            <p className="text-brand-subtext text-sm mb-1">
                                Final Score: <span className="text-3xl font-black text-white ml-1">{session.finalScore ?? 0}</span>
                            </p>
                            <p className="text-xs text-green-400 font-semibold mb-5">⏱ {elapsed}</p>
                            <div className="flex gap-3 justify-center">
                                <Button onClick={() => navigate('/dashboard')} variant="secondary">Dashboard</Button>
                                <Button onClick={() => { stopTicks(); window.location.reload() }} leftIcon={<RotateCcw size={14} />}>
                                    Play Again
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* World state */}
                    {!isTerminal && (
                        <Card accentColor={color} padding="md" hover={false}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-white uppercase tracking-wider opacity-60">📊 Live World State</h3>
                                <span className="text-xs text-green-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                    Live
                                </span>
                            </div>
                            <WorldStateGrid state={session.worldState} color={color} />
                        </Card>
                    )}

                    {/* Actions */}
                    {!isTerminal && (
                        <div>
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider opacity-60 mb-3">⚡ Actions</h3>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {(session.availableActions ?? []).map(action => (
                                    <ActionCard
                                        key={action.id}
                                        action={action}
                                        cooldown={actionCooldowns[action.id] ?? 0}
                                        loading={isSubmitting}
                                        color={color}
                                        onSelect={handleAction}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column: Events + Status */}
                <div className="space-y-4">
                    {/* Event feed */}
                    <Card padding="md" hover={false}>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider opacity-60 mb-3">📡 Live Events</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {eventFeed.length === 0 ? (
                                <p className="text-xs text-brand-subtext text-center py-6">Events will appear here…</p>
                            ) : (
                                eventFeed.map((e, i) => (
                                    <div key={i} className={`text-xs p-2 rounded-lg leading-relaxed ${i === 0 ? 'bg-white/10 text-white' : 'bg-white/5 text-brand-subtext'}`}>
                                        {e}
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Budget */}
                    {typeof (session.worldState.budget) === 'number' && (
                        <Card padding="md" hover={false}>
                            <p className="text-xs text-brand-subtext mb-1">💰 Budget</p>
                            <p className={`text-xl font-display font-black ${(session.worldState.budget as number) < 5_000_000 ? 'text-red-400' : 'text-white'}`}>
                                ${((session.worldState.budget as number) / 1_000_000).toFixed(1)}M
                            </p>
                            <ProgressBar value={session.worldState.budget as number} max={30_000_000} color={(session.worldState.budget as number) < 5_000_000 ? '#E5243B' : color} height={5} className="mt-2" />
                        </Card>
                    )}

                    {/* Progress card */}
                    <Card padding="md" hover={false}>
                        <p className="text-xs text-brand-subtext mb-2">⏱ Session</p>
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-semibold text-white">Turn {session.turn ?? 0} / {session.maxTurns ?? 25}</span>
                            <span className="text-xs font-mono text-brand-subtext">{elapsed}</span>
                        </div>
                        <ProgressBar value={session.turn ?? 0} max={session.maxTurns ?? 25} color={color} height={6} />
                        <p className="text-xs text-brand-subtext mt-2">{turnsLeft > 0 ? `${turnsLeft} turns remaining` : 'Last turn!'}</p>
                    </Card>

                    {/* Tip */}
                    {info?.tip && (
                        <div className="rounded-xl border border-brand-border bg-brand-muted/50 p-3">
                            <p className="text-xs font-bold text-brand-subtext uppercase tracking-wider mb-1">💡 Tip</p>
                            <p className="text-xs text-brand-subtext leading-relaxed">{info.tip}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── MODALS ─────────────────────────────────────────────────── */}
            {showHowTo && info?.howToPlay && (
                <InfoModal onClose={() => setShowHowTo(false)} color={color} title="How to Play" icon={<HelpCircle size={20} />} sdgMeta={meta}>
                    <div className="space-y-4">
                        <Sect label="🎯 Objective">{info.howToPlay.objective}</Sect>
                        <div>
                            <p className="text-xs font-bold mb-1.5" style={{ color }}>🕹️ Controls</p>
                            <ul className="space-y-1">
                                {info.howToPlay.controls.map((c, i) => (
                                    <li key={i} className="text-sm text-brand-subtext flex gap-2"><span className="text-green-400">•</span>{c}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                                <p className="text-xs font-bold text-green-400 mb-1">🏆 Win</p>
                                <p className="text-xs text-brand-subtext">{info.howToPlay.winCondition}</p>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                <p className="text-xs font-bold text-red-400 mb-1">💔 Lose</p>
                                <p className="text-xs text-brand-subtext">{info.howToPlay.loseCondition}</p>
                            </div>
                        </div>
                        <Sect label="⭐ Scoring">{info.howToPlay.scoring}</Sect>
                    </div>
                    <Button className="w-full mt-5" onClick={() => setShowHowTo(false)} style={{ background: color }}>Got it!</Button>
                </InfoModal>
            )}

            {showAbout && info?.about && (
                <InfoModal onClose={() => setShowAbout(false)} color={color} title={meta?.title ?? ''} icon={<BookOpen size={20} />} sdgMeta={meta}>
                    <div className="space-y-4">
                        <Sect label="🌍 What is it?">{info.about.realWorldDesc}</Sect>
                        <div>
                            <p className="text-xs font-bold mb-1.5" style={{ color }}>📌 Key Goals</p>
                            <ul className="space-y-1.5">
                                {info.about.subGoals.map((g, i) => (
                                    <li key={i} className="text-sm text-brand-subtext flex gap-2">
                                        <span className="text-yellow-400 text-xs font-bold mt-0.5">{i + 1}.</span>{g}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                            <p className="text-xs font-bold text-blue-400 mb-1">💡 Why it matters</p>
                            <p className="text-sm text-brand-subtext">{info.about.whyItMatters}</p>
                        </div>
                        <div className="bg-brand-muted rounded-xl p-3">
                            <p className="text-xs font-bold text-brand-subtext mb-1">🌐 Real example</p>
                            <p className="text-sm text-brand-subtext">{info.about.realLifeExample}</p>
                        </div>
                    </div>
                    <Button className="w-full mt-5" variant="secondary" onClick={() => setShowAbout(false)}>Close</Button>
                </InfoModal>
            )}
        </div>
    )
}

// ─── WorldStateGrid ───────────────────────────────────────────────────────────
function WorldStateGrid({ state, color }: { state: Record<string, unknown>; color: string }) {
    const skip = new Set(['turn', 'maxTurns', 'seed', '_researchBonus', 'population', 'rngSeed', 'rngCallCount'])
    const entries = Object.entries(state).filter(([k, v]) => !skip.has(k) && typeof v === 'number')

    if (entries.length === 0) return <p className="text-xs text-brand-subtext text-center py-4">Loading world data…</p>

    const fmt = (k: string, n: number) => {
        if (k.toLowerCase().includes('budget') || k.toLowerCase().includes('fund')) return `$${(n / 1_000_000).toFixed(1)}M`
        if (n > 1_000) return `${(n / 1_000).toFixed(1)}k`
        if (Number.isInteger(n)) return `${n}`
        return n.toFixed(1)
    }
    const getMax = (k: string, n: number) => {
        const lk = k.toLowerCase()
        if (lk.includes('budget') || lk.includes('fund')) return 30_000_000
        if (n <= 1) return 1
        if (n > 1_000) return Math.max(n * 1.5, 5_000)
        return 100
    }

    return (
        <div className="grid grid-cols-2 gap-3">
            {entries.slice(0, 12).map(([k, v]) => {
                const n = v as number
                const max = getMax(k, n)
                const label = k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
                const pct = Math.min(100, (n / max) * 100)
                const isLow = max === 100 && pct < 20
                return (
                    <div key={k} className={`p-3 rounded-xl ${isLow ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5'}`}>
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs text-brand-subtext truncate">{label}</span>
                            <span className={`text-xs font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>{fmt(k, n)}</span>
                        </div>
                        <ProgressBar value={Math.max(0, n)} max={Math.max(1, max)} color={isLow ? '#E5243B' : color} height={4} />
                    </div>
                )
            })}
        </div>
    )
}

// ─── ActionCard ────────────────────────────────────────────────────────────────
function ActionCard({ action, cooldown, loading, color, onSelect }: {
    action: SimAction; cooldown: number; loading: boolean; color: string; onSelect: (a: SimAction) => void
}) {
    const onCd = cooldown > 0
    return (
        <button
            onClick={() => onSelect(action)}
            disabled={loading || onCd}
            className={`relative w-full text-left p-4 rounded-xl border transition-all duration-200 overflow-hidden
                ${onCd || loading
                    ? 'border-brand-border bg-brand-muted opacity-60 cursor-not-allowed'
                    : 'border-brand-border bg-brand-muted hover:bg-white/5 hover:scale-[1.01] cursor-pointer'
                }`}
        >
            {onCd && (
                <div className="absolute inset-0 flex items-center justify-center bg-brand-surface/70 rounded-xl">
                    <span className="text-sm font-bold text-brand-subtext font-mono">⏳ {cooldown}s</span>
                </div>
            )}
            <p className="font-semibold text-sm text-white mb-2 leading-tight">{action.label}</p>
            <div className="flex items-center gap-2">
                {action.cost > 0 && (
                    <Badge color="#FCC30B" variant="soft" size="sm">💰 ${(action.cost / 1000).toFixed(0)}k</Badge>
                )}
                {action.cost === 0 && <Badge color="#4C9F38" variant="soft" size="sm">Free</Badge>}
            </div>
        </button>
    )
}

// ─── InfoModal ─────────────────────────────────────────────────────────────────
function InfoModal({ children, onClose, color, title, icon, sdgMeta }: {
    children: React.ReactNode; onClose: () => void; color: string; title: string; icon: React.ReactNode; sdgMeta: any
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div
                className="relative bg-brand-surface border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-2xl overflow-y-auto max-h-[88vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: color }}>
                        {icon}
                    </div>
                    <div>
                        <h2 className="font-display font-black text-white">{title}</h2>
                        <p className="text-xs text-brand-subtext">{sdgMeta?.shortTitle} · {sdgMeta?.theme}</p>
                    </div>
                    <button onClick={onClose} className="ml-auto p-2 rounded-lg hover:bg-white/10 text-brand-subtext hover:text-white transition-colors">✕</button>
                </div>
                {children}
            </div>
        </div>
    )
}

function Sect({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs font-bold text-white mb-1.5">{label}</p>
            <p className="text-sm text-brand-subtext leading-relaxed">{String(children)}</p>
        </div>
    )
}
