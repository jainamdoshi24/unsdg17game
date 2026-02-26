import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, User, BookOpen, Settings, LogOut, Menu, X, GraduationCap, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/Spinner'
import { clsx } from 'clsx'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['student', 'teacher', 'admin'] },
    { to: '/profile', icon: User, label: 'My Progress', roles: ['student', 'teacher', 'admin'] },
    { to: '/teacher', icon: GraduationCap, label: 'My Class', roles: ['teacher', 'admin'] },
    { to: '/admin', icon: Shield, label: 'Admin', roles: ['admin'] },
]

export default function DashboardLayout() {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()
    const [mobileOpen, setMobileOpen] = useState(false)

    const handleLogout = () => { logout(); navigate('/login') }
    const filteredNav = navItems.filter(n => n.roles.includes(user?.role ?? 'student'))

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-5 border-b border-brand-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center text-white font-black text-sm flex-shrink-0">FL</div>
                <div>
                    <p className="font-display font-bold text-white text-sm leading-tight">FUN&amp;LEARN</p>
                    <p className="text-brand-subtext text-xs">SDG Quest Platform</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {filteredNav.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) => clsx(
                            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                            isActive
                                ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30'
                                : 'text-brand-subtext hover:text-brand-text hover:bg-white/5'
                        )}
                    >
                        <Icon size={18} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* User */}
            <div className="p-3 border-t border-brand-border">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                    <Avatar name={user?.name ?? ''} size="sm" color="#6366F1" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-text truncate">{user?.name}</p>
                        <p className="text-xs text-brand-subtext capitalize">{user?.role}</p>
                    </div>
                    <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-white/10 text-brand-subtext hover:text-red-400 transition-colors" title="Logout">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex h-screen bg-brand-surface overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-60 flex-col flex-shrink-0 bg-brand-muted border-r border-brand-border">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)} style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <aside className="w-64 h-full bg-brand-muted border-r border-brand-border" onClick={e => e.stopPropagation()}>
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile header */}
                <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-brand-border bg-brand-muted">
                    <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-white/10 text-brand-subtext">
                        <Menu size={20} />
                    </button>
                    <span className="font-display font-bold text-white text-sm">FUN&amp;LEARN</span>
                </div>

                <main className="flex-1 overflow-y-auto bg-mesh">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
