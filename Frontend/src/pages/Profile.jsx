import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'

const Profile = () => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        height: '',
        weight: '',
        chest: '',
        waist: '',
        hip: '',
        shoulder_width: '',
        skin_tone: 'medium',
        body_shape: 'rectangle',
        gender: 'male',
        occasion: 'casual'
    })

    // Fetch existing profile on load
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await API.get(`/profile/get/${user.email}`)
                setForm(res.data)
            } catch (err) {
                // No profile yet — that's fine
            } finally {
                setFetching(false)
            }
        }
        fetchProfile()
    }, [user.email])

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')
        try {
            await API.post(`/profile/save/${user.email}`, {
                ...form,
                height: parseFloat(form.height),
                weight: parseFloat(form.weight),
                chest: parseFloat(form.chest),
                waist: parseFloat(form.waist),
                hip: parseFloat(form.hip),
                shoulder_width: parseFloat(form.shoulder_width),
            })
            setSuccess('Body profile saved successfully! ✅')
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save profile')
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-white text-xl">Loading your profile...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="max-w-2xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold">Body Profile 📏</h1>
                    <p className="text-gray-400 mt-2">
                        Enter your measurements for accurate size prediction
                    </p>
                </div>

                {/* Success / Error */}
                {success && (
                    <div className="bg-green-500/20 text-green-400 px-4 py-3 rounded-lg mb-6">
                        {success}
                    </div>
                )}
                {error && (
                    <div className="bg-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Measurements Section */}
                    <div className="bg-gray-900 p-6 rounded-2xl">
                        <h2 className="text-xl font-semibold mb-4 text-purple-400">
                            📐 Measurements (in cm)
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { name: 'height', label: 'Height (cm)' },
                                { name: 'weight', label: 'Weight (kg)' },
                                { name: 'chest', label: 'Chest (cm)' },
                                { name: 'waist', label: 'Waist (cm)' },
                                { name: 'hip', label: 'Hip (cm)' },
                                { name: 'shoulder_width', label: 'Shoulder Width (cm)' },
                            ].map((field) => (
                                <div key={field.name}>
                                    <label className="text-gray-400 text-sm mb-1 block">
                                        {field.label}
                                    </label>
                                    <input
                                        type="number"
                                        name={field.name}
                                        value={form[field.name]}
                                        onChange={handleChange}
                                        required
                                        placeholder="0"
                                        className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Body Details Section */}
                    <div className="bg-gray-900 p-6 rounded-2xl">
                        <h2 className="text-xl font-semibold mb-4 text-purple-400">
                            👤 Body Details
                        </h2>
                        <div className="grid grid-cols-2 gap-4">

                            {/* Gender */}
                            <div>
                                <label className="text-gray-400 text-sm mb-1 block">
                                    Gender
                                </label>
                                <select
                                    name="gender"
                                    value={form.gender}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Skin Tone */}
                            <div>
                                <label className="text-gray-400 text-sm mb-1 block">
                                    Skin Tone
                                </label>
                                <select
                                    name="skin_tone"
                                    value={form.skin_tone}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value="fair">Fair</option>
                                    <option value="medium">Medium</option>
                                    <option value="dark">Dark</option>
                                    <option value="deep">Deep</option>
                                </select>
                            </div>

                            {/* Body Shape */}
                            <div>
                                <label className="text-gray-400 text-sm mb-1 block">
                                    Body Shape
                                </label>
                                <select
                                    name="body_shape"
                                    value={form.body_shape}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value="rectangle">Rectangle</option>
                                    <option value="hourglass">Hourglass</option>
                                    <option value="pear">Pear</option>
                                    <option value="apple">Apple</option>
                                    <option value="inverted_triangle">Inverted Triangle</option>
                                </select>
                            </div>

                            {/* Occasion */}
                            <div>
                                <label className="text-gray-400 text-sm mb-1 block">
                                    Preferred Occasion
                                </label>
                                <select
                                    name="occasion"
                                    value={form.occasion}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value="casual">Casual</option>
                                    <option value="formal">Formal</option>
                                    <option value="wedding">Wedding</option>
                                    <option value="professional">Professional</option>
                                    <option value="daily">Daily Wear</option>
                                </select>
                            </div>

                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-purple-700 transition disabled:opacity-50">
                        {loading ? 'Saving...' : 'Save Body Profile 💾'}
                    </button>

                </form>
            </div>
        </div>
    )
}

export default Profile