import React, { useEffect, useCallback, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, RotateCcw, Clock, Pause, Play, HelpCircle, BookOpen
} from 'lucide-react'
import { useSimStore } from '@/store/simStore'
import { simService } from '@/services/simService'
import { LoadingScreen } from '@/components/Spinner'
import { SDG_MAP, SDG_INFO } from '@/utils/sdgConfig'
import type { SdgId, SimAction } from '@/types'
import toast from 'react-hot-toast'

const TICK_MS = 3000
class ErrorBoundary extends React.Component<{ children: any }, { hasError: boolean, error: any }> {
    constructor(props: any) {
        super(props)
        this.state = { hasError: false, error: null }
    }
    static getDerivedStateFromError(error: any) { return { hasError: true, error } }
    render() {
        if (this.state.hasError) return <div className="p-10 bg-red-100 text-red-900"><h1 className="text-3xl font-bold">Crash:</h1><pre className="mt-4 bg-red-50 p-4">{this.state.error?.message}</pre><pre className="mt-2 text-xs">{this.state.error?.stack}</pre></div>
        return this.props.children
    }
}

const COOLDOWN_SEC = 12

export default function SimulationGameWrapper() {
    return <ErrorBoundary><SimulationGame /></ErrorBoundary>
}

function SimulationGame() {
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

    const [introTab, setIntroTab] = useState<'play' | 'learn'>('play')
    const [hasStarted, setHasStarted] = useState(false)

    useEffect(() => { sessionRef.current = session }, [session])
    useEffect(() => { pausedRef.current = isPaused }, [isPaused])

    useEffect(() => {
        if (!sdgId) return
        reset()
        setGameEnded(false)
        setHasStarted(false)
    }, [sdgId])

    const meta = SDG_MAP[sdgId as SdgId]
    const info = SDG_INFO[sdgId as SdgId]
    const color = meta?.color ?? '#6366F1'

    const startGame = async () => {
        setLoading(true)
        try {
            const s = await simService.start(sdgId as SdgId, 1)
            setSession(s)
            setHasStarted(true)
            startTicks()
        } catch {
            toast.error('Could not start simulation. Is the backend running?')
            navigate('/dashboard')
        } finally {
            setLoading(false)
        }
    }

    function startTicks() {
        stopTicks()
        tickRef.current = setInterval(async () => {
            const s = sessionRef.current
            if (!s || pausedRef.current || s.status !== 'running') return
            try {
                const res = await simService.tick(s.sessionId)
                applyTick(res)
                if (res.isTerminal) endGame()
            } catch { /* silent */ }
        }, TICK_MS)

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

    if (isLoading) return (
        <div className="min-h-screen bg-brand-surface flex items-center justify-center">
            <LoadingScreen text={`Starting ${meta?.shortTitle ?? 'SDG'} simulation…`} />
        </div>
    )

    if (!hasStarted) {
        return (
            <div className="min-h-screen bg-[#87CEEB] flex items-center justify-center p-4">
                <div className="bg-[#fdf5e6] border-[8px] border-[#d4b97a] rounded-[2rem] max-w-2xl w-full p-8 shadow-2xl animate-scale-in text-center flex flex-col max-h-[90vh]">
                    <div className="w-20 h-20 mx-auto rounded-3xl flex items-center flex-shrink-0 justify-center text-4xl mb-4 shadow-lg border-[4px] border-white/40" style={{ background: color }}>
                        {meta?.emoji}
                    </div>
                    <h1 className="font-display font-black flex-shrink-0 text-3xl md:text-4xl text-[#6b5514] mb-4 uppercase tracking-wide">
                        {meta?.title}
                    </h1>

                    <div className="flex gap-2 justify-center mb-0">
                        <button
                            onClick={() => setIntroTab('play')}
                            className={`px-6 py-2 rounded-t-xl font-black text-lg border-t-4 border-x-4 transition-colors ${introTab === 'play' ? 'bg-white border-[#e3cca0] text-[#8b5a2b]' : 'bg-[#e3cca0]/40 border-transparent text-[#a87a42] hover:bg-[#e3cca0]/60'}`}>
                            How to Play
                        </button>
                        <button
                            onClick={() => setIntroTab('learn')}
                            className={`px-6 py-2 rounded-t-xl font-black text-lg border-t-4 border-x-4 transition-colors ${introTab === 'learn' ? 'bg-white border-[#e3cca0] text-[#1e466b]' : 'bg-[#e3cca0]/40 border-transparent text-[#a87a42] hover:bg-[#e3cca0]/60'}`}>
                            Learn
                        </button>
                    </div>

                    <div className="bg-white border-4 border-[#e3cca0] rounded-b-2xl rounded-t-none p-4 md:p-6 text-left mb-6 shadow-inner overflow-y-auto min-h-[250px] custom-scrollbar">
                        {introTab === 'play' ? (
                            <>
                                <h2 className="text-xl font-bold text-[#8b5a2b] mb-4 border-b-2 border-[#e3cca0] pb-2 flex items-center gap-2">
                                    <HelpCircle size={24} /> Mission Briefing
                                </h2>
                                <p className="font-bold text-[#5c4a21] mb-3 text-lg leading-snug">
                                    {info?.howToPlay?.objective}
                                </p>
                                <ul className="list-disc pl-6 text-[#5c4a21] space-y-2 font-medium mb-5">
                                    {info?.howToPlay?.controls.map((c: string, i: number) => <li key={i}>{c}</li>)}
                                </ul>
                                <div className="flex flex-col gap-2 bg-[#f4e4bc] p-4 rounded-xl border-2 border-[#d4b97a]">
                                    <p className="text-green-700 font-black flex items-center gap-2"><span>🏆 WIN:</span> <span className="font-bold">{info?.howToPlay?.winCondition}</span></p>
                                    <p className="text-red-700 font-black flex items-center gap-2"><span>💔 LOSE:</span> <span className="font-bold">{info?.howToPlay?.loseCondition}</span></p>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-bold text-[#1e466b] mb-4 border-b-2 border-[#b8d4f0] pb-2 flex items-center gap-2">
                                    <BookOpen size={24} /> About {meta?.shortTitle}
                                </h2>
                                <p className="font-bold text-[#345c81] mb-4 text-base leading-relaxed">
                                    {info?.about?.realWorldDesc}
                                </p>
                                <div className="bg-[#e9f2fa] p-4 rounded-xl border-2 border-[#b8d4f0] font-semibold text-[#1e466b] text-sm mb-4">
                                    💡 <span className="text-[#345c81]">Why it Matters:</span> {info?.about?.whyItMatters}
                                </div>
                                <h3 className="font-bold text-[#1e466b] mb-2 uppercase text-xs tracking-wider">Targets</h3>
                                <ul className="list-disc pl-6 text-[#345c81] space-y-2 font-medium text-sm">
                                    {info?.about?.subGoals.map((g: string, i: number) => <li key={i}>{g}</li>)}
                                </ul>
                            </>
                        )}
                    </div>

                    <div className="flex justify-center flex-shrink-0 gap-4">
                        <button onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-[#e9d28e] border-b-[6px] border-[#b59e53] text-[#6b5514] font-black text-xl rounded-2xl hover:translate-y-1 hover:border-b-[0px] active:border-b-[0px] transition-all">
                            Back
                        </button>
                        <button onClick={startGame} className="px-10 py-4 bg-[#db4b4b] border-b-[6px] border-[#9e2a2a] text-white font-black text-xl rounded-2xl hover:translate-y-1 hover:border-b-[0px] active:border-b-[0px] transition-all flex items-center gap-2">
                            <Play fill="currentColor" size={24} /> Play Now
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (!session) return null

    const isTerminal = gameEnded || (session.status !== 'running' && session.status !== undefined)

    const currency = { icon: '💰', name: 'Budget' }

    const charUrl = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(meta?.shortTitle || 'hero')}&backgroundColor=transparent`

    return (
        <div className="h-[100dvh] w-screen relative flex flex-col font-display bg-[#87CEEB] overflow-hidden select-none">

            {/* Playful Dotted Background (Zero network requests, never black) */}
            <div className="absolute inset-0 opacity-30 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#ffffff 3px, transparent 3px)', backgroundSize: '30px 30px' }}></div>

            {/* Top Bar (Game Header) */}
            <div className="relative z-10 p-3 md:p-4 flex justify-between items-center pointer-events-auto bg-white/20 backdrop-blur-md border-b-[4px] border-white/40 shadow-sm">
                <div className="flex gap-2 items-center">
                    <button onClick={handleQuit} className="w-14 h-14 bg-[#d83b3b] border-4 border-[#8b1c1c] rounded-full text-white flex justify-center items-center shadow-lg hover:scale-105 active:translate-y-1 transition-transform">
                        <ArrowLeft size={28} strokeWidth={3} />
                    </button>
                    <div className="bg-[#db4b4b] border-[4px] border-[#9e2a2a] rounded-full px-6 py-2 text-white font-black text-xl md:text-2xl shadow-xl flex items-center gap-2">
                        <span>{meta?.emoji}</span> {meta?.shortTitle}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Dynamic Action Currency / Resource */}
                    {typeof session.worldState.budget === 'number' && (
                        <div className="hidden md:flex bg-[#f0ba3a] text-[#5c4a21] border-[4px] border-[#b07d12] rounded-full px-5 py-2 font-black text-xl shadow-xl items-center gap-2" title={currency.name}>
                            <span className="text-2xl drop-shadow-sm">{currency.icon}</span> {(session.worldState.budget as number).toLocaleString()}
                        </div>
                    )}
                    {/* Turns */}
                    <div className="hidden md:flex bg-[#4b8edb] text-white border-[4px] border-[#2a5b9e] rounded-full px-5 py-2 font-black text-xl shadow-xl items-center gap-2">
                        <Clock size={24} strokeWidth={3} /> {session.turn}/{session.maxTurns}
                    </div>
                    {/* Pause */}
                    {!isTerminal && (
                        <button onClick={togglePause} className="w-14 h-14 bg-[#e9d28e] border-4 border-[#b59e53] rounded-2xl text-[#6b5514] flex justify-center items-center shadow-lg hover:scale-105 active:translate-y-1 transition-transform">
                            {isPaused ? <Play size={28} fill="currentColor" /> : <Pause size={28} fill="currentColor" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Main World Area - Completely dense layout to fill empty space */}
            <div className="relative z-10 flex-1 flex flex-col p-2 md:p-4 pointer-events-none w-full max-w-[1600px] mx-auto overflow-hidden">

                {isTerminal ? (
                    <div className="pointer-events-auto self-center bg-[#fdf5e6] border-[8px] border-[#d4b97a] rounded-[3rem] p-10 text-center shadow-2xl max-w-2xl animate-scale-in my-auto">
                        <div className="text-8xl mb-4 drop-shadow-xl">{session.status === 'won' ? '🏆' : '💔'}</div>
                        <h2 className="text-5xl font-display font-black text-[#8b5a2b] mb-2 uppercase tracking-wide">
                            {session.status === 'won' ? 'Victory!' : 'Game Over'}
                        </h2>
                        <p className="text-2xl text-[#a87a42] font-bold mb-6">
                            Score: <span className="text-[#d83b3b]">{session.finalScore ?? 0}</span>
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => navigate('/dashboard')} className="px-8 py-3 bg-[#e9d28e] border-b-[6px] border-[#b59e53] text-[#6b5514] font-black text-xl rounded-2xl hover:translate-y-1 hover:border-b-[0px] transition-all">
                                Map
                            </button>
                            <button onClick={() => { stopTicks(); window.location.reload() }} className="px-8 py-3 bg-[#db4b4b] border-b-[6px] border-[#9e2a2a] text-white font-black text-xl rounded-2xl hover:translate-y-1 hover:border-b-[0px] transition-all flex items-center gap-2">
                                <RotateCcw size={24} strokeWidth={3} /> Replay
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col lg:flex-row gap-4 h-full pointer-events-auto">

                        {/* LEFT COLUMN: Character, Tasks, & Stats */}
                        <div className="w-full lg:w-[40%] flex flex-col gap-4 overflow-y-auto lg:overflow-hidden pr-2 flex-shrink-0">

                            {/* Speech Bubble & Character */}
                            <div className="bg-white border-[4px] border-[#d4b97a] rounded-2xl p-3 text-[#5c4a21] font-black shadow-lg flex flex-row items-center gap-3 relative overflow-hidden flex-shrink-0">
                                {/* Portrait */}
                                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl border-2 border-white shadow-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex flex-shrink-0 items-center justify-center overflow-hidden">
                                    <img src={charUrl} alt="NPC" className="w-full h-full object-cover scale-110" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-[#c29b47] uppercase text-[9px] tracking-widest mb-0.5">Objective</h3>
                                    <p className="text-xs lg:text-sm leading-tight">
                                        "{info?.howToPlay?.objective || 'Complete tasks to help the world!'}"
                                    </p>
                                </div>
                            </div>

                            {/* Unified Tasks Board */}
                            <div className="flex-1 bg-[#8b5a2b] border-[4px] border-[#5e3a18] rounded-2xl p-2 md:p-3 shadow-lg flex flex-col overflow-hidden">
                                <span className="text-[#fdf5e6] text-center font-black text-lg xl:text-xl tracking-widest mb-1 xl:mb-2 drop-shadow-md flex-shrink-0">TASKS & STATS 📋</span>
                                <div className="flex-1 bg-[#fdf5e6] border-[3px] border-[#5e3a18] rounded-xl p-2 shadow-inner flex flex-col overflow-hidden">
                                    <WorldStateTasks state={session.worldState} />

                                    <div className="mt-2 flex-shrink-0">
                                        <div className="bg-[#f4e4bc] p-1.5 rounded-xl border-2 border-[#d4b97a] text-[10px] xl:text-xs font-black text-[#5c4a21] text-center shadow-inner truncate">
                                            {eventFeed[0] || "Awaiting news..."}
                                        </div>
                                    </div>
                                </div>

                                {/* Menu Links */}
                                <div className="flex gap-2 w-full justify-center mt-2 flex-shrink-0">
                                    <button onClick={() => setShowHowTo(true)} className="flex-1 py-1.5 bg-[#d4b97a] border-[2px] border-[#b89f66] text-[#5c4a21] rounded-lg font-black text-xs hover:scale-105 active:scale-95 transition flex justify-center items-center gap-1"><HelpCircle size={14} /> Tips</button>
                                    <button onClick={() => setShowAbout(true)} className="flex-1 py-1.5 bg-[#4b8edb] border-[2px] border-[#2a5b9e] text-white rounded-lg font-black text-xs hover:scale-105 active:scale-95 transition flex justify-center items-center gap-1"><BookOpen size={14} /> Info</button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Actions Console */}
                        <div className="w-full lg:w-[60%] flex-none bg-[#e1c699] border-[4px] border-[#c4a977] rounded-2xl p-2 md:p-3 shadow-lg flex flex-col overflow-hidden relative">
                            <h3 className="text-[#8b5a2b] font-black text-lg lg:text-xl tracking-widest text-center uppercase mb-2 drop-shadow-sm border-b-[2px] border-[#c4a977] pb-1 flex-shrink-0">Available Actions</h3>

                            {/* Action Buttons Scrolling Grid */}
                            <div className="flex-1 overflow-hidden">
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2 h-full pb-1" style={{ gridAutoRows: '1fr' }}>
                                    {(session.availableActions ?? []).map((a: SimAction) => {
                                        const disabled = isSubmitting || (a.cost > (session.worldState.budget as number)) || ((actionCooldowns[a.id] ?? 0) > 0)
                                        const onCd = (actionCooldowns[a.id] ?? 0) > 0
                                        return (
                                            <div key={a.id} className="relative group h-full">
                                                {onCd && (
                                                    <div className="absolute inset-x-0 -top-2 flex justify-center z-10">
                                                        <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-red-800 shadow-sm animate-bounce">
                                                            Wait {actionCooldowns[a.id]}s
                                                        </span>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => !disabled && handleAction(a)}
                                                    disabled={disabled}
                                                    className={`w-full h-full flex flex-col items-center justify-center p-2 border-[3px] rounded-2xl transition-all duration-200 shadow-[0_4px_0_rgb(0,0,0,0.2)] active:shadow-none active:translate-y-1
                                                        ${disabled
                                                            ? 'bg-gray-300 border-gray-400 opacity-60 cursor-not-allowed'
                                                            : 'bg-white border-[#d4b97a] hover:bg-[#fef9e7] hover:-translate-y-0.5 hover:shadow-[0_4px_6px_rgb(0,0,0,0.2)]'}`}
                                                >
                                                    <div className="flex flex-col items-center justify-center w-full flex-1">
                                                        <span className="text-2xl xl:text-3xl mb-1 drop-shadow-sm">
                                                            {(() => {
                                                                const match = a.label.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)\s*/u);
                                                                return match ? match[1] : (a.emoji || (a.cost > 0 ? '🛠️' : '📢'));
                                                            })()}
                                                        </span>
                                                        <span className="font-black text-[#5c4a21] text-[11px] xl:text-xs drop-shadow-sm leading-tight text-center block w-full px-1 break-words">
                                                            {(() => {
                                                                const match = a.label.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)\s*(.*)$/u);
                                                                return match ? match[2] : a.label;
                                                            })()}
                                                        </span>
                                                    </div>

                                                    <div className="mt-1 flex flex-col w-full gap-1 items-center justify-end flex-shrink-0">
                                                        <span className={`px-2 py-0.5 xl:py-1 rounded-md text-[10px] xl:text-xs font-black text-white shadow-inner w-full text-center ${a.cost === 0 ? 'bg-[#56cd4d] border-[2px] border-[#3ba034]' : 'bg-[#e29337] border-[2px] border-[#b07328]'}`}>
                                                            {currency.icon} {a.cost === 0 ? 'Free' : a.cost.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {
                showHowTo && info?.howToPlay && (
                    <InfoModal onClose={() => setShowHowTo(false)} title="How to Play" bg="#4C9F38" icon="❓">
                        <p className="font-bold text-[#5c4a21] mb-2">{info.howToPlay.objective}</p>
                        <ul className="list-disc pl-5 text-[#5c4a21] space-y-1 font-semibold mb-4">
                            {info.howToPlay.controls.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                        <div className="bg-[#fdf5e6] p-3 rounded-xl border-2 border-[#d4b97a]">
                            <p className="text-green-700 font-bold">⭐ WIN: {info.howToPlay.winCondition}</p>
                            <p className="text-red-700 font-bold mt-2">💔 LOSE: {info.howToPlay.loseCondition}</p>
                        </div>
                    </InfoModal>
                )
            }

            {
                showAbout && info?.about && (
                    <InfoModal onClose={() => setShowAbout(false)} title={meta?.title ?? 'About'} bg="#19486A" icon="🌍">
                        <p className="font-bold text-[#5c4a21] mb-2">{info.about.realWorldDesc}</p>
                        <ul className="list-disc pl-5 text-[#5c4a21] space-y-1 font-semibold mb-4 text-sm">
                            {info.about.subGoals.map((g, i) => <li key={i}>{g}</li>)}
                        </ul>
                        <div className="bg-[#e9f2fa] p-3 rounded-xl border-2 border-[#b8d4f0] font-semibold text-[#1e466b] text-sm">
                            💡 {info.about.whyItMatters}
                        </div>
                    </InfoModal>
                )
            }
        </div >
    )
}

function WorldStateTasks({ state }: { state: Record<string, unknown> }) {
    const skip = new Set(['turn', 'maxTurns', 'seed', '_researchBonus', 'population', 'rngSeed', 'rngCallCount', 'budget'])

    // Filter out internal variables, flat counts, and non-percentage trackers 
    const entries = Object.entries(state).filter(([k, v]) => {
        if (skip.has(k) || typeof v !== 'number') return false

        const lowered = k.toLowerCase()
        if (lowered.includes('units')) return false
        if (lowered.includes('farms')) return false
        if (lowered.includes('plants')) return false
        if (lowered.includes('cost')) return false
        if (lowered.includes('active')) return false
        if (lowered.includes('built')) return false
        if (lowered.includes('capacity')) return false
        if (lowered.includes('count')) return false
        if (lowered.includes('score')) return false

        return true
    }).slice(0, 4)

    if (entries.length === 0) return <p className="text-sm text-center font-bold text-[#a87a42]">Loading tasks...</p>

    const getMax = (k: string, n: number) => {
        if (n <= 1) return 1
        if (n > 1_000) return Math.max(n * 1.5, 5_000)
        return 100
    }

    return (
        <div className="flex-1 w-full grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 2xl:gap-3 content-start overflow-hidden py-1">
            {entries.map(([k, v]) => {
                const n = v as number
                const max = getMax(k, n)
                let label = k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
                let pct = Math.min(100, (n / max) * 100)
                let isWarning = max === 100 && pct < 30

                // Keep values normalized naturally
                if (max > 1000) pct = Math.min(100, Math.max(10, pct))

                return (
                    <div key={k} className="flex flex-col bg-white/40 p-1.5 2xl:p-2 rounded-lg border-2 border-[#e3cca0]">
                        <div className="flex justify-between items-end mb-1 w-full">
                            <span className="font-black text-[#5c4a21] uppercase text-[10px] 2xl:text-xs tracking-wide flex items-center gap-1 truncate pr-1">
                                {isWarning && <span className="text-red-500 animate-pulse">⚠️</span>} {label}
                            </span>
                            <span className="font-black text-[#8b5a2b] text-[10px] 2xl:text-xs">{Math.floor(pct)}%</span>
                        </div>
                        <div className="h-2 2xl:h-2.5 bg-[#e3cca0] rounded-full overflow-hidden shadow-inner flex-shrink-0 border border-[#c4a977]">
                            <div
                                className={`h-full transition-all duration-500 ${isWarning ? 'bg-red-500' : 'bg-[#4C9F38]'}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}



function GameActionButton({ action, index, cooldown, loading, onSelect }: any) {
    const onCd = cooldown > 0
    const colors = [
        { main: '#f0ba3a', border: '#b07d12', text: '#5c4a21' },
        { main: '#4b8edb', border: '#2a5b9e', text: '#ffffff' },
        { main: '#4C9F38', border: '#2d6620', text: '#ffffff' },
        { main: '#db4b4b', border: '#9e2a2a', text: '#ffffff' }
    ]
    const theme = colors[index % colors.length]

    return (
        <button
            onClick={() => onSelect(action)}
            disabled={loading || onCd}
            className={`relative w-full flex-1 flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl md:rounded-3xl border-b-[6px] transition-all duration-100 outline-none
                ${onCd || loading
                    ? 'bg-gray-400 border-gray-600 text-gray-200 opacity-80 cursor-not-allowed scale-95 border-b-[2px] mt-[4px]'
                    : 'hover:-translate-y-1 hover:border-b-[8px] active:translate-y-1 active:border-b-[0px] active:mt-[6px] cursor-pointer'
                }`}
            style={!(onCd || loading) ? { backgroundColor: theme.main, borderColor: theme.border, color: theme.text } : {}}
        >
            {onCd && (
                <div className="absolute inset-x-0 -top-3 flex justify-center z-10">
                    <span className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full border-2 border-red-800 shadow-md animate-bounce">
                        Wait {cooldown}s
                    </span>
                </div>
            )}

            <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center text-xl md:text-3xl lg:mb-2 bg-black/10 border-2 border-black/10 shadow-inner`}>
                {action.cost > 0 ? '🛠️' : '📢'}
            </div>

            <p className="font-display font-black text-xs md:text-sm text-center leading-tight min-h-[32px] md:min-h-[40px] flex items-center justify-center drop-shadow-sm mt-1">
                {action.label}
            </p>

            <div className="mt-1 md:mt-2 text-[10px] md:text-xs font-black bg-black/20 px-2 md:px-3 py-1 rounded-full shadow-inner flex items-center gap-1">
                {action.cost > 0 ? (
                    <>🪙 {(action.cost / 1_000_000).toFixed(1)}M</>
                ) : (
                    <>FREE</>
                )}
            </div>
        </button>
    )
}

function InfoModal({ children, onClose, title, bg, icon }: any) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative bg-[#f4e4bc] border-[8px] border-[#8b5a2b] rounded-[2rem] max-w-md w-full p-6 shadow-2xl animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-4 mb-6 relative">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl md:text-4xl shadow-md border-4 border-white/30" style={{ background: bg }}>
                        {icon}
                    </div>
                    <h2 className="font-display font-black text-2xl md:text-3xl text-[#6b5514]">{title}</h2>
                    <button onClick={onClose} className="absolute -top-10 -right-6 md:-right-10 w-12 h-12 bg-[#db4b4b] border-[4px] border-[#9e2a2a] text-white rounded-full font-black text-xl hover:scale-110 transition-transform shadow-xl">✕</button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar lg:hidden-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    )
}
