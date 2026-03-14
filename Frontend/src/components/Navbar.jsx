import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <nav className="bg-black text-white px-8 py-4 flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold text-purple-400">
                OutfitIQ 👗
            </Link>

            {/* Links */}
            <div className="flex gap-6 items-center">
                {user ? (
                    <>
                        <span className="text-gray-300">
                            Hey, {user.name} 👋
                        </span>
                        <Link
                            to="/dashboard"
                            className="hover:text-purple-400 transition">
                            Dashboard
                        </Link>
                        <Link
                            to="/profile"
                            className="hover:text-purple-400 transition">
                            My Profile
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link
                            to="/login"
                            className="hover:text-purple-400 transition">
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                            Register
                        </Link>
                    </>
                )}
            </div>
        </nav>
    )
}

export default Navbar