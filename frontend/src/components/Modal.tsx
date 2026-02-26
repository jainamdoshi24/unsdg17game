import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
}

const sizeMap = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
}

export const Modal: React.FC<ModalProps> = ({
    isOpen, onClose, title, children, size = 'md', className,
}) => {
    const overlayRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [onClose])

    if (!isOpen) return null

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
        >
            <div
                className={clsx(
                    'relative w-full glass rounded-2xl border border-brand-border shadow-2xl',
                    'animate-scale-in',
                    sizeMap[size],
                    className
                )}
            >
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
                        <h2 className="text-lg font-bold text-brand-text">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-brand-subtext hover:text-brand-text transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
                <div className="p-6">{children}</div>
            </div>
        </div>
    )
}
