import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { Button } from '@/components/Button'
import toast from 'react-hot-toast'

const schema = z.object({
    displayName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['student', 'teacher']),
    grade: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function SignupPage() {
    const navigate = useNavigate()
    const { setAuth } = useAuthStore()
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { role: 'student' },
    })
    const role = watch('role')

    const onSubmit = async (data: FormData) => {
        try {
            const payload = {
                displayName: data.displayName,
                email: data.email,
                password: data.password,
                role: data.role,
                // Only send grade if a value was selected
                ...(data.grade ? { grade: Number(data.grade) } : {}),
            }
            const result = await authService.signup(payload)
            setAuth(result.user, result.token)
            toast.success(`Account created! Welcome, ${result.user.displayName ?? result.user.name} 🚀`)
            navigate('/dashboard')
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Signup failed'
            // Axios wraps server error in err.response.data.error
            const axiosMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
            toast.error(axiosMsg ?? msg)
        }
    }

    const inputClass = "w-full px-4 py-3 bg-brand-muted border border-brand-border rounded-xl text-brand-text placeholder:text-brand-subtext/50 focus:outline-none focus:border-brand-primary transition-colors text-sm"

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-display font-black text-white mb-2">Join SDG Quest</h1>
            <p className="text-brand-subtext mb-8">Create your account to start saving the world.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Role selector */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-brand-muted rounded-xl border border-brand-border">
                    {(['student', 'teacher'] as const).map(r => (
                        <label key={r} className={`flex items-center justify-center py-2.5 rounded-lg cursor-pointer text-sm font-semibold transition-all ${role === r ? 'bg-brand-primary text-white' : 'text-brand-subtext hover:text-brand-text'}`}>
                            <input {...register('role')} type="radio" value={r} className="sr-only" />
                            {r === 'student' ? '🎓 Student' : '👩‍🏫 Teacher'}
                        </label>
                    ))}
                </div>

                <div>
                    <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtext" />
                        <input {...register('displayName')} placeholder="Full name" className={`pl-9 ${inputClass}`} />
                    </div>
                    {errors.displayName && <p className="mt-1 text-xs text-red-400">{errors.displayName.message}</p>}
                </div>

                <div>
                    <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtext" />
                        <input {...register('email')} type="email" placeholder="Email address" className={`pl-9 ${inputClass}`} />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
                </div>

                {role === 'student' && (
                    <select {...register('grade')} className={inputClass}>
                        <option value="">Select your grade (optional)</option>
                        {['7', '8', '9', '10', '11', '12'].map(g => <option key={g} value={g}>Grade {g}</option>)}
                    </select>
                )}

                <div>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtext" />
                        <input {...register('password')} type="password" placeholder="Password (8+ characters)" className={`pl-9 ${inputClass}`} />
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
                </div>

                <Button type="submit" isLoading={isSubmitting} className="w-full" size="lg" rightIcon={<ArrowRight size={18} />}>
                    Create Account
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-brand-subtext">
                Already have an account?{' '}
                <Link to="/login" className="text-brand-primary hover:text-indigo-400 font-semibold transition-colors">Sign in</Link>
            </p>
        </div>
    )
}
