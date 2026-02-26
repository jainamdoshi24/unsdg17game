import React from 'react'
import { clsx } from 'clsx'

interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; className?: string }

const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => (
    <svg
        className={clsx('animate-spin text-brand-primary', sizes[size], className)}
        viewBox="0 0 24 24" fill="none"
    >
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v3l4-4-4-4v3A10 10 0 002 12z" />
    </svg>
)

export const LoadingScreen: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-brand-subtext animate-pulse">{text}</p>
    </div>
)

interface AvatarProps {
    name: string
    avatar?: string
    size?: 'sm' | 'md' | 'lg'
    color?: string
}

const avatarSizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' }

export const Avatar: React.FC<AvatarProps> = ({ name, avatar, size = 'md', color = '#6366F1' }) => {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    if (avatar) {
        return <img src={avatar} alt={name} className={clsx('rounded-full object-cover ring-2 ring-brand-border', avatarSizes[size])} />
    }
    return (
        <div
            className={clsx('rounded-full flex items-center justify-center font-bold text-white flex-shrink-0', avatarSizes[size])}
            style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
        >
            {initials}
        </div>
    )
}
