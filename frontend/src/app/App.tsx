import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LoadingScreen } from '@/components/Spinner'

const LoginPage = React.lazy(() => import('@/features/auth/LoginPage'))
const SignupPage = React.lazy(() => import('@/features/auth/SignupPage'))
const StudentDashboard = React.lazy(() => import('@/features/dashboard/StudentDashboard'))
const TeacherDashboard = React.lazy(() => import('@/features/dashboard/TeacherDashboard'))
const AdminPanel = React.lazy(() => import('@/features/admin/AdminPanel'))
const SimulationGame = React.lazy(() => import('@/features/simulation/SimulationGame'))
const ProfilePage = React.lazy(() => import('@/features/profile/ProfilePage'))
const AuthLayout = React.lazy(() => import('@/layouts/AuthLayout'))
const DashboardLayout = React.lazy(() => import('@/layouts/DashboardLayout'))

const Fallback = () => <LoadingScreen text="Loading page..." />

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore()
    if (!isAuthenticated) return <Navigate to="/login" replace />
    return <>{children}</>
}

function RoleRoute({ children, role }: { children: React.ReactNode; role: string }) {
    const { user, isAuthenticated } = useAuthStore()
    if (!isAuthenticated) return <Navigate to="/login" replace />
    if (user?.role !== role) return <Navigate to="/dashboard" replace />
    return <>{children}</>
}

function RootRedirect() {
    const { isAuthenticated } = useAuthStore()
    return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

export default function App() {
    return (
        <React.Suspense fallback={<Fallback />}>
            <Routes>
                <Route path="/" element={<RootRedirect />} />

                {/* Auth Routes */}
                <Route element={<AuthLayout />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                </Route>

                {/* Protected App Routes */}
                <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                    <Route path="/dashboard" element={<StudentDashboard />} />
                    <Route path="/leaderboard" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Route>

                {/* Play route — no sidebar */}
                <Route
                    path="/play/:sdgId"
                    element={<ProtectedRoute><React.Suspense fallback={<Fallback />}><SimulationGame /></React.Suspense></ProtectedRoute>}
                />

                {/* Role Routes */}
                <Route element={<RoleRoute role="teacher"><DashboardLayout /></RoleRoute>}>
                    <Route path="/teacher" element={<TeacherDashboard />} />
                </Route>

                <Route element={<RoleRoute role="admin"><DashboardLayout /></RoleRoute>}>
                    <Route path="/admin" element={<AdminPanel />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </React.Suspense>
    )
}
