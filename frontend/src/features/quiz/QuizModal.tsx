import React, { useState, useEffect, useCallback, useRef } from 'react'
import { X, Clock, ChevronRight, Trophy, Zap, RotateCcw } from 'lucide-react'
import { Button } from '@/components/Button'
import { ProgressBar, Badge } from '@/components/Badge'
import type { SdgId } from '@/types'
import { SDG_MAP } from '@/utils/sdgConfig'
import api from '@/services/api'
import toast from 'react-hot-toast'

interface QuizQuestion {
    questionId: string
    content: {
        stem: string
        choices: { id: string; text: string }[]
        explanation?: string
    }
    correctIndex: number
    difficulty: number
}

interface Props {
    sdgId: SdgId
    onClose: () => void
    onComplete: (xpEarned: number, score: number, total: number) => void
}

const QUIZ_TIME_SECONDS = 2 * 60   // 2 minutes

export default function QuizModal({ sdgId, onClose, onComplete }: Props) {
    const meta = SDG_MAP[sdgId]
    const color = meta?.color ?? '#6366F1'

    const [questions, setQuestions] = useState<QuizQuestion[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentIdx, setCurrentIdx] = useState(0)
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [showFeedback, setShowFeedback] = useState(false)
    const [answers, setAnswers] = useState<{ questionId: string; selectedIndex: number }[]>([])
    const [timeLeft, setTimeLeft] = useState(QUIZ_TIME_SECONDS)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<{ score: number; total: number; pct: number; xpEarned: number; scoreImproved: boolean; newBadges: { id: string; label: string; icon: string }[] } | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        fetchQuestions()
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current!)
                    handleSubmit()
                    return 0
                }
                return t - 1
            })
        }, 1000)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [])

    const fetchQuestions = async () => {
        try {
            const res = await api.get(`/questions/quiz?sdgId=${sdgId}&count=15`)
            if (res.data.questions.length === 0) {
                toast('No questions available for this SDG yet — check back soon!', { duration: 4000 })
                onClose()
                return
            }
            setQuestions(res.data.questions)
        } catch {
            toast.error('Could not load quiz questions')
            onClose()
        } finally {
            setIsLoading(false)
        }
    }

    const handleSelect = (idx: number) => {
        if (showFeedback || selectedIndex !== null) return
        setSelectedIndex(idx)
        setShowFeedback(true)
        const q = questions[currentIdx]
        setAnswers(prev => [...prev, { questionId: q.questionId, selectedIndex: idx }])
    }

    const handleNext = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(i => i + 1)
            setSelectedIndex(null)
            setShowFeedback(false)
        } else {
            handleSubmit()
        }
    }

    const handleSubmit = async () => {
        if (isSubmitting || result) return
        if (timerRef.current) clearInterval(timerRef.current)
        setIsSubmitting(true)
        try {
            const res = await api.post('/quiz/submit', { sdgId, answers })
            setResult(res.data)
            if (res.data.xpEarned > 0) {
                toast.success(`+${res.data.xpEarned} XP earned! 🎉`, { duration: 4000 })
            }
            if (res.data.newBadges?.length > 0) {
                res.data.newBadges.forEach((b: any) => toast.success(`Badge unlocked: ${b.label}! 🏅`, { duration: 5000 }))
            }
        } catch {
            toast.error('Failed to submit quiz')
        } finally {
            setIsSubmitting(false)
        }
    }

    const timeMin = Math.floor(timeLeft / 60)
    const timeSec = String(timeLeft % 60).padStart(2, '0')
    const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0

    const getXpLabel = (pct: number) => {
        if (pct >= 80) return { label: 'Excellent! 🌟', color: '#4C9F38' }
        if (pct >= 60) return { label: 'Good! 👍', color: '#FCC30B' }
        if (pct >= 40) return { label: 'Decent 💪', color: '#FD6925' }
        return { label: 'Keep Learning 📚', color: '#9CA3AF' }
    }

    if (isLoading) return (
        <ModalWrapper onClose={onClose} color={color}>
            <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${color}40`, borderTopColor: color }} />
                <p className="text-brand-subtext text-sm">Loading questions...</p>
            </div>
        </ModalWrapper>
    )

    if (result) {
        const xpLabel = getXpLabel(result.pct)
        return (
            <ModalWrapper onClose={() => { onComplete(result.xpEarned, result.score, result.total); onClose() }} color={color}>
                <div className="text-center animate-scale-in py-4">
                    <div className="text-6xl mb-4">{result.pct >= 80 ? '🏆' : result.pct >= 60 ? '🎯' : result.pct >= 40 ? '💪' : '📚'}</div>
                    <h2 className="text-2xl font-display font-black text-white mb-1">Quiz Complete!</h2>
                    <p className="text-brand-subtext mb-6">{meta?.shortTitle} Knowledge Check</p>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-2xl font-black text-white">{result.score}/{result.total}</p>
                            <p className="text-xs text-brand-subtext">Score</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-2xl font-black text-white">{result.pct}%</p>
                            <p className="text-xs text-brand-subtext">Accuracy</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-2xl font-black" style={{ color: result.xpEarned > 0 ? '#FCC30B' : '#9CA3AF' }}>
                                +{result.xpEarned}
                            </p>
                            <p className="text-xs text-brand-subtext">XP Earned</p>
                        </div>
                    </div>

                    <div className="rounded-xl p-3 mb-6" style={{ background: `${xpLabel.color}20`, border: `1px solid ${xpLabel.color}40` }}>
                        <p className="font-bold text-sm" style={{ color: xpLabel.color }}>{xpLabel.label}</p>
                        {result.score < result.total && (
                            <p className="text-xs text-brand-subtext mt-1">Score above {result.pct < 40 ? '40%' : result.pct < 60 ? '60%' : '80%'} to earn more XP next time!</p>
                        )}
                        {!result.scoreImproved && <p className="text-xs text-brand-subtext mt-1">Your personal best was already higher — no XP deducted.</p>}
                    </div>

                    {result.newBadges?.length > 0 && (
                        <div className="mb-5">
                            <p className="text-xs text-brand-subtext mb-2">🏅 Badges Unlocked</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {result.newBadges.map((b: any) => (
                                    <span key={b.id} className="text-sm bg-white/10 rounded-full px-3 py-1 text-white">{b.icon} {b.label}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <Button className="w-full" onClick={() => { onComplete(result.xpEarned, result.score, result.total); onClose() }}>
                        Done
                    </Button>
                </div>
            </ModalWrapper>
        )
    }

    const q = questions[currentIdx]
    if (!q) return null
    const choices = q.content?.choices ?? []

    return (
        <ModalWrapper onClose={onClose} color={color}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: color }}>
                        {meta?.number}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-white">{meta?.shortTitle} Quiz</p>
                        <p className="text-xs text-brand-subtext">Question {currentIdx + 1} of {questions.length}</p>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-mono font-bold px-2 py-1 rounded-lg ${timeLeft < 60 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-brand-subtext'}`}>
                    <Clock size={12} />
                    {timeMin}:{timeSec}
                </div>
            </div>

            <ProgressBar value={currentIdx + 1} max={questions.length} color={color} height={4} className="mb-5" />

            {/* Question */}
            <p className="text-white font-semibold text-base mb-4 leading-relaxed">{q.content?.stem}</p>

            {/* Choices */}
            <div className="space-y-2 mb-5">
                {choices.map((choice, idx) => {
                    const isSelected = selectedIndex === idx
                    const isCorrect = idx === q.correctIndex
                    let bg = 'bg-white/5 border-brand-border hover:bg-white/10 hover:border-white/30'
                    if (showFeedback) {
                        if (isCorrect) bg = 'bg-green-500/20 border-green-500/50'
                        else if (isSelected && !isCorrect) bg = 'bg-red-500/20 border-red-500/50'
                        else bg = 'bg-white/5 border-brand-border opacity-60'
                    }
                    return (
                        <button
                            key={choice.id ?? idx}
                            onClick={() => handleSelect(idx)}
                            disabled={showFeedback}
                            className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${bg}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 ${showFeedback && isCorrect ? 'bg-green-500 text-white' : showFeedback && isSelected ? 'bg-red-500 text-white' : 'bg-white/10 text-brand-subtext'}`}>
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                <span className={`text-sm ${showFeedback && isCorrect ? 'text-green-300 font-semibold' : isSelected && !isCorrect && showFeedback ? 'text-red-300' : 'text-white'}`}>
                                    {choice.text}
                                </span>
                                {showFeedback && isCorrect && <span className="ml-auto text-green-400 text-xs font-bold">✓ Correct!</span>}
                                {showFeedback && isSelected && !isCorrect && <span className="ml-auto text-red-400 text-xs font-bold">✗ Wrong</span>}
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Feedback + next button */}
            {showFeedback && (
                <div className="animate-slide-in-right">
                    {q.content?.explanation && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-3">
                            <p className="text-xs text-blue-300 leading-relaxed">💡 {q.content.explanation}</p>
                        </div>
                    )}
                    <Button className="w-full" onClick={handleNext} rightIcon={<ChevronRight size={16} />}>
                        {currentIdx < questions.length - 1 ? 'Next Question' : 'See Results'}
                    </Button>
                </div>
            )}
        </ModalWrapper>
    )
}

function ModalWrapper({ children, onClose, color }: { children: React.ReactNode; onClose: () => void; color: string }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div
                className="relative bg-brand-surface border border-brand-border rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scale-in overflow-y-auto max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-brand-subtext hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>
                {children}
            </div>
        </div>
    )
}
