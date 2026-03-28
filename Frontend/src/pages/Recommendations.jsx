import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

// ── Single Item Card ──────────────────────────────
const ItemCard = ({ item, badge }) => {
  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden hover:scale-105 transition duration-300">
      <div className="relative bg-gray-800" style={{ aspectRatio: "3/4" }}>
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-contain p-2"
          onError={(e) =>
            (e.target.src = "https://via.placeholder.com/400x300?text=Item")
          }
        />
        <div
          className="absolute top-2 left-2 bg-black/70 text-white
                                text-xs font-bold px-2 py-1 rounded-full"
        >
          {badge}
        </div>
        <div
          className="absolute top-2 right-2 bg-purple-600/90
                                text-white text-xs font-bold px-2 py-1 rounded-full"
        >
          ✨ AI Pick
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Name + Price */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-white font-semibold text-sm leading-tight">
            {item.name}
          </h3>
          <span className="text-green-400 font-bold text-lg whitespace-nowrap">
            ₹{item.price?.toLocaleString()}
          </span>
        </div>

        {/* Colors */}
        <div className="flex gap-2 flex-wrap">
          {item.colors?.map((color, i) => (
            <span
              key={i}
              className="bg-gray-800 text-gray-300 px-2 py-1 rounded-lg text-xs capitalize"
            >
              🎨 {color}
            </span>
          ))}
          <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded-lg text-xs capitalize">
            {item.color_family}
          </span>
        </div>

        {/* Occasion tags */}
        <div className="flex gap-2 flex-wrap">
          {item.occasion?.map((occ, i) => (
            <span
              key={i}
              className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded-lg text-xs capitalize"
            >
              {occ}
            </span>
          ))}
        </div>

        {/* Brand + Sizes */}
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>🏷️ {item.brand}</span>
          <span>{item.sizes?.join(" · ")}</span>
        </div>

        {/* Body shapes */}
        <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-3">
          <p className="text-blue-300 text-xs leading-relaxed">
            👤 <span className="font-semibold">Suits: </span>
            {item.suitable_body_shapes?.join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Section Component ─────────────────────────────
const Section = ({ title, emoji, items, emptyMsg }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-6">
        {emoji} {title}
        <span className="ml-3 text-sm text-gray-500 font-normal">
          {items.length} items
        </span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, i) => (
          <ItemCard
            key={item.id || i}
            item={item}
            badge={`${title} #${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

// ── Main Recommendations Page ─────────────────────
const Recommendations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await API.get(`/recommend/${user.email}`);
        setData(res.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError("no_profile");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [user.email]);

  // ── Loading ───────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-6 animate-bounce">✨</div>
          <p className="text-white text-2xl font-bold mb-2">
            OutfitIQ AI is styling you...
          </p>
          <p className="text-gray-400">
            Analyzing your body profile and finding perfect items
          </p>
        </div>
      </div>
    );
  }

  // ── No Profile ────────────────────────────────
  if (error === "no_profile") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-6">📏</div>
          <h2 className="text-white text-3xl font-bold mb-3">
            No Body Profile Found!
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Create your body profile first to get AI recommendations
          </p>
          <button
            onClick={() => navigate("/profile")}
            className="bg-purple-600 text-white px-8 py-4 rounded-xl
                                   hover:bg-purple-700 transition text-lg font-semibold"
          >
            Create Profile →
          </button>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-6">😕</div>
          <p className="text-red-400 text-xl mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl
                                   hover:bg-purple-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalItems =
    (data.total_tops || 0) +
    (data.total_bottoms || 0) +
    (data.total_outers || 0);

  // ── Main Page ─────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Your AI Picks</h1>
        <p className="text-gray-400 text-lg">
          Personalized for your{" "}
          <span className="text-purple-400 capitalize font-medium">
            {data.body_shape}
          </span>{" "}
          body shape •{" "}
          <span className="text-purple-400 capitalize font-medium">
            {data.skin_tone}
          </span>{" "}
          skin tone •{" "}
          <span className="text-purple-400 capitalize font-medium">
            {data.occasion}
          </span>{" "}
          occasion
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { label: "Items Found", value: totalItems, icon: "👔" },
          { label: "Body Shape", value: data.body_shape, icon: "👤" },
          { label: "Skin Tone", value: data.skin_tone, icon: "🎨" },
          { label: "Occasion", value: data.occasion, icon: "🎯" },
        ].map((stat, i) => (
          <div key={i} className="bg-gray-900 rounded-2xl p-4 text-center">
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-xl font-bold text-purple-400 capitalize">
              {stat.value}
            </div>
            <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Style Tip */}
      {data.style_tip && (
        <div
          className="bg-purple-600/10 border border-purple-600/30
                                rounded-2xl p-4 mb-10"
        >
          <p className="text-purple-300 text-sm">
            💡{" "}
            <span className="font-semibold">
              Style tip for your body shape:{" "}
            </span>
            {data.style_tip}
          </p>
        </div>
      )}

      {/* Sections */}
      {totalItems > 0 ? (
        <>
          <Section title="Tops" emoji="👕" items={data.tops} />
          <Section title="Bottoms" emoji="👖" items={data.bottoms} />
          <Section title="Outers" emoji="🧥" items={data.outers} />

          <div className="text-center mt-10">
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-800 text-white px-8 py-3 rounded-xl
                                       hover:bg-gray-700 transition font-medium"
            >
              🔄 Refresh Recommendations
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <div className="text-7xl mb-6">😕</div>
          <p className="text-gray-400 text-xl mb-6">
            No items found. Try updating your body profile!
          </p>
          <button
            onClick={() => navigate("/profile")}
            className="bg-purple-600 text-white px-6 py-3
                                   rounded-xl hover:bg-purple-700 transition"
          >
            Update Profile →
          </button>
        </div>
      )}
    </div>
  );
};

export default Recommendations;
