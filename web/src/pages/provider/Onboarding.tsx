import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { providerApi } from '../../api/client'
import { useLocationStore } from '../../store/locationStore'
import { JAIN_TAGS } from '../../types'

export default function ProviderOnboarding() {
  const navigate = useNavigate()
  const { lat, lng, getCurrentLocation } = useLocationStore()

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    business_name: '',
    address: '',
    lat: lat || 0,
    lng: lng || 0,
    tags: [] as string[],
  })

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  const handleSubmit = async () => {
    if (!formData.business_name || !formData.address) {
      toast.error('Please fill all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await providerApi.create({
        business_name: formData.business_name,
        address: formData.address,
        lat: formData.lat || lat || 19.076,
        lng: formData.lng || lng || 72.8777,
        tags: formData.tags,
      })
      toast.success('Provider registered successfully!')
      navigate('/provider/dashboard')
    } catch {
      toast.error('Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👨‍🍳</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Become a Provider</h1>
          <p className="text-gray-600 mt-2">Join our Jain food community</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full ${s <= step ? 'bg-primary-500' : 'bg-gray-300'}`}
            />
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Business Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl"
                  placeholder="e.g., Jain Kitchen, Pure Veg Tiffins"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl"
                  rows={3}
                  placeholder="Full address"
                />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!formData.business_name || !formData.address}
                className="w-full py-3 bg-primary-500 text-white font-semibold rounded-xl disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Location</h2>
              <button
                onClick={async () => {
                  await getCurrentLocation()
                  setFormData({ ...formData, lat: lat || 0, lng: lng || 0 })
                  toast.success('Location updated!')
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 text-gray-600 hover:border-primary-500"
              >
                <MapPinIcon className="w-5 h-5" />
                Use Current Location
              </button>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    value={formData.lat || lat || ''}
                    onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 border rounded-xl"
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    value={formData.lng || lng || ''}
                    onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 border rounded-xl"
                    step="any"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-primary-500 text-white font-semibold rounded-xl"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Food Type</h2>
              <p className="text-sm text-gray-600">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(JAIN_TAGS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleTagToggle(key)}
                    className={`px-4 py-2 rounded-full text-sm ${
                      formData.tags.includes(key)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-primary-500 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
