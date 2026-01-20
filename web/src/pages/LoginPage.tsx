import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { PhoneIcon, ShieldCheckIcon, ClockIcon, HomeIcon } from '@heroicons/react/24/outline'
import { authApi } from '../api/client'
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
  const [isLoading, setIsLoading] = useState(false)
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showTerms, setShowTerms] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [smsStatus, setSmsStatus] = useState<{ sent?: boolean; error?: string } | null>(null)

  const from = (location.state as { from?: string })?.from || '/'

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleSendOtp = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setError(null)
    setSmsStatus(null)

    logger.info('LoginPage', 'Attempting to send OTP', { phone: phone.slice(0, 4) + '****' })

    if (!phone || phone.length < 10) {
      const errorMsg = language === 'hi' ? '10 अंकों का फोन नंबर दर्ज करें' : 'Enter a valid 10-digit phone number'
      setError(errorMsg)
      toast.error(errorMsg)
      return
    }

    setIsLoading(true)
    try {
      // First check if phone exists
      const checkResponse = await authApi.checkPhone(phone)

      if (!checkResponse.exists) {
        // Redirect to register page with pre-filled phone number
        toast(language === 'hi'
          ? 'यह नंबर पंजीकृत नहीं है। कृपया पहले साइन अप करें।'
          : 'This number is not registered. Redirecting to registration...')
        navigate('/register', { state: { phone, from } })
        return
      }

      // Send OTP for login
      const response = await authApi.sendOtp(phone, 'login')
      logger.info('LoginPage', 'OTP API response', { response })
      toast.success(t('auth.otpSent'))
      setStep('otp')

      // Set 30 second cooldown
      setResendCooldown(response.cooldown || 30)

      // In development, show OTP for testing
      if (response.otp) {
        setDevOtp(response.otp)
        logger.info('LoginPage', 'Dev OTP received', { otp: response.otp })
      }

      // Store SMS status for debugging
      if (response.dev_mode) {
        setSmsStatus({
          sent: response.sms_sent,
          error: response.sms_error
        })
      }
    } catch (err: unknown) {
      logger.error('LoginPage', 'Failed to send OTP', { error: err })

      // Check for specific error
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string; message?: string } } }
        if (axiosError.response?.data?.error === 'phone_not_registered') {
          setError(language === 'hi'
            ? 'यह नंबर पंजीकृत नहीं है। कृपया पहले साइन अप करें।'
            : 'This number is not registered. Please sign up first.')
          return
        }
        // Show API error message
        if (axiosError.response?.data?.message) {
          setError(axiosError.response.data.message)
          return
        }
      }

      toast.error(language === 'hi' ? 'OTP भेजने में विफल' : 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }, [phone, t, language])

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!otp || otp.length !== 6) {
      toast.error(t('auth.enterOtp'))
      return
    }

    setIsLoading(true)
    logger.info('LoginPage', 'Verifying OTP')
    try {
      // Use the new login endpoint
      const response = await authApi.login({ phone, otp })
      login(response.token, response.user)

      analytics.login('otp')
      logger.info('LoginPage', 'User logged in', { userId: response.user_id, role: response.user.role })

      toast.success(language === 'hi' ? 'वापसी पर स्वागत है!' : 'Welcome back!')

      // Redirect based on role
      if (response.user.role === 'provider') {
        navigate('/provider/dashboard')
      } else if (response.user.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate(from)
      }
    } catch (err: unknown) {
      logger.error('LoginPage', 'OTP verification failed', { error: err })
      analytics.error('otp_verification_failed', String(err))

      // Handle specific errors
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string; message?: string } } }
        const errorCode = axiosError.response?.data?.error

        if (errorCode === 'user_blocked') {
          setError(language === 'hi'
            ? 'आपका खाता ब्लॉक कर दिया गया है। सहायता से संपर्क करें।'
            : 'Your account has been blocked. Please contact support.')
          return
        }
        if (errorCode === 'user_not_found') {
          setError(language === 'hi'
            ? 'उपयोगकर्ता नहीं मिला। कृपया पहले पंजीकरण करें।'
            : 'User not found. Please register first.')
          return
        }
        if (axiosError.response?.data?.message) {
          setError(axiosError.response.data.message)
          return
        }
      }

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
        {/* Go to Home Button */}
        <div className="flex justify-start mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <HomeIcon className="w-5 h-5" />
            <span className="font-medium">{language === 'hi' ? 'होम पर जाएं' : 'Go to Home'}</span>
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="xl" variant="full" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.form
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOtp}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {language === 'hi' ? 'अपने खाते में लॉगिन करें' : 'Login to Your Account'}
                </h2>
                <p className="text-gray-600 text-sm mb-6">
                  {language === 'hi'
                    ? 'अपना पंजीकृत मोबाइल नंबर दर्ज करें'
                    : 'Enter your registered mobile number'}
                </p>

                {/* Error Display */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Phone Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <PhoneIcon className="w-4 h-4 inline mr-1" />
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
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || phone.length !== 10}
                  className="w-full py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading
                    ? (language === 'hi' ? 'भेज रहा है...' : 'Sending...')
                    : t('auth.sendOtp')}
                </button>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-center text-sm text-gray-600">
                    {language === 'hi' ? 'नए उपयोगकर्ता?' : "Don't have an account?"}{' '}
                    <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                      {language === 'hi' ? 'खाता बनाएं' : 'Create Account'}
                    </Link>
                  </p>
                </div>
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
                  onClick={() => { setStep('phone'); setOtp(''); setError(null); setDevOtp(null); setSmsStatus(null); }}
                  className="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-1"
                >
                  ← {t('common.back')}
                </button>

                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  <ShieldCheckIcon className="w-5 h-5 inline mr-1" />
                  {t('auth.verifyOtp')}
                </h2>
                <p className="text-gray-600 text-sm mb-6">
                  {language === 'hi'
                    ? `+91 ${phone} पर भेजा गया 6 अंकों का कोड दर्ज करें`
                    : `Enter the 6-digit code sent to +91 ${phone}`}
                </p>

                {/* Error Display */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Dev OTP Display - Only shown in local/dev environments */}
                {devOtp && (
                  <div className="mb-4 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🔧</span>
                      <span className="text-sm font-semibold text-emerald-800">Development Mode</span>
                    </div>
                    <p className="text-emerald-700 text-sm mb-1">Your OTP Code:</p>
                    <p className="font-mono text-3xl font-bold text-emerald-900 tracking-widest">{devOtp}</p>
                    {smsStatus && (
                      <div className="mt-2 pt-2 border-t border-emerald-200 text-xs text-emerald-600">
                        SMS: {smsStatus.sent ? '✅ Sent' : '❌ Not sent'}
                        {smsStatus.error && <span className="block text-red-500">{smsStatus.error}</span>}
                      </div>
                    )}
                  </div>
                )}

                {/* OTP Input */}
                <div className="mb-6">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading
                    ? (language === 'hi' ? 'सत्यापित हो रहा है...' : 'Verifying...')
                    : (language === 'hi' ? 'लॉगिन करें' : 'Login')}
                </button>

                {/* Resend OTP with Cooldown Timer */}
                <div className="mt-4 text-center">
                  {resendCooldown > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <ClockIcon className="w-4 h-4" />
                      <span className="text-sm">
                        {language === 'hi'
                          ? `${resendCooldown} सेकंड में पुनः भेजें`
                          : `Resend in ${resendCooldown}s`}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={isLoading}
                      className="text-sm text-primary-600 hover:underline disabled:opacity-50"
                    >
                      {language === 'hi' ? 'OTP पुनः भेजें' : 'Resend OTP'}
                    </button>
                  )}
                </div>
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
