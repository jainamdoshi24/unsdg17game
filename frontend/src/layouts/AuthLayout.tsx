import React from 'react'
import { Outlet, Link } from 'react-router-dom'

export default function AuthLayout() {
    return (
        <div className="min-h-screen flex bg-brand-surface bg-mesh">
            {/* Left visual panel */}
            <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-brand opacity-5" />
                <div className="relative z-10 text-center max-w-md">
                    {/* SDG Grid preview */}
                    <div className="grid grid-cols-6 gap-1.5 mb-10 mx-auto w-fit">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, '🌍'].map((n, i) => (
                            <div
                                key={i}
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                style={{ background: `hsl(${(i * 21) % 360}, 70%, 45%)`, opacity: 0.85 + (i % 3) * 0.05 }}
                            >
                                {typeof n === 'number' ? n : n}
                            </div>
                        ))}
                    </div>
                    <h1 className="text-5xl font-display font-black text-gradient mb-4">SDG Quest</h1>
                    <p className="text-brand-subtext text-lg leading-relaxed">
                        17 immersive simulations. Real consequences.<br />
                        Learn the global goals by playing them.
                    </p>
                    <div className="mt-8 flex gap-4 justify-center">
                        {['🏥 Pandemic Sim', '🌍 Climate Action', '⚡ Energy Grid', '🐠 Ocean Rescue'].map(tag => (
                            <span key={tag} className="px-3 py-1.5 glass rounded-full text-xs text-brand-subtext">{tag}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right auth panel */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    <Link to="/" className="flex items-center gap-2 mb-10 group">
                        <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center text-white font-black text-sm">SQ</div>
                        <span className="font-display font-bold text-white text-xl group-hover:text-brand-primary transition-colors">SDG Quest</span>
                    </Link>
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
