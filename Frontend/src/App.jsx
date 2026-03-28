import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Recommendations from './pages/Recommendations'
import TryOn from './pages/TryOn'

// ── Protected Route ───────────────────────────────
const ProtectedRoute = ({ children }) => {
    const { user } = useAuth()
    return user ? children : <Navigate to="/login" />
}

// ── Root Redirect ─────────────────────────────────
const RootRedirect = () => {
    const { user } = useAuth()
    return user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
}

const App = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Navbar />
                <Routes>
                    {/* ── Root → smart redirect ── */}
                    <Route path="/" element={<RootRedirect />} />

                    {/* ── Public routes ── */}
                    <Route path="/login"    element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* ── Protected routes ── */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute><Dashboard /></ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute><Profile /></ProtectedRoute>
                    } />
                    <Route path="/recommendations" element={
                        <ProtectedRoute><Recommendations /></ProtectedRoute>
                    } />
                    <Route path="/tryon" element={
                        <ProtectedRoute><TryOn /></ProtectedRoute>
                    } />

                    {/* ── 404 → login ── */}
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App