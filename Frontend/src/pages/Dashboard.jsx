import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
    Ruler,
    Sparkles,
    Shirt,
    ShoppingBag,
    ChevronRight,
    LogOut,
    Zap,
    Star,
    TrendingUp
} from 'lucide-react'

// ── Floating orb background ───────────────────────
const FloatingOrb = ({ className, delay = 0 }) => (
    <motion.div
        className={`absolute rounded-full blur-3xl opacity-20 ${className}`}
        animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
        }}
        transition={{
            duration: 8,
            repeat: Infinity,
            delay,
            ease: "easeInOut"
        }}
    />
)

// ── Animated counter ──────────────────────────────
const Counter = ({ value, suffix = "" }) => {
    const [count, setCount] = useState(0)
    useEffect(() => {
        let start = 0
        const end = parseInt(value)
        const duration = 1500
        const step = end / (duration / 16)
        const timer = setInterval(() => {
            start += step
            if (start >= end) {
                setCount(end)
                clearInterval(timer)
            } else {
                setCount(Math.floor(start))
            }
        }, 16)
        return () => clearInterval(timer)
    }, [value])
    return <span>{count}{suffix}</span>
}

// ── Main Dashboard ────────────────────────────────
const Dashboard = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [hoveredCard, setHoveredCard] = useState(null)
    const [time, setTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const greeting = () => {
        const h = time.getHours()
        if (h < 12) return "Good Morning"
        if (h < 17) return "Good Afternoon"
        return "Good Evening"
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const modules = [
        {
            title: "Body Profile",
            desc: "Capture your measurements for perfect fit prediction",
            icon: Ruler,
            link: "/profile",
            accent: "#a78bfa",
            bg: "from-violet-600/20 to-purple-900/40",
            border: "border-violet-500/30",
            glow: "shadow-violet-500/20",
            tag: "Step 1"
        },
        {
            title: "AI Stylist",
            desc: "Gemini-powered outfit curation just for you",
            icon: Sparkles,
            link: "/recommendations",
            accent: "#f472b6",
            bg: "from-pink-600/20 to-rose-900/40",
            border: "border-pink-500/30",
            glow: "shadow-pink-500/20",
            tag: "AI Powered"
        },
        {
            title: "Virtual Try-On",
            desc: "See outfits on yourself in real time via AR",
            icon: Shirt,
            link: "/tryon",
            accent: "#38bdf8",
            bg: "from-sky-600/20 to-blue-900/40",
            border: "border-sky-500/30",
            glow: "shadow-sky-500/20",
            tag: "AR engineered"
        },
        {
            title: "My Wardrobe",
            desc: "Saved looks, wishlists and outfit history",
            icon: ShoppingBag,
            link: "/wardrobe",
            accent: "#34d399",
            bg: "from-emerald-600/20 to-teal-900/40",
            border: "border-emerald-500/30",
            glow: "shadow-emerald-500/20",
            tag: "Coming Soon"
        },
    ]

    const stats = [
        { label: "Outfit Picks", value: "200", suffix: "+", icon: Shirt },
        { label: "Style Score", value: "98", suffix: "%", icon: Star },
        { label: "Brands", value: "12", suffix: "", icon: TrendingUp },
        { label: "AI Powered", value: "100", suffix: "%", icon: Zap },
    ]

    return (
        <div className="min-h-screen bg-[#080810] text-white overflow-hidden"
             style={{ fontFamily: "'DM Sans', sans-serif" }}>

            {/* ── Google Font Import ── */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');

                .card-glass {
                    background: rgba(255,255,255,0.03);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                }
                .text-gradient-gold {
                    background: linear-gradient(135deg, #f59e0b, #fcd34d, #f59e0b);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .text-gradient-white {
                    background: linear-gradient(135deg, #ffffff, #94a3b8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .mesh-bg {
                    background:
                        radial-gradient(ellipse 80% 50% at 20% 10%, rgba(139,92,246,0.15) 0%, transparent 60%),
                        radial-gradient(ellipse 60% 40% at 80% 80%, rgba(244,114,182,0.10) 0%, transparent 60%),
                        radial-gradient(ellipse 50% 60% at 50% 50%, rgba(56,189,248,0.05) 0%, transparent 70%);
                }
                .module-card:hover .arrow-icon {
                    transform: translateX(4px);
                }
                .arrow-icon {
                    transition: transform 0.3s ease;
                }
                .tag-pill {
                    font-size: 10px;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    font-weight: 600;
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .shimmer-line {
                    background: linear-gradient(90deg,
                        rgba(255,255,255,0) 0%,
                        rgba(255,255,255,0.1) 50%,
                        rgba(255,255,255,0) 100%
                    );
                    background-size: 200% auto;
                    animation: shimmer 3s linear infinite;
                }
            `}</style>

            {/* ── Background ── */}
            <div className="fixed inset-0 mesh-bg pointer-events-none" />
            <FloatingOrb className="w-96 h-96 bg-violet-600 top-0 left-0" delay={0} />
            <FloatingOrb className="w-80 h-80 bg-pink-500 bottom-20 right-10" delay={3} />
            <FloatingOrb className="w-64 h-64 bg-sky-500 top-1/2 left-1/2" delay={6} />

            {/* ── Noise texture overlay ── */}
            <div className="fixed inset-0 opacity-[0.015] pointer-events-none"
                 style={{
                     backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                 }}
            />

            <div className="relative max-w-6xl mx-auto px-6 py-10">

                {/* ── Top Bar ── */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="flex justify-between items-center mb-16"
                >
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <Sparkles className="w-5 h-5 text-white" strokeWidth={1.5} />
                        </div>
                        <span className="text-lg font-semibold tracking-tight"
                              style={{ fontFamily: "'Playfair Display', serif" }}>
                            OutfitIQ
                        </span>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 card-glass rounded-xl border border-white/8">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs text-gray-400 font-medium">
                                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        {/* Avatar + logout */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/30 to-pink-500/30 border border-white/10 flex items-center justify-center text-sm font-semibold">
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleLogout}
                                className="p-2 card-glass rounded-xl border border-white/8 text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* ── Hero Greeting ── */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-14"
                >
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-2">
                        {greeting()} ✦
                    </p>
                    <h1 className="text-5xl sm:text-6xl font-bold leading-none mb-4"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        <span className="text-gradient-white">
                            {user?.name?.split(' ')[0] || 'Stylist'}
                        </span>
                        <span className="text-gradient-gold italic">'s</span>
                        <br />
                        <span className="text-gradient-white">Style Studio</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-md leading-relaxed">
                        Your AI-powered personal stylist. Discover outfits curated precisely for your body, skin tone and occasion.
                    </p>
                </motion.div>

                {/* ── Stats Bar ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.25 }}
                    className="grid grid-cols-4 gap-3 mb-12"
                >
                    {stats.map((stat, i) => {
                        const Icon = stat.icon
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + i * 0.07 }}
                                className="card-glass border border-white/8 rounded-2xl p-4 text-center"
                            >
                                <Icon className="w-4 h-4 text-gray-500 mx-auto mb-2" strokeWidth={1.5} />
                                <div className="text-2xl font-bold text-white">
                                    <Counter value={stat.value} suffix={stat.suffix} />
                                </div>
                                <div className="text-xs text-gray-500 mt-1 font-medium">
                                    {stat.label}
                                </div>
                            </motion.div>
                        )
                    })}
                </motion.div>

                {/* ── Module Cards ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
                >
                    {modules.map((mod, i) => {
                        const Icon = mod.icon
                        const isHovered = hoveredCard === i
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 32 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: 0.45 + i * 0.08,
                                    duration: 0.6,
                                    ease: [0.16, 1, 0.3, 1]
                                }}
                                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                                onHoverStart={() => setHoveredCard(i)}
                                onHoverEnd={() => setHoveredCard(null)}
                            >
                                <Link to={mod.link}>
                                    <div className={`
                                        module-card relative h-full
                                        bg-gradient-to-b ${mod.bg}
                                        border ${mod.border}
                                        rounded-2xl p-5
                                        shadow-xl ${isHovered ? mod.glow : ''}
                                        transition-all duration-300
                                        overflow-hidden
                                        cursor-pointer
                                    `}>
                                        {/* Shimmer on hover */}
                                        {isHovered && (
                                            <div className="absolute inset-0 shimmer-line pointer-events-none" />
                                        )}

                                        {/* Top row */}
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-3 rounded-xl"
                                                 style={{
                                                     background: `${mod.accent}15`,
                                                     border: `1px solid ${mod.accent}30`
                                                 }}>
                                                <Icon
                                                    className="w-6 h-6"
                                                    style={{ color: mod.accent }}
                                                    strokeWidth={1.5}
                                                />
                                            </div>
                                            <span className="tag-pill px-2 py-1 rounded-lg text-gray-400"
                                                  style={{
                                                      background: `${mod.accent}10`,
                                                      border: `1px solid ${mod.accent}20`,
                                                      color: mod.accent
                                                  }}>
                                                {mod.tag}
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <h2 className="text-base font-semibold text-white mb-2 leading-tight">
                                            {mod.title}
                                        </h2>
                                        <p className="text-xs text-gray-400 leading-relaxed mb-5">
                                            {mod.desc}
                                        </p>

                                        {/* CTA */}
                                        <div className="flex items-center gap-1"
                                             style={{ color: mod.accent }}>
                                            <span className="text-xs font-semibold">Explore</span>
                                            <ChevronRight
                                                className="w-3.5 h-3.5 arrow-icon"
                                            />
                                        </div>

                                        {/* Bottom glow line */}
                                        <div
                                            className="absolute bottom-0 left-0 right-0 h-px opacity-50"
                                            style={{
                                                background: `linear-gradient(90deg, transparent, ${mod.accent}, transparent)`
                                            }}
                                        />
                                    </div>
                                </Link>
                            </motion.div>
                        )
                    })}
                </motion.div>

                {/* ── Quick Start Banner ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.75 }}
                >
                    <Link to="/profile">
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="relative overflow-hidden rounded-2xl p-6 cursor-pointer"
                            style={{
                                background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(244,114,182,0.10) 50%, rgba(56,189,248,0.08) 100%)',
                                border: '1px solid rgba(139,92,246,0.25)'
                            }}
                        >
                            {/* Background lines */}
                            <div className="absolute inset-0 pointer-events-none"
                                 style={{
                                     backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.01) 40px, rgba(255,255,255,0.01) 41px)'
                                 }}
                            />

                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
                                        <Sparkles className="w-6 h-6 text-white" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-1">
                                            Get Started
                                        </p>
                                        <h3 className="text-lg font-bold text-white"
                                            style={{ fontFamily: "'Playfair Display', serif" }}>
                                            Build your style profile
                                        </h3>
                                        <p className="text-sm text-gray-400 mt-0.5">
                                            Takes 2 minutes • Unlocks AI recommendations
                                        </p>
                                    </div>
                                </div>

                                <motion.div
                                    animate={{ x: [0, 4, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex-shrink-0"
                                    style={{
                                        background: 'linear-gradient(135deg, #7c3aed, #db2777)',
                                        boxShadow: '0 0 20px rgba(124,58,237,0.4)'
                                    }}
                                >
                                    Start now
                                    <ChevronRight className="w-4 h-4" />
                                </motion.div>
                            </div>
                        </motion.div>
                    </Link>
                </motion.div>

                {/* ── Footer ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="mt-10 flex justify-between items-center"
                >
                    <p className="text-xs text-gray-600">
                        OutfitIQ © 2026 • AI Fashion Intelligence
                    </p>
                   
                </motion.div>

            </div>
        </div>
    )
}

export default Dashboard