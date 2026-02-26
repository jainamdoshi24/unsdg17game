import React from 'react'
import { clsx } from 'clsx'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant
    size?: Size
    isLoading?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
    primary: 'bg-brand-primary hover:bg-indigo-500 text-white shadow-glow-sm hover:shadow-glow-md',
    secondary: 'bg-brand-muted hover:bg-slate-600 text-brand-text border border-brand-border',
    danger: 'bg-red-600/90 hover:bg-red-500 text-white',
    ghost: 'bg-transparent hover:bg-white/5 text-brand-subtext hover:text-brand-text',
    outline: 'bg-transparent border border-brand-border hover:border-brand-primary text-brand-text hover:text-brand-primary',
}

const sizeClasses: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-7 py-3.5 text-base rounded-xl gap-2.5',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, className, disabled, ...props }, ref) => (
        <button
            ref={ref}
            disabled={disabled || isLoading}
            className={clsx(
                'inline-flex items-center justify-center font-semibold transition-all duration-200',
                'active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
                'disabled:opacity-50 disabled:pointer-events-none',
                variantClasses[variant],
                sizeClasses[size],
                className
            )}
            {...props}
        >
            {isLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z" />
                </svg>
            ) : leftIcon}
            {children}
            {!isLoading && rightIcon}
        </button>
    )
)
Button.displayName = 'Button'
