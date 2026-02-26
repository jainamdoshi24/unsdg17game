import React from 'react'
import { clsx } from 'clsx'
import type { SdgId } from '@/types'
import { SDG_MAP } from '@/utils/sdgConfig'

interface SDGIconProps {
    sdgId: SdgId
    size?: 'sm' | 'md' | 'lg' | 'xl'
    showLabel?: boolean
    className?: string
    onClick?: () => void
}

const sizeMap = {
    sm: { outer: 'w-10 h-10', num: 'text-base', label: 'text-xs' },
    md: { outer: 'w-14 h-14', num: 'text-xl', label: 'text-xs' },
    lg: { outer: 'w-20 h-20', num: 'text-3xl', label: 'text-sm' },
    xl: { outer: 'w-28 h-28', num: 'text-4xl', label: 'text-base' },
}

export const SDGIcon: React.FC<SDGIconProps> = ({
    sdgId, size = 'md', showLabel, className, onClick,
}) => {
    const meta = SDG_MAP[sdgId]
    if (!meta) return null
    const s = sizeMap[size]
    return (
        <div
            className={clsx(
                'flex flex-col items-center gap-1.5',
                onClick && 'cursor-pointer',
                className,
            )}
            onClick={onClick}
        >
            <div
                className={clsx(
                    'rounded-2xl flex flex-col items-center justify-center font-display font-black text-white',
                    'transition-transform duration-200 hover:scale-105 select-none',
                    s.outer,
                )}
                style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)` }}
            >
                <span className="leading-none text-xs font-bold opacity-80">SDG</span>
                <span className={clsx('leading-none', s.num)}>{meta.number}</span>
            </div>
            {showLabel && (
                <span className={clsx('text-center text-brand-subtext font-medium leading-tight max-w-16', s.label)}>
                    {meta.shortTitle}
                </span>
            )}
        </div>
    )
}
