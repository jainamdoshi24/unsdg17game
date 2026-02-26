import React from 'react'
import { clsx } from 'clsx'

interface BadgeProps {
    children: React.ReactNode
    color?: string
    variant?: 'solid' | 'outline' | 'soft'
    size?: 'sm' | 'md'
    className?: string
}

export const Badge: React.FC<BadgeProps> = ({
    children, color = '#6366F1', variant = 'soft', size = 'sm', className,
}) => {
    const alpha = variant === 'solid' ? '1' : '0.15'
    const border = variant === 'outline' ? `1px solid ${color}` : 'none'

    return (
        <span
            className={clsx(
                'inline-flex items-center font-semibold rounded-full',
                size === 'sm' ? 'px-2.5 py-0.5 text-xs gap-1' : 'px-3 py-1 text-sm gap-1.5',
                className
            )}
            style={{
                background: variant === 'solid' ? color : `${color}26`,
                color,
                border,
            }}
        >
            {children}
        </span>
    )
}

interface ProgressBarProps {
    value: number
    max?: number
    color?: string
    height?: number
    label?: string
    showPercent?: boolean
    className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    value, max = 100, color = '#6366F1', height = 8, label, showPercent, className,
}) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100))
    return (
        <div className={className}>
            {(label || showPercent) && (
                <div className="flex justify-between items-center mb-1.5 text-xs text-brand-subtext">
                    {label && <span>{label}</span>}
                    {showPercent && <span>{Math.round(pct)}%</span>}
                </div>
            )}
            <div className="rounded-full overflow-hidden bg-white/10" style={{ height }}>
                <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, background: color }}
                />
            </div>
        </div>
    )
}
