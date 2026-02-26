import React from 'react'
import { clsx } from 'clsx'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    accentColor?: string
    hover?: boolean
    glass?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card: React.FC<CardProps> = ({
    accentColor,
    hover = true,
    glass = false,
    padding = 'md',
    children,
    className,
    style,
    ...props
}) => {
    const padMap = { none: '', sm: 'p-4', md: 'p-5 md:p-6', lg: 'p-7 md:p-8' }

    return (
        <div
            className={clsx(
                'rounded-2xl border border-brand-border relative overflow-hidden',
                glass ? 'glass' : 'bg-brand-muted',
                hover && 'card-hover cursor-pointer',
                padMap[padding],
                className
            )}
            style={{ borderTop: accentColor ? `2px solid ${accentColor}` : undefined, ...style }}
            {...props}
        >
            {accentColor && (
                <div
                    className="absolute inset-x-0 top-0 h-px opacity-50"
                    style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
                />
            )}
            {children}
        </div>
    )
}
