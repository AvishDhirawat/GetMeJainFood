import { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { authApi, userApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { useLanguageStore } from '../store/languageStore'
import { logger } from '../utils/logger'
import { analytics } from '../utils/monitoring'
import Logo from '../components/Logo'
import TermsModal from '../components/TermsModal'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()
  const { t, language } = useLanguageStore()

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [role, setRole] = useState<'buyer' | 'provider'>('buyer')
  const [isLoading, setIsLoading] = useState(false)
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showTerms, setShowTerms] = useState(false)

  const from = (location.state as { from?: string })?.from || '/'

  const handleSendOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setError(null)

    logger.info('LoginPage', 'Attempting to send OTP', { phone: phone.slice(0, 4) + '****' })

    if (!phone || phone.length < 10) {
      const errorMsg = t('auth.enterPhone')
      setError(errorMsg)
      toast.error(errorMsg)
      logger.warn('LoginPage', 'Invalid phone number', { phoneLength: phone.length })
      return
    }

    setIsLoading(true)
    try {
      const response = await authApi.sendOtp(phone)
      logger.info('LoginPage', 'OTP sent successfully', { hasDevOtp: !!response.otp })
      toast.success(t('auth.otpSent'))
      setStep('otp')
      // In development, show OTP for testing
      if (response.otp) {
        setDevOtp(response.otp)
        logger.debug('LoginPage', 'Dev OTP received', { otp: response.otp })
      }
    } finally {
      setIsLoading(false)
    }
  }, [phone, t])

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      toast.error(t('auth.enterOtp'))
      return
    }

    setIsLoading(true)
    logger.info('LoginPage', 'Verifying OTP', { role })
    try {
      const response = await authApi.verifyOtp(phone, otp, role)
      const user = await userApi.getMe()
      login(response.token, user)

      // Track authentication
      if (response.is_new) {
        analytics.signup()
        logger.info('LoginPage', 'New user signed up', { userId: user.id, role: user.role })
      } else {
        analytics.login('otp')
        logger.info('LoginPage', 'User logged in', { userId: user.id, role: user.role })
      }

      toast.success(response.is_new
        ? (language === 'hi' ? 'खाता सफलतापूर्वक बनाया गया!' : 'Account created successfully!')
        : (language === 'hi' ? 'वापसी पर स्वागत है!' : 'Welcome back!'))

      // Redirect based on role
      if (role === 'provider' && response.is_new) {
        navigate('/provider-onboarding')
      } else if (user.role === 'provider') {
        navigate('/provider/dashboard')
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate(from)
      }
    } catch (err) {
      logger.error('LoginPage', 'OTP verification failed', { error: err })
      analytics.error('otp_verification_failed', String(err))
      toast.error(t('auth.invalidOtp'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="xl" variant="full" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.form
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOtp}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {language === 'hi' ? 'लॉगिन या साइन अप करें' : 'Login or Sign up'}
                </h2>

                {/* Error Display */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Role Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.selectRole')}
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('buyer')}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                        role === 'buyer'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl block mb-1">🍽️</span>
                      <p className="font-medium">{t('auth.foodLover')}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('provider')}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                        role === 'provider'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl block mb-1">👨‍🍳</span>
                      <p className="font-medium">{t('auth.foodProvider')}</p>
                    </button>
                  </div>
                </div>

                {/* Phone Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.phone')}
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder={t('auth.enterPhone')}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-r-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      maxLength={10}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || phone.length !== 10}
                  className="w-full py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading
                    ? (language === 'hi' ? 'OTP भेज रहे हैं...' : 'Sending OTP...')
                    : t('common.continue')}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp}
              >
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-1"
                >
                  ← {t('common.back')}
                </button>

                <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('auth.verifyOtp')}</h2>
                <p className="text-gray-600 mb-6">
                  {language === 'hi'
                    ? `+91 ${phone} पर भेजा गया 6 अंकों का कोड दर्ज करें`
                    : `Enter the 6-digit code sent to +91 ${phone}`}
                </p>

                {/* Dev OTP Display */}
                {devOtp && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Dev Mode:</strong> Your OTP is <span className="font-mono font-bold">{devOtp}</span>
                    </p>
                  </div>
                )}

                {/* OTP Input */}
                <div className="mb-6">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder={t('auth.enterOtp')}
                    className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    maxLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading
                    ? (language === 'hi' ? 'सत्यापित हो रहा है...' : 'Verifying...')
                    : (language === 'hi' ? 'सत्यापित करें और लॉगिन करें' : 'Verify & Login')}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSendOtp(e)}
                  className="w-full mt-3 text-primary-600 hover:text-primary-700"
                >
                  {language === 'hi' ? 'OTP पुनः भेजें' : 'Resend OTP'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Terms */}
        <p className="text-center text-sm text-gray-500 mt-6">
          {language === 'hi' ? 'जारी रखकर, आप हमारी ' : 'By continuing, you agree to our '}
          <button
            onClick={() => setShowTerms(true)}
            className="text-primary-600 hover:underline"
          >
            {t('terms.title')}
          </button>
          {language === 'hi' ? ' स्वीकार करते हैं' : ''}
        </p>
      </motion.div>

      {/* Terms Modal */}
      <TermsModal
        isOpen={showTerms}
        onAccept={() => setShowTerms(false)}
        onClose={() => setShowTerms(false)}
      />
    </div>
  )
}
