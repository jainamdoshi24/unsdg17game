import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { Button } from '@/components/Button'
import toast from 'react-hot-toast'

const schema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
    const navigate = useNavigate()
    const { setAuth } = useAuthStore()
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    })

    const onSubmit = async (data: FormData) => {
        try {
            const result = await authService.login(data)
            setAuth(result.user, result.token)
            toast.success(`Welcome back, ${result.user.displayName ?? result.user.name}! 🎉`)
            navigate('/dashboard')
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
            toast.error(msg ?? (err instanceof Error ? err.message : 'Login failed'))
        }
    }

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-display font-black text-white mb-2">Welcome back</h1>
            <p className="text-brand-subtext mb-8">Sign in to continue your SDG journey.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-brand-subtext mb-1.5">Email</label>
                    <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtext" />
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="you@school.edu"
                            className="w-full pl-9 pr-4 py-3 bg-brand-muted border border-brand-border rounded-xl text-brand-text placeholder:text-brand-subtext/50 focus:outline-none focus:border-brand-primary transition-colors text-sm"
                        />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-brand-subtext mb-1.5">Password</label>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtext" />
                        <input
                            {...register('password')}
                            type="password"
                            placeholder="••••••••"
                            className="w-full pl-9 pr-4 py-3 bg-brand-muted border border-brand-border rounded-xl text-brand-text placeholder:text-brand-subtext/50 focus:outline-none focus:border-brand-primary transition-colors text-sm"
                        />
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
                </div>

                <Button type="submit" isLoading={isSubmitting} className="w-full" size="lg" rightIcon={<ArrowRight size={18} />}>
                    Sign In
                </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-5 p-3 rounded-xl bg-brand-primary/10 border border-brand-primary/20">
                <p className="text-xs text-brand-subtext text-center">
                    <span className="text-brand-primary font-semibold">Demo:</span> demo@sdgquest.org / Demo@1234
                </p>
            </div>

            <p className="mt-6 text-center text-sm text-brand-subtext">
                New to SDG Quest?{' '}
                <Link to="/signup" className="text-brand-primary hover:text-indigo-400 font-semibold transition-colors">
                    Create account
                </Link>
            </p>
        </div>
    )
}
