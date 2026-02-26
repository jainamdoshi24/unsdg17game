import React, { useState } from 'react'
import { Shield, Users, BookOpen, Database, Trash2, Edit2, Plus, Search } from 'lucide-react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Modal } from '@/components/Modal'
import toast from 'react-hot-toast'

const tabs = [
    { id: 'questions', label: 'Questions', icon: BookOpen },
    { id: 'missions', label: 'Missions', icon: Database },
    { id: 'users', label: 'Users', icon: Users },
]

const mockQuestions = [
    { id: '1', sdgId: 'SDG_04', difficulty: 'hard', text: 'What % of children worldwide lack access to quality education?', status: 'active' },
    { id: '2', sdgId: 'SDG_13', difficulty: 'medium', text: 'What is the Paris Agreement\'s temperature target?', status: 'active' },
    { id: '3', sdgId: 'SDG_08', difficulty: 'easy', text: 'What does GDP stand for?', status: 'draft' },
    { id: '4', sdgId: 'SDG_16', difficulty: 'hard', text: 'What is the Corruption Perceptions Index (CPI)?', status: 'active' },
]

const mockUsers = [
    { id: '1', name: 'Demo Student', email: 'demo@sdgquest.org', role: 'student', status: 'active' },
    { id: '2', name: 'Demo Teacher', email: 'teacher@sdg.org', role: 'teacher', status: 'active' },
    { id: '3', name: 'Admin User', email: 'admin@sdg.org', role: 'admin', status: 'active' },
]

const difficultyColors: Record<string, string> = {
    easy: '#4C9F38', medium: '#FCC30B', hard: '#E5243B',
}
const roleColors: Record<string, string> = {
    student: '#6366F1', teacher: '#06B6D4', admin: '#FCC30B',
}

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState('questions')
    const [search, setSearch] = useState('')
    const [editModal, setEditModal] = useState(false)

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <Shield size={20} className="text-yellow-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-display font-black text-white">Admin Panel</h1>
                    <p className="text-brand-subtext text-sm">Platform management & controls</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Users', value: '3', color: '#6366F1' },
                    { label: 'Active Questions', value: '24', color: '#4C9F38' },
                    { label: 'SDGs Live', value: '17', color: '#FCC30B' },
                ].map(({ label, value, color }) => (
                    <Card key={label} accentColor={color} padding="md" hover={false} className="text-center">
                        <p className="text-2xl font-display font-black text-white">{value}</p>
                        <p className="text-xs text-brand-subtext mt-0.5">{label}</p>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-brand-muted rounded-xl border border-brand-border w-fit">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === id ? 'bg-brand-primary text-white' : 'text-brand-subtext hover:text-brand-text'
                            }`}
                    >
                        <Icon size={15} />{label}
                    </button>
                ))}
            </div>

            {/* Search + Add */}
            <div className="flex gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtext" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={`Search ${activeTab}...`}
                        className="w-full pl-9 pr-4 py-2.5 bg-brand-muted border border-brand-border rounded-xl text-brand-text placeholder:text-brand-subtext/50 focus:outline-none focus:border-brand-primary text-sm transition-colors"
                    />
                </div>
                <Button size="sm" leftIcon={<Plus size={15} />} onClick={() => setEditModal(true)}>
                    Add New
                </Button>
            </div>

            {/* Content */}
            {activeTab === 'questions' && (
                <Card padding="none" hover={false}>
                    <div className="divide-y divide-brand-border">
                        {mockQuestions
                            .filter(q => q.text.toLowerCase().includes(search.toLowerCase()))
                            .map(q => (
                                <div key={q.id} className="flex items-start gap-4 px-5 py-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white leading-relaxed line-clamp-2">{q.text}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge color="#6366F1" size="sm">{q.sdgId.replace('_', ' ')}</Badge>
                                            <Badge color={difficultyColors[q.difficulty]} size="sm">{q.difficulty}</Badge>
                                            <Badge color={q.status === 'active' ? '#4C9F38' : '#94A3B8'} size="sm">{q.status}</Badge>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 flex-shrink-0">
                                        <button className="p-2 rounded-lg hover:bg-white/10 text-brand-subtext hover:text-brand-primary transition-colors">
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            className="p-2 rounded-lg hover:bg-red-500/20 text-brand-subtext hover:text-red-400 transition-colors"
                                            onClick={() => toast.error('Delete requires confirmation')}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </Card>
            )}

            {activeTab === 'users' && (
                <Card padding="none" hover={false}>
                    <div className="divide-y divide-brand-border">
                        {mockUsers
                            .filter(u => u.name.toLowerCase().includes(search.toLowerCase()))
                            .map(u => (
                                <div key={u.id} className="flex items-center gap-4 px-5 py-3.5">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white">{u.name}</p>
                                        <p className="text-xs text-brand-subtext">{u.email}</p>
                                    </div>
                                    <Badge color={roleColors[u.role]} size="sm">{u.role}</Badge>
                                    <Badge color="#4C9F38" size="sm">{u.status}</Badge>
                                    <div className="flex gap-1.5">
                                        <button className="p-2 rounded-lg hover:bg-white/10 text-brand-subtext hover:text-brand-primary transition-colors">
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </Card>
            )}

            {activeTab === 'missions' && (
                <Card padding="md" hover={false} className="text-center py-12">
                    <Database size={40} className="text-brand-subtext mx-auto mb-3" />
                    <p className="text-brand-subtext text-sm">Mission template management UI</p>
                    <p className="text-xs text-brand-subtext/60 mt-1">All 17 SDG simulations are active and running.</p>
                </Card>
            )}

            {/* Add Modal */}
            <Modal isOpen={editModal} onClose={() => setEditModal(false)} title={`Add ${activeTab.slice(0, -1)}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-brand-subtext mb-1.5">Content</label>
                        <textarea
                            className="w-full p-3 bg-brand-muted border border-brand-border rounded-xl text-brand-text text-sm focus:outline-none focus:border-brand-primary h-24 resize-none"
                            placeholder="Enter new content..."
                        />
                    </div>
                    <Button className="w-full" onClick={() => { setEditModal(false); toast.success('Item added!') }}>Save</Button>
                </div>
            </Modal>
        </div>
    )
}
