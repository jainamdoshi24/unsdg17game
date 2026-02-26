import React from 'react'
import { Users, TrendingUp, Award, Download, BarChart2 } from 'lucide-react'
import { Card } from '@/components/Card'
import { Badge, ProgressBar } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Avatar } from '@/components/Spinner'
import { SDG_META } from '@/utils/sdgConfig'

// Mock class data
const students = [
    { id: '1', name: 'Arya Sharma', email: 'arya@school.edu', totalXP: 2400, sdgsCompleted: 7, lastActive: '2h ago', avgScore: 82 },
    { id: '2', name: 'Rohan Patel', email: 'rohan@school.edu', totalXP: 1850, sdgsCompleted: 5, lastActive: '1d ago', avgScore: 76 },
    { id: '3', name: 'Priya Mehta', email: 'priya@school.edu', totalXP: 3100, sdgsCompleted: 9, lastActive: '30m ago', avgScore: 91 },
    { id: '4', name: 'Karan Singh', email: 'karan@school.edu', totalXP: 920, sdgsCompleted: 3, lastActive: '3d ago', avgScore: 61 },
    { id: '5', name: 'Sneha Doshi', email: 'sneha@school.edu', totalXP: 2750, sdgsCompleted: 8, lastActive: '5h ago', avgScore: 88 },
    { id: '6', name: 'Aditya Kumar', email: 'adi@school.edu', totalXP: 1200, sdgsCompleted: 4, lastActive: '2d ago', avgScore: 67 },
]

const totalStudents = students.length
const avgXP = Math.round(students.reduce((s, u) => s + u.totalXP, 0) / totalStudents)
const avgCompletion = Math.round(students.reduce((s, u) => s + u.sdgsCompleted, 0) / totalStudents / 17 * 100)

const sdgHeatColors = ['#1E293B', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']

export default function TeacherDashboard() {
    const handleExport = () => {
        const csv = [
            ['Name', 'Email', 'Total XP', 'SDGs Completed', 'Avg Score', 'Last Active'],
            ...students.map(s => [s.name, s.email, s.totalXP, s.sdgsCompleted, s.avgScore, s.lastActive]),
        ].map(row => row.join(',')).join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'class-progress.csv'; a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-7 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-black text-white">My Class</h1>
                    <p className="text-brand-subtext mt-1">{totalStudents} students · SDG Quest</p>
                </div>
                <Button onClick={handleExport} variant="outline" leftIcon={<Download size={16} />} size="sm">
                    Export CSV
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Students', value: totalStudents, icon: Users, color: '#6366F1' },
                    { label: 'Avg XP', value: avgXP, icon: TrendingUp, color: '#FCC30B' },
                    { label: 'Avg Completion', value: `${avgCompletion}%`, icon: BarChart2, color: '#4C9F38' },
                    { label: 'Top Score', value: Math.max(...students.map(s => s.avgScore)), icon: Award, color: '#06B6D4' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label} accentColor={color} padding="md" hover={false} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
                            <Icon size={20} style={{ color }} />
                        </div>
                        <div>
                            <p className="text-xl font-display font-black text-white">{value}</p>
                            <p className="text-xs text-brand-subtext">{label}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* SDG Completion Heatmap */}
            <Card padding="md" hover={false}>
                <h2 className="font-bold text-white mb-4">Class SDG Heatmap</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr>
                                <th className="text-left text-brand-subtext font-medium pb-2 pr-3 w-28">Student</th>
                                {SDG_META.map(s => (
                                    <th key={s.id} className="text-center pb-2 px-0.5" style={{ color: s.color }} title={s.shortTitle}>
                                        {s.number}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, si) => (
                                <tr key={student.id} className="border-t border-white/5">
                                    <td className="py-1.5 pr-3 font-medium text-brand-text truncate max-w-[7rem]">{student.name.split(' ')[0]}</td>
                                    {SDG_META.map((_, gi) => {
                                        const score = (si + gi) % 5 < student.sdgsCompleted / 3 ? Math.round(Math.random() * 40 + 55) : 0
                                        const colorIdx = score === 0 ? 0 : Math.min(5, Math.floor(score / 20))
                                        return (
                                            <td key={gi} className="px-0.5 py-1.5 text-center">
                                                <div
                                                    className="w-5 h-5 rounded mx-auto"
                                                    style={{ background: sdgHeatColors[colorIdx] }}
                                                    title={score ? `Score: ${score}` : 'Not played'}
                                                />
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex items-center gap-3 mt-3 text-xs text-brand-subtext">
                        <span>Legend:</span>
                        {['Not played', 'Low', 'Medium', 'Good', 'Great', 'Excellent'].map((label, i) => (
                            <div key={label} className="flex items-center gap-1">
                                <div className="w-3.5 h-3.5 rounded" style={{ background: sdgHeatColors[i] }} />
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Student Table */}
            <Card padding="none" hover={false}>
                <div className="px-6 py-4 border-b border-brand-border">
                    <h2 className="font-bold text-white">Student Progress</h2>
                </div>
                <div className="divide-y divide-brand-border">
                    {students.map((student) => (
                        <div key={student.id} className="flex items-center gap-4 px-6 py-3 hover:bg-white/3 transition-colors">
                            <Avatar name={student.name} size="sm" color="#6366F1" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{student.name}</p>
                                <p className="text-xs text-brand-subtext">{student.lastActive}</p>
                            </div>
                            <div className="hidden sm:block w-24">
                                <ProgressBar value={student.sdgsCompleted} max={17} color="#4C9F38" height={4} label={`${student.sdgsCompleted}/17`} />
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-white">{student.totalXP.toLocaleString()} XP</p>
                                <Badge color={student.avgScore >= 80 ? '#4C9F38' : student.avgScore >= 60 ? '#FCC30B' : '#E5243B'} size="sm">
                                    Avg {student.avgScore}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}
