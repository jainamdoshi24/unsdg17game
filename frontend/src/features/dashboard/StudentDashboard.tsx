import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Star, Play, ChevronRight, Zap, Trophy, BookOpen } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Card } from '@/components/Card'
import { Badge, ProgressBar } from '@/components/Badge'
import { Button } from '@/components/Button'
import { SDG_META } from '@/utils/sdgConfig'
import QuizSection from '@/features/quiz/QuizSection'
import type { SdgId } from '@/types'
import api from '@/services/api'

const BADGE_DEFINITIONS: { id: string; icon: string; label: string; description: string }[] = [
    { id: 'first_win', icon: '🏆', label: 'First Victory', description: 'Complete your first SDG simulation' },
    { id: 'sdg_explorer', icon: '🧭', label: 'SDG Explorer', description: 'Complete 3 different SDG simulations' },
    { id: 'all_rounder', icon: '🌍', label: 'All-Rounder', description: 'Complete 10 different SDG simulations' },
    { id: 'climate_warrior', icon: '🌿', label: 'Climate Warrior', description: 'Complete the SDG 13 Climate Action simulation' },
    { id: 'ocean_guardian', icon: '🐠', label: 'Ocean Guardian', description: 'Complete the SDG 14 Life Below Water simulation' },
    { id: 'knowledge_master', icon: '🧠', label: 'Knowledge Master', description: 'Score 90% or higher on any SDG quiz' },
    { id: 'quiz_champion', icon: '📚', label: 'Quiz Champion', description: 'Score 100% on any SDG quiz' },
    { id: 'high_scorer', icon: '🎯', label: 'High Scorer', description: 'Achieve a simulation score of 80 or higher' },
    { id: 'poverty_fighter', icon: '❤️', label: 'Poverty Fighter', description: 'Complete the SDG 1 No Poverty simulation' },
    { id: 'energy_engineer', icon: '⚡', label: 'Energy Engineer', description: 'Complete the SDG 7 Clean Energy simulation' },
]

interface ProgressData {
    displayName: string
    totalXP: number
    skillRating: number
    badges: string[]
    sdgProgress: Record<string, { completions: number; bestScore: number; totalXP: number; lastPlayedAt: string | null }>
}

export default function StudentDashboard() {
    const { user } = useAuthStore()
    const navigate = useNavigate()
    const [progress, setProgress] = useState<ProgressData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        api.get('/progress/me')
            .then(res => setProgress(res.data))
            .catch(() => { /* show zeros */ })
            .finally(() => setIsLoading(false))
    }, [])

    const totalXP = progress?.totalXP ?? 0
    const level = Math.floor(totalXP / 500) + 1
    const levelXP = totalXP % 500

    const completed = progress
        ? Object.values(progress.sdgProgress).filter(p => p.completions > 0).length
        : 0

    const inProgress = progress
        ? SDG_META.filter(s => (progress.sdgProgress[s.id]?.completions ?? 0) === 0).length
        : 0

    const userName = progress?.displayName ?? user?.name ?? 'Explorer'

    if (isLoading) return (
        <div className="space-y-8 animate-pulse">
            <div className="h-12 bg-white/5 rounded-xl w-64" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl" />)}
            </div>
            <div className="h-32 bg-white/5 rounded-xl" />
        </div>
    )

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-black text-white">
                        Hey, {userName.split(' ')[0]} 👋
                    </h1>
                    <p className="text-brand-subtext mt-1">
                        {completed > 0
                            ? <>You've conquered <span className="text-brand-primary font-semibold">{completed}</span> SDG{completed !== 1 ? 's' : ''} — keep going!</>
                            : <>Pick your first SDG challenge below and start your journey!</>
                        }
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
                        <Flame size={16} className="text-orange-400" />
                        <span className="text-sm font-bold text-white">Lv. {level}</span>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total XP', value: totalXP.toLocaleString(), icon: Zap, color: '#6366F1' },
                    { label: 'Level', value: `Lv. ${level}`, icon: Star, color: '#FCC30B' },
                    { label: 'SDGs Cleared', value: `${completed}/17`, icon: Trophy, color: '#4C9F38' },
                    { label: 'To Explore', value: `${17 - completed}`, icon: Play, color: '#06B6D4' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label} accentColor={color} padding="md" className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}22` }}>
                            <Icon size={20} style={{ color }} />
                        </div>
                        <div>
                            <p className="text-xl font-display font-black text-white">{value}</p>
                            <p className="text-xs text-brand-subtext">{label}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* XP Progress */}
            <Card padding="md">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="font-semibold text-white">Level {level}</p>
                        <p className="text-xs text-brand-subtext">{levelXP} / 500 XP to Level {level + 1}</p>
                    </div>
                    <Badge color="#6366F1" variant="soft">🔥 {totalXP} XP total</Badge>
                </div>
                <ProgressBar value={levelXP} max={500} color="#6366F1" height={10} showPercent />
            </Card>

            {/* Badges */}
            {(progress?.badges?.length ?? 0) > 0 && (
                <div>
                    <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                        <Trophy size={18} className="text-yellow-400" /> Your Badges
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {(progress?.badges ?? []).map(badgeId => {
                            const def = BADGE_DEFINITIONS.find(b => b.id === badgeId)
                            if (!def) return null
                            return (
                                <div key={badgeId} className="flex items-center gap-2 bg-white/5 border border-brand-border rounded-xl px-3 py-2" title={def.description}>
                                    <span className="text-lg">{def.icon}</span>
                                    <div>
                                        <p className="text-xs font-bold text-white">{def.label.replace(/^[^\w]+/, '')}</p>
                                        <p className="text-[10px] text-brand-subtext">{def.description}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* SDG World Map */}
            <div>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-display font-bold text-white">SDG World Map</h2>
                    <span className="text-sm text-brand-subtext">{completed}/17 completed</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-3">
                    {SDG_META.map((sdg) => {
                        const p = progress?.sdgProgress[sdg.id]
                        const isCompleted = (p?.completions ?? 0) > 0
                        const bestScore = p?.bestScore ?? 0

                        return (
                            <div
                                key={sdg.id}
                                onClick={() => navigate(`/play/${sdg.id}`)}
                                className="relative flex flex-col items-center gap-1.5 cursor-pointer"
                                title={sdg.title}
                            >
                                <div
                                    className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-display font-black text-white transition-all duration-200 hover:scale-110 hover:shadow-lg"
                                    style={{
                                        background: `linear-gradient(135deg, ${sdg.color}, ${sdg.color}bb)`,
                                        boxShadow: isCompleted ? `0 0 16px ${sdg.color}66` : undefined,
                                    }}
                                >
                                    <span className="text-xs opacity-75">SDG</span>
                                    <span className="text-base leading-none">{sdg.number}</span>
                                </div>
                                {isCompleted && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                        <span className="text-white text-xs font-bold">✓</span>
                                    </div>
                                )}
                                <span className="text-[10px] text-brand-subtext text-center leading-tight">
                                    {sdg.shortTitle}
                                </span>
                                {bestScore > 0 && (
                                    <span className="text-[9px] font-bold" style={{ color: sdg.color }}>{bestScore}</span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Quick Play */}
            <div>
                <h2 className="text-xl font-display font-bold text-white mb-4">
                    {completed === 0 ? '🚀 Start Here' : '⚡ Continue Playing'}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {SDG_META
                        .filter(s => !(progress?.sdgProgress[s.id]?.completions))
                        .slice(0, 3)
                        .map(sdg => (
                            <Card
                                key={sdg.id}
                                accentColor={sdg.color}
                                padding="md"
                                className="group"
                                onClick={() => navigate(`/play/${sdg.id}`)}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div
                                        className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white font-black font-display flex-shrink-0"
                                        style={{ background: `linear-gradient(135deg, ${sdg.color}, ${sdg.color}99)` }}
                                    >
                                        <span className="text-xs opacity-75">SDG</span>
                                        <span>{sdg.number}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white text-sm leading-tight">{sdg.shortTitle}</p>
                                        <p className="text-xs text-brand-subtext mt-0.5">{sdg.theme}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-brand-subtext group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                                </div>
                                <Button size="sm" variant="outline" className="w-full" leftIcon={<Play size={14} />}>
                                    Play Now
                                </Button>
                            </Card>
                        ))}
                </div>
            </div>

            {/* Quiz Section — only shows after user has played SDGs */}
            <QuizSection />
        </div>
    )
}
