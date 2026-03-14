import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

const Dashboard = () => {
    const { user } = useAuth()

    const modules = [
        {
            title: "Body Profile",
            desc: "Set your measurements for accurate sizing",
            icon: "📏",
            link: "/profile",
            color: "from-purple-600 to-purple-800"
        },
        {
            title: "Style Recommendations",
            desc: "Get AI-powered outfit suggestions",
            icon: "✨",
            link: "/recommendations",
            color: "from-pink-600 to-pink-800"
        },
        {
            title: "Virtual Try-On",
            desc: "See how outfits look on you",
            icon: "👔",
            link: "/tryon",
            color: "from-blue-600 to-blue-800"
        },
        {
            title: "My Wardrobe",
            desc: "View saved outfits and wishlist",
            icon: "👗",
            link: "/wardrobe",
            color: "from-green-600 to-green-800"
        },
    ]

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            {/* Welcome Header */}
            <div className="mb-10">
                <h1 className="text-4xl font-bold">
                    Hey, {user?.name}! 👋
                </h1>
                <p className="text-gray-400 mt-2 text-lg">
                    What would you like to do today?
                </p>
            </div>

            {/* Module Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {modules.map((mod, i) => (
                    <Link to={mod.link} key={i}>
                        <div className={`bg-gradient-to-br ${mod.color} p-6 rounded-2xl hover:scale-105 transition cursor-pointer h-full`}>
                            <div className="text-5xl mb-4">{mod.icon}</div>
                            <h2 className="text-xl font-bold mb-2">
                                {mod.title}
                            </h2>
                            <p className="text-white/70 text-sm">
                                {mod.desc}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default Dashboard