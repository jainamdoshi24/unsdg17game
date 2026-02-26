import type { Config } from 'tailwindcss'

const config: Config = {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                sdg: {
                    1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D',
                    5: '#FF3A21', 6: '#26BDE2', 7: '#FCC30B', 8: '#A21942',
                    9: '#FD6925', 10: '#DD1367', 11: '#FD9D24', 12: '#BF8B2E',
                    13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B', 16: '#00689D',
                    17: '#19486A',
                },
                brand: {
                    primary: '#6366F1',
                    secondary: '#8B5CF6',
                    accent: '#06B6D4',
                    surface: '#0F172A',
                    muted: '#1E293B',
                    border: '#334155',
                    text: '#F1F5F9',
                    subtext: '#94A3B8',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['DM Sans', 'Inter', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-brand': 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)',
                'gradient-dark': 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
                'gradient-glow': 'radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'fade-in': 'fadeIn 0.4s ease-out',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
                glow: { from: { boxShadow: '0 0 10px rgba(99,102,241,0)' }, to: { boxShadow: '0 0 30px rgba(99,102,241,0.5)' } },
                slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
                slideInRight: { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
                scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
                fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
                shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
            },
            boxShadow: {
                'glow-sm': '0 0 15px rgba(99,102,241,0.3)',
                'glow-md': '0 0 30px rgba(99,102,241,0.4)',
                'glow-lg': '0 0 60px rgba(99,102,241,0.5)',
                'card': '0 4px 24px rgba(0,0,0,0.4)',
                'card-hover': '0 8px 40px rgba(0,0,0,0.6)',
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
            },
        },
    },
    plugins: [],
}

export default config
