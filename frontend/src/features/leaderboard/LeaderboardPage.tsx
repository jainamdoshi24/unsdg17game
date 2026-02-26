import React from 'react'
import { Trophy, Medal, Star } from 'lucide-react'
import { Card } from '@/components/Card'
import { Avatar } from '@/components/Spinner'
import { Badge } from '@/components/Badge'

const leaderboard = [
    { rank: 1, name: 'Priya Mehta', totalXP: 8400, sdgsCompleted: 14, avatar: '' },
    { rank: 2, name: 'Sneha Doshi', totalXP: 7200, sdgsCompleted: 12, avatar: '' },
    { rank: 3, name: 'Arya Sharma', totalXP: 6100, sdgsCompleted: 10, avatar: '' },
    { rank: 4, name: 'Rohan Patel', totalXP: 5800, sdgsCompleted: 9, avatar: '' },
    { rank: 5, name: 'Karan Singh', totalXP: 4900, sdgsCompleted: 8, avatar: '' },
    { rank: 6, name: 'Aditya Kumar', totalXP: 4100, sdgsCompleted: 7, avatar: '' },
    { rank: 7, name: 'Manvi Joshi', totalXP: 3700, sdgsCompleted: 6, avatar: '' },
    { rank: 8, name: 'Tanmay Shah', totalXP: 3200, sdgsCompleted: 5, avatar: '' },
    { rank: 9, name: 'Ishaan Verma', totalXP: 2800, sdgsCompleted: 5, avatar: '' },
    { rank: 10, name: 'Riya Nair', totalXP: 2400, sdgsCompleted: 4, avatar: '' },
]

const podiumColors: Record<number, { icon: typeof Trophy; color: string; size: string }> = {
    1: { icon: Trophy, color: '#FCC30B', size: 'w-20 h-20' },
    2: { icon: Medal, color: '#94A3B8', size: 'w-16 h-16' },
    3: { icon: Medal, color: '#FD6925', size: 'w-14 h-14' },
}

export default function LeaderboardPage() {
    const top3 = leaderboard.slice(0, 3)
    const rest = leaderboard.slice(3)

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-display font-black text-white">Leaderboard</h1>
                <p className="text-brand-subtext mt-1">Top SDG Quest champions this season</p>
            </div>

            {/* Podium */}
            <Card padding="lg" hover={false} className="overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-brand opacity-5" />
                <div className="relative flex items-end justify-center gap-4 sm:gap-10 pb-4">
                    {[top3[1], top3[0], top3[2]].map((entry, pi) => {
                        if (!entry) return null
                        const realRank = pi === 0 ? 2 : pi === 1 ? 1 : 3
                        const { color, size } = podiumColors[realRank]
                        const heights = ['h-24', 'h-32', 'h-20']
                        return (
                            <div key={entry.rank} className="flex flex-col items-center gap-2">
                                <Avatar name={entry.name} size={realRank === 1 ? 'lg' : 'md'} color={color} />
                                <p className="text-sm font-bold text-white text-center">{entry.name.split(' ')[0]}</p>
                                <p className="text-xs text-brand-subtext">{entry.totalXP.toLocaleString()} XP</p>
                                <div
                                    className={`${heights[pi]} w-16 sm:w-24 flex items-center justify-center rounded-t-xl font-black text-white font-display text-2xl`}
                                    style={{ background: `linear-gradient(180deg, ${color}44, ${color}22)`, border: `1px solid ${color}44` }}
                                >
                                    #{realRank}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>

            {/* Rest of leaderboard */}
            <Card padding="none" hover={false}>
                <div className="divide-y divide-brand-border">
                    {rest.map((entry) => (
                        <div key={entry.rank} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors">
                            <span className="w-6 text-center text-sm font-bold text-brand-subtext">#{entry.rank}</span>
                            <Avatar name={entry.name} size="sm" color="#6366F1" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white">{entry.name}</p>
                                <p className="text-xs text-brand-subtext">{entry.sdgsCompleted} SDGs completed</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-white">{entry.totalXP.toLocaleString()}</p>
                                <p className="text-xs text-brand-subtext">XP</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}
