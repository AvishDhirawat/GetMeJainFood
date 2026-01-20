import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { providerApi } from '../../api/client'
import { useLocationStore } from '../../store/locationStore'
import { useLanguageStore } from '../../store/languageStore'
import TermsModal from '../../components/TermsModal'
import {
  JAIN_TAGS,
  PROVIDER_CATEGORIES,
  FOOD_CATEGORIES,
  EXTERNAL_PLATFORMS,
  type ProviderCategory,
  type FoodCategory,
  type ExternalPlatform,
} from '../../types'

export default function ProviderOnboarding() {
  const navigate = useNavigate()
  const { lat, lng, getCurrentLocation } = useLocationStore()
  const { language, t } = useLanguageStore()

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [formData, setFormData] = useState({
    business_name: '',
    address: '',
    pin_code: '',
    lat: lat || 0,
    lng: lng || 0,
    tags: [] as string[],
    provider_category: '' as ProviderCategory | '',
    food_categories: [] as FoodCategory[],
    aadhar_number: '',
    external_platforms: [] as ExternalPlatform[],
    external_app_link: '',
    min_order_quantity: 1,
    bulk_order_enabled: false,
    free_delivery_min_price: 0,
    free_delivery_max_km: 0,
  })

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  const handleFoodCategoryToggle = (category: FoodCategory) => {
    setFormData((prev) => ({
      ...prev,
      food_categories: prev.food_categories.includes(category)
        ? prev.food_categories.filter((c) => c !== category)
        : [...prev.food_categories, category],
    }))
  }

  const handlePlatformToggle = (platform: ExternalPlatform) => {
    setFormData((prev) => ({
      ...prev,
      external_platforms: prev.external_platforms.includes(platform)
        ? prev.external_platforms.filter((p) => p !== platform)
        : [...prev.external_platforms, platform],
    }))
  }

  const handleTermsAccept = () => {
    setTermsAccepted(true)
    setShowTerms(false)
    toast.success(language === 'hi' ? 'शर्तें स्वीकार की गईं!' : 'Terms accepted!')
  }

  const handleSubmit = async () => {
    if (!termsAccepted) {
      setShowTerms(true)
      return
    }

    if (!formData.business_name || !formData.address || !formData.pin_code) {
      toast.error(language === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें' : 'Please fill all required fields')
      return
    }

    if (!formData.provider_category) {
      toast.error(language === 'hi' ? 'कृपया प्रदाता श्रेणी चुनें' : 'Please select a provider category')
      return
    }

    setIsSubmitting(true)
    try {
      await providerApi.create({
        business_name: formData.business_name,
        address: `${formData.address}, PIN: ${formData.pin_code}`,
        lat: formData.lat || lat || 19.076,
        lng: formData.lng || lng || 72.8777,
        tags: formData.tags,
      })
      toast.success(language === 'hi' ? 'प्रदाता सफलतापूर्वक पंजीकृत!' : 'Provider registered successfully!')
      navigate('/provider/dashboard')
    } catch {
      toast.error(language === 'hi' ? 'पंजीकरण विफल। कृपया पुनः प्रयास करें।' : 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalSteps = 5

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👨‍🍳</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('onboarding.title')}</h1>
          <p className="text-gray-600 mt-2">{t('onboarding.subtitle')}</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${s <= step ? 'bg-primary-500' : 'bg-gray-300'}`}
            />
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          {/* Step 1: Business Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">{t('onboarding.businessDetails')}</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('onboarding.businessName')} *
                </label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500"
                  placeholder={language === 'hi' ? 'जैसे: जैन किचन, शुद्ध शाकाहारी टिफिन' : 'e.g., Jain Kitchen, Pure Veg Tiffins'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('onboarding.address')} *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder={language === 'hi' ? 'पूरा पता' : 'Full address'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('onboarding.pinCode')} *
                </label>
                <input
                  type="text"
                  value={formData.pin_code}
                  onChange={(e) => setFormData({ ...formData, pin_code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500"
                  placeholder="400001"
                  maxLength={6}
                />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!formData.business_name || !formData.address || !formData.pin_code}
                className="w-full py-3 bg-primary-500 text-white font-semibold rounded-xl disabled:opacity-50"
              >
                {t('common.continue')}
              </button>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">{t('onboarding.location')}</h2>
              <button
                onClick={async () => {
                  await getCurrentLocation()
                  setFormData({ ...formData, lat: lat || 0, lng: lng || 0 })
                  toast.success(language === 'hi' ? 'स्थान अपडेट किया गया!' : 'Location updated!')
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 text-gray-600 hover:border-primary-500"
              >
                <MapPinIcon className="w-5 h-5" />
                {t('onboarding.useCurrentLocation')}
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
                <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-300 rounded-xl">
                  {t('common.back')}
                </button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 bg-primary-500 text-white font-semibold rounded-xl">
                  {t('common.continue')}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Provider Category & Food Categories */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-3">{t('onboarding.providerCategory')} *</h2>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(PROVIDER_CATEGORIES) as ProviderCategory[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setFormData({ ...formData, provider_category: key })}
                      className={`px-4 py-3 rounded-xl text-sm text-left transition-colors ${
                        formData.provider_category === key
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {language === 'hi' ? PROVIDER_CATEGORIES[key].hi : PROVIDER_CATEGORIES[key].en}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-1">{t('onboarding.foodCategories')}</h2>
                <p className="text-sm text-gray-600 mb-3">{t('onboarding.selectAll')}</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(FOOD_CATEGORIES) as FoodCategory[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => handleFoodCategoryToggle(key)}
                      className={`px-3 py-2 rounded-full text-sm transition-colors ${
                        formData.food_categories.includes(key)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {language === 'hi' ? FOOD_CATEGORIES[key].hi : FOOD_CATEGORIES[key].en}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-300 rounded-xl">
                  {t('common.back')}
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!formData.provider_category}
                  className="flex-1 py-3 bg-primary-500 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {t('common.continue')}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Food Type Tags & Delivery Settings */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">{t('onboarding.foodType')}</h2>
                <p className="text-sm text-gray-600 mb-3">{t('onboarding.selectAll')}</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(JAIN_TAGS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => handleTagToggle(key)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        formData.tags.includes(key)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-3">{t('onboarding.deliverySettings')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('onboarding.minOrderQty')}
                    </label>
                    <input
                      type="number"
                      value={formData.min_order_quantity}
                      onChange={(e) => setFormData({ ...formData, min_order_quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-3 border rounded-xl"
                      min="1"
                    />
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.bulk_order_enabled}
                      onChange={(e) => setFormData({ ...formData, bulk_order_enabled: e.target.checked })}
                      className="w-5 h-5 rounded text-primary-500"
                    />
                    <span className="text-gray-700">{t('onboarding.bulkOrders')}</span>
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('onboarding.freeDeliveryPrice')} (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.free_delivery_min_price || ''}
                        onChange={(e) => setFormData({ ...formData, free_delivery_min_price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border rounded-xl"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('onboarding.freeDeliveryKm')}
                      </label>
                      <input
                        type="number"
                        value={formData.free_delivery_max_km || ''}
                        onChange={(e) => setFormData({ ...formData, free_delivery_max_km: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border rounded-xl"
                        placeholder="0"
                        step="0.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 py-3 border border-gray-300 rounded-xl">
                  {t('common.back')}
                </button>
                <button onClick={() => setStep(5)} className="flex-1 py-3 bg-primary-500 text-white font-semibold rounded-xl">
                  {t('common.continue')}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: External Platforms & Terms */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-3">{t('onboarding.externalPlatforms')}</h2>
                <p className="text-sm text-gray-600 mb-3">
                  {language === 'hi'
                    ? 'आप किन प्लेटफॉर्म पर भी उपलब्ध हैं?'
                    : 'Which platforms are you also available on?'}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(Object.keys(EXTERNAL_PLATFORMS) as ExternalPlatform[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => handlePlatformToggle(key)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        formData.external_platforms.includes(key)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {EXTERNAL_PLATFORMS[key]}
                    </button>
                  ))}
                </div>
                {formData.external_platforms.includes('own-app') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('onboarding.externalAppLink')}
                    </label>
                    <input
                      type="url"
                      value={formData.external_app_link}
                      onChange={(e) => setFormData({ ...formData, external_app_link: e.target.value })}
                      className="w-full px-4 py-3 border rounded-xl"
                      placeholder="https://..."
                    />
                  </div>
                )}
              </div>

              {/* Terms & Conditions */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-start gap-3">
                  {termsAccepted ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <span className="text-2xl">📜</span>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{t('terms.title')}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {language === 'hi'
                        ? 'जारी रखने से पहले कृपया नियम और शर्तें पढ़ें और स्वीकार करें।'
                        : 'Please read and accept the terms & conditions before continuing.'}
                    </p>
                    <button
                      onClick={() => setShowTerms(true)}
                      className={`mt-2 text-sm font-medium ${
                        termsAccepted ? 'text-green-600' : 'text-primary-600'
                      }`}
                    >
                      {termsAccepted
                        ? (language === 'hi' ? '✓ शर्तें स्वीकार की गईं' : '✓ Terms Accepted')
                        : (language === 'hi' ? 'नियम और शर्तें पढ़ें' : 'Read Terms & Conditions')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(4)} className="flex-1 py-3 border border-gray-300 rounded-xl">
                  {t('common.back')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !termsAccepted}
                  className="flex-1 py-3 bg-primary-500 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {isSubmitting
                    ? (language === 'hi' ? 'पंजीकरण हो रहा है...' : 'Registering...')
                    : (language === 'hi' ? 'पंजीकरण करें' : 'Register')}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Terms Modal */}
      <TermsModal
        isOpen={showTerms}
        onAccept={handleTermsAccept}
        onClose={() => setShowTerms(false)}
      />
    </div>
  )
}
