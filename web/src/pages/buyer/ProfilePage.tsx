import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import { useLanguageStore } from '../../store/languageStore'
import { userApi } from '../../api/client'
import { analytics } from '../../utils/monitoring'
import { logger } from '../../utils/logger'

// Language Option Component
function LanguageOption() {
  const { language, setLanguage } = useLanguageStore()

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-3">
        <GlobeAltIcon className="w-5 h-5 text-primary-500" />
        <div>
          <p className="font-medium text-gray-900">Language / भाषा</p>
          <p className="text-sm text-gray-500">{language === 'en' ? 'English' : 'हिन्दी'}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            language === 'en'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('hi')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            language === 'hi'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          हिन्दी
        </button>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [isSaving, setIsSaving] = useState(false)

  // Jain dietary preferences
  const [preferences, setPreferences] = useState({
    jain_strict: user?.preferences?.jain_strict ?? true,
    no_root_veggies: user?.preferences?.no_root_veggies ?? true,
    sattvic_only: user?.preferences?.sattvic_only ?? false,
    notifications_enabled: user?.preferences?.notifications_enabled ?? true,
  })

  const handleSave = async () => {
    setIsSaving(true)
    logger.info('ProfilePage', 'Saving profile', { name, email })
    try {
      await userApi.updateMe({ name, email, preferences })
      updateUser({ name, email, preferences })

      // Track profile update
      const updatedFields = []
      if (name !== user?.name) updatedFields.push('name')
      if (email !== user?.email) updatedFields.push('email')
      if (JSON.stringify(preferences) !== JSON.stringify(user?.preferences)) updatedFields.push('preferences')

      analytics.profileUpdated(updatedFields)
      analytics.preferencesChanged(preferences)
      logger.info('ProfilePage', 'Profile saved successfully', { updatedFields })

      toast.success('Profile updated!')
    } catch (err) {
      logger.error('ProfilePage', 'Failed to save profile', { error: err })
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    logger.info('ProfilePage', 'User logging out')
    analytics.logout()
    logout()
    navigate('/')
    toast.success('Logged out successfully')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

        {/* Profile Header */}
        <div className="bg-gradient-to-br from-primary-500 to-orange-500 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <UserCircleIcon className="w-12 h-12 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.name || 'Jain Food Lover'}</h2>
              <p className="text-white/80 flex items-center gap-1 mt-1">
                <PhoneIcon className="w-4 h-4" />
                +91 {user?.phone}
              </p>
              {user?.role === 'provider' && (
                <span className="inline-block mt-2 px-2 py-1 bg-white/20 rounded-full text-xs">
                  Food Provider
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-xl p-6 mb-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserCircleIcon className="w-5 h-5 text-primary-500" />
            Personal Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={`+91 ${user?.phone || ''}`}
                  disabled
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Jain Dietary Preferences */}
        <div className="bg-white rounded-xl p-6 mb-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🌿</span>
            Jain Dietary Preferences
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-green-50 rounded-xl cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">Strict Jain</p>
                <p className="text-sm text-gray-500">Show only strictly Jain certified food</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.jain_strict}
                onChange={(e) => setPreferences({ ...preferences, jain_strict: e.target.checked })}
                className="w-5 h-5 rounded text-primary-500"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-green-50 rounded-xl cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">No Root Vegetables</p>
                <p className="text-sm text-gray-500">Exclude onion, garlic, potato, etc.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.no_root_veggies}
                onChange={(e) => setPreferences({ ...preferences, no_root_veggies: e.target.checked })}
                className="w-5 h-5 rounded text-primary-500"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-purple-50 rounded-xl cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">Sattvic Only</p>
                <p className="text-sm text-gray-500">Prefer light, pure sattvic food</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.sattvic_only}
                onChange={(e) => setPreferences({ ...preferences, sattvic_only: e.target.checked })}
                className="w-5 h-5 rounded text-primary-500"
              />
            </label>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl p-6 mb-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Cog6ToothIcon className="w-5 h-5 text-primary-500" />
            Settings
          </h3>

          {/* Language Selection */}
          <LanguageOption />

          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer mt-3">
            <div>
              <p className="font-medium text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-500">Order updates, offers, and more</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.notifications_enabled}
              onChange={(e) => setPreferences({ ...preferences, notifications_enabled: e.target.checked })}
              className="w-5 h-5 rounded text-primary-500"
            />
          </label>

          {/* FAQ Link */}
          <button
            onClick={() => navigate('/faq')}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl mt-3 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">❓</span>
              <p className="font-medium text-gray-900">FAQ & Help</p>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 bg-primary-500 text-white font-semibold rounded-xl disabled:opacity-50 hover:bg-primary-600 transition-colors mb-4"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>

        {/* Provider Link */}
        {user?.role === 'provider' && (
          <button
            onClick={() => navigate('/provider/dashboard')}
            className="w-full py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors mb-4 flex items-center justify-center gap-2"
          >
            <ShieldCheckIcon className="w-5 h-5" />
            Go to Provider Dashboard
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-4 border-2 border-red-500 text-red-500 font-semibold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Logout
        </button>
      </motion.div>
    </div>
  )
}
