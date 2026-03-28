import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  LayoutDashboard,
  Ruler,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
} from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsMenuOpen(false);
  };

  const navLinks = user
    ? [
        { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
        { label: "My Profile", to: "/profile", icon: Ruler },
        { label: "AI Stylist", to: "/recommendations", icon: Sparkles },
      ]
    : [];

  return (
    <>
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
                .nav-glass {
    background: rgba(15, 10, 20, 0.95);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
}
               .nav-glass-scrolled {
    background: rgba(0, 0, 0, 0.98);
    backdrop-filter: blur(32px);
    -webkit-backdrop-filter: blur(32px);
}
                .nav-link-hover {
                    position: relative;
                }
                .nav-link-hover::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, #7c3aed, #db2777);
                    transform: scaleX(0);
                    transition: transform 0.3s ease;
                    transform-origin: left;
                }
                .nav-link-hover:hover::after {
                    transform: scaleX(1);
                }
                .mobile-menu-bg {
                    background: rgba(8, 8, 16, 0.98);
                    backdrop-filter: blur(32px);
                    -webkit-backdrop-filter: blur(32px);
                }
            `}</style>

      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`
                    fixed top-0 left-0 right-0 z-50
                    ${scrolled ? "nav-glass-scrolled" : "nav-glass"}
                    border-b transition-all duration-300
                    ${scrolled ? "border-white/10" : "border-white/5"}
                `}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Top shimmer line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(124,58,237,0.6) 30%, rgba(219,39,119,0.6) 70%, transparent 100%)",
          }}
        />

        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* ── Logo ── */}
            <Link to={user ? "/dashboard" : "/"}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Sparkles className="w-4 h-4 text-white" strokeWidth={1.5} />
                </div>
                <span
                  className="text-lg font-bold text-white"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  OutfitIQ
                </span>
              </motion.div>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link, i) => {
                const Icon = link.icon;
                return (
                  <Link key={i} to={link.to}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="nav-link-hover flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {link.label}
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* ── Desktop Right Side ── */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  {/* User pill */}
                  <div
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/8"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500/40 to-pink-500/40 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="text-sm text-gray-300 font-medium">
                      {user?.name?.split(" ")[0]}
                    </span>
                  </div>

                  {/* Logout */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-gray-400 hover:text-red-400 border border-white/8 hover:border-red-500/30 transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Logout
                  </motion.button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Login
                    </motion.div>
                  </Link>
                  <Link to="/register">
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white font-semibold"
                      style={{
                        background: "linear-gradient(135deg, #7c3aed, #db2777)",
                        boxShadow: "0 0 16px rgba(124,58,237,0.35)",
                      }}
                    >
                      Get Started
                      <ChevronRight className="w-3.5 h-3.5" />
                    </motion.div>
                  </Link>
                </>
              )}
            </div>

            {/* ── Mobile Menu Toggle ── */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-white/8 text-gray-400 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5" strokeWidth={1.5} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5" strokeWidth={1.5} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden mobile-menu-bg border-t border-white/8 overflow-hidden"
            >
              <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-1">
                {user ? (
                  <>
                    {/* User info */}
                    <div
                      className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl border border-white/8"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/40 to-pink-500/40 border border-white/10 flex items-center justify-center text-sm font-bold text-white">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </div>

                    {/* Nav links */}
                    {navLinks.map((link, i) => {
                      const Icon = link.icon;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Link
                            to={link.to}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <div className="flex items-center justify-between px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all group">
                              <div className="flex items-center gap-3">
                                <Icon
                                  className="w-4 h-4 text-gray-500 group-hover:text-violet-400 transition-colors"
                                  strokeWidth={1.5}
                                />
                                <span className="text-sm font-medium">
                                  {link.label}
                                </span>
                              </div>
                              <ChevronRight
                                className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors"
                                strokeWidth={1.5}
                              />
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}

                    {/* Logout */}
                    <motion.div
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: navLinks.length * 0.05 }}
                      className="mt-2 pt-2 border-t border-white/8"
                    >
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
                      >
                        <LogOut className="w-4 h-4" strokeWidth={1.5} />
                        Sign out
                      </button>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      <div className="px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
                        Login
                      </div>
                    </Link>
                    <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                      <div
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm text-white font-semibold mt-1"
                        style={{
                          background:
                            "linear-gradient(135deg, #7c3aed, #db2777)",
                          boxShadow: "0 0 16px rgba(124,58,237,0.3)",
                        }}
                      >
                        Get Started
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Spacer to prevent content going under navbar ── */}
      <div className="h-16" />
    </>
  );
};

export default Navbar;
