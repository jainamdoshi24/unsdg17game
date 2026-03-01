import React, { useState, useEffect } from 'react'
import { BookOpen, Play, ChevronRight } from 'lucide-react'
import { Card } from '@/components/Card'
import { Badge, ProgressBar } from '@/components/Badge'
import { Button } from '@/components/Button'
import { SDG_META, SDG_MAP } from '@/utils/sdgConfig'
import type { SdgId } from '@/types'
import api from '@/services/api'
import QuizModal from './QuizModal'

interface SdgQuizProgress {
    sdgId: SdgId
    bestScore: number
    completions: number
}

export default function QuizSection() {
    const [quizBests, setQuizBests] = useState<Record<string, number>>({})
    const [quizStats, setQuizStats] = useState<Record<string, { attempts: number; totalCorrect: number; totalQuestions: number }>>({})
    const [sdgProgress, setSdgProgress] = useState<Record<string, { completions: number }>>({})
    const [activeQuiz, setActiveQuiz] = useState<SdgId | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [progRes, bestRes] = await Promise.all([
                api.get('/progress/me'),
                api.get('/quiz/best'),
            ])
            setSdgProgress(progRes.data.sdgProgress ?? {})
            setQuizBests(bestRes.data.quizBests ?? {})
            setQuizStats(bestRes.data.quizStats ?? {})
        } catch { /* silently fail */ }
        finally { setIsLoading(false) }
    }

    // Show ALL SDGs — not just played ones. Mark unplayed ones as locked for quiz.
    const allSdgs = SDG_META

    if (isLoading) return (
        <div className="space-y-4">
            <div className="h-6 bg-white/5 rounded-lg w-48 animate-pulse" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
        </div>
    )

    // Always show quiz section

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                        <BookOpen size={20} className="text-brand-primary" />
                        Test Your Knowledge
                    </h2>
                    <p className="text-xs text-brand-subtext mt-0.5">Quiz all 17 SDGs. Earn bonus XP for each one!</p>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {allSdgs.map(sdg => {
                    const best = quizBests[sdg.id]
                    const stats = quizStats[sdg.id]
                    const hasBest = best !== undefined
                    const goodScore = best && best >= 80

                    return (
                        <Card
                            key={sdg.id}
                            accentColor={sdg.color}
                            padding="md"
                            className="group cursor-pointer hover:scale-[1.02] transition-transform"
                            onClick={() => setActiveQuiz(sdg.id as SdgId)}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white font-black font-display text-xs flex-shrink-0"
                                    style={{ background: `linear-gradient(135deg, ${sdg.color}, ${sdg.color}99)` }}
                                >
                                    <span className="opacity-70 text-[8px]">SDG</span>
                                    <span>{sdg.number}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm leading-tight truncate">{sdg.shortTitle}</p>
                                    {hasBest ? (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-xs text-brand-subtext">Best:</span>
                                            <span className={`text-xs font-bold ${goodScore ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {best}%
                                            </span>
                                            {goodScore && <span className="text-xs">🏆</span>}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-brand-subtext mt-0.5">Not attempted</p>
                                    )}
                                </div>
                            </div>

                            {hasBest && (
                                <ProgressBar value={best} max={100} color={goodScore ? '#4C9F38' : sdg.color} height={3} className="mb-3" />
                            )}

                            <div className="flex items-center justify-between">
                                <div className="text-xs text-brand-subtext space-y-1">
                                    <div>{!hasBest ? '📚 +up to 100 XP' : best >= 80 ? '🎯 Mastered!' : '🔄 Improve score'}</div>
                                    {hasBest && stats && <div className="font-medium">📝 {stats.attempts} Attempt{stats.attempts !== 1 ? 's' : ''}</div>}
                                </div>
                                <button
                                    className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all"
                                    style={{ background: `${sdg.color}30`, color: sdg.color }}
                                >
                                    <Play size={10} />
                                    {hasBest ? 'Retry' : 'Start'}
                                </button>
                            </div>
                        </Card>
                    )
                })}
            </div>

            {/* Quiz modal */}
            {activeQuiz && (
                <QuizModal
                    sdgId={activeQuiz}
                    onClose={() => setActiveQuiz(null)}
                    onComplete={(xpEarned, score, total) => {
                        loadData()  // Refresh best scores and progress
                    }}
                />
            )}
        </div>
    )
}
