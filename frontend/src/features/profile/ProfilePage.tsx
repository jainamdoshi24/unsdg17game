import React from 'react'
import { Edit2, Mail, GraduationCap, Star, Trophy } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Card } from '@/components/Card'
import { Badge, ProgressBar } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Avatar } from '@/components/Spinner'
import { SDG_META } from '@/utils/sdgConfig'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

interface ProgressData {
    displayName: string
    totalXP: number
    skillRating: number
    badges: string[]
    sdgProgress: Record<string, { completions: number; bestScore: number; totalXP: number; lastPlayedAt: string | null }>
}

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

export default function ProfilePage() {
    const { user } = useAuthStore()

    const { data: progress } = useQuery<ProgressData>({
        queryKey: ['progress', 'me'],
        queryFn: async () => {
            const res = await api.get('/progress/me')
            return res.data
        },
        refetchInterval: 3000
    })

    const totalXP = progress?.totalXP ?? 0
    const level = Math.floor(totalXP / 500) + 1
    const levelXP = totalXP % 500

    const completed = progress
        ? Object.values(progress.sdgProgress).filter(p => p.completions > 0).length
        : 0

    return (
        <div className="space-y-6 animate-fade-in max-w-3xl">
            {/* Profile Header */}
            <Card padding="lg" hover={false} className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-brand opacity-5" />
                <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <div className="relative">
                        <Avatar name={user?.name ?? ''} size="lg" color="#6366F1" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center text-white text-xs font-bold">{level}</div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <h1 className="text-2xl font-display font-black text-white">{user?.name}</h1>
                        <p className="text-brand-subtext text-sm">{user?.email}</p>
                        <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                            <Badge color="#6366F1">{user?.role}</Badge>
                            {user?.grade && <Badge color="#06B6D4">Grade {user.grade}</Badge>}
                            <Badge color="#FCC30B"><Star size={12} /> Level {level}</Badge>
                        </div>
                    </div>
                    <Button size="sm" variant="outline" leftIcon={<Edit2 size={14} />}>Edit Profile</Button>
                </div>

                <div className="relative mt-5">
                    <div className="flex justify-between text-xs text-brand-subtext mb-2">
                        <span>Level {level} — {levelXP} / 500 XP to Level {level + 1}</span>
                        <span>{totalXP.toLocaleString()} total XP</span>
                    </div>
                    <ProgressBar value={levelXP} max={500} color="#6366F1" height={8} />
                </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'XP Earned', value: totalXP.toLocaleString(), color: '#6366F1', icon: Star },
                    { label: 'SDGs Cleared', value: `${completed}/17`, color: '#4C9F38', icon: Trophy },
                    { label: 'Day Streak', value: '1 🔥', color: '#FD6925', icon: Star },
                ].map(({ label, value, color, icon: Icon }) => (
                    <Card key={label} accentColor={color} padding="md" hover={false} className="text-center">
                        <p className="text-xl font-display font-black text-white">{value}</p>
                        <p className="text-xs text-brand-subtext mt-0.5">{label}</p>
                    </Card>
                ))}
            </div>

            {/* Badges */}
            <Card padding="md" hover={false}>
                <h2 className="font-bold text-white mb-4"> Badges</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(progress?.badges ?? []).map(badgeId => {
                        const def = BADGE_DEFINITIONS.find(b => b.id === badgeId)
                        if (!def) return null
                        return (
                            <div key={badgeId} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                <div className="text-3xl">{def.icon}</div>
                                <p className="text-xs font-semibold text-white text-center leading-tight">{def.label}</p>
                                <Badge color="#6366F1" size="sm">Unlocked</Badge>
                            </div>
                        )
                    })}
                    {(!progress?.badges?.length) && (
                        <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 border-2 border-dashed border-brand-border opacity-40">
                            <div className="text-3xl">🔒</div>
                            <p className="text-xs text-brand-subtext text-center">Play games to unlock badges!</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Account Info */}
            <Card padding="md" hover={false}>
                <h2 className="font-bold text-white mb-4">Account Details</h2>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                        <Mail size={16} className="text-brand-subtext flex-shrink-0" />
                        <span className="text-brand-subtext">Email:</span>
                        <span className="text-brand-text font-medium">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <GraduationCap size={16} className="text-brand-subtext flex-shrink-0" />
                        <span className="text-brand-subtext">Role:</span>
                        <span className="text-brand-text font-medium capitalize">{user?.role}</span>
                    </div>
                </div>
            </Card>
        </div>
    )
}
