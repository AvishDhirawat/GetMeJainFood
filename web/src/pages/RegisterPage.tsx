import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { UserIcon, EnvelopeIcon, PhoneIcon, ShieldCheckIcon, ClockIcon, HomeIcon } from '@heroicons/react/24/outline'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { useLanguageStore } from '../store/languageStore'
import { logger } from '../utils/logger'
import { analytics } from '../utils/monitoring'
import Logo from '../components/Logo'
import TermsModal from '../components/TermsModal'

type Step = 'phone' | 'otp' | 'details'

export default function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()
  const { language } = useLanguageStore()

  // Check for pre-filled phone from login redirect
  const locationState = location.state as { phone?: string; from?: string } | null
  const initialPhone = locationState?.phone || ''
  const from = locationState?.from || '/'

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState(initialPhone)
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'buyer' | 'provider'>('buyer')
  const [isLoading, setIsLoading] = useState(false)
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showTerms, setShowTerms] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [smsStatus, setSmsStatus] = useState<{ sent?: boolean; error?: string } | null>(null)


  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Step 1: Check phone and send OTP
  const handleSendOtp = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    setSmsStatus(null)

    if (!phone || phone.length < 10) {
      setError(language === 'hi' ? '10 अंकों का फोन नंबर दर्ज करें' : 'Enter a valid 10-digit phone number')
      return
    }

    setIsLoading(true)
    try {
      // First check if phone exists
      const checkResponse = await authApi.checkPhone(phone)

      if (checkResponse.exists) {
        setError(language === 'hi'
          ? 'यह नंबर पहले से पंजीकृत है। कृपया लॉगिन करें।'
          : 'This number is already registered. Please login instead.')
        return
      }

      // Send OTP for registration
      const response = await authApi.sendOtp(phone, 'register')
      logger.info('RegisterPage', 'OTP API response', { response })
      toast.success(language === 'hi' ? 'OTP भेजा गया!' : 'OTP sent successfully!')
      setStep('otp')

      // Set 30 second cooldown
      setResendCooldown(response.cooldown || 30)

      // Show OTP in dev mode
      if (response.otp) {
        setDevOtp(response.otp)
        logger.info('RegisterPage', 'Dev OTP received', { otp: response.otp })
      }

      // Store SMS status for debugging
      if (response.dev_mode) {
        setSmsStatus({
          sent: response.sms_sent,
          error: response.sms_error
        })
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP'
      logger.error('RegisterPage', 'Failed to send OTP', { error: err })

      // Check for specific error
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string; message?: string } } }
        if (axiosError.response?.data?.error === 'phone_already_registered') {
          setError(language === 'hi'
            ? 'यह नंबर पहले से पंजीकृत है। कृपया लॉगिन करें।'
            : 'This number is already registered. Please login instead.')
          return
        }
        if (axiosError.response?.data?.message) {
          setError(axiosError.response.data.message)
          return
        }
      }

      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [phone, language])

  // Step 2: Verify OTP
  const handleVerifyOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp || otp.length !== 6) {
      setError(language === 'hi' ? '6 अंकों का OTP दर्ज करें' : 'Enter a valid 6-digit OTP')
      return
    }

    // Move to details step (OTP will be verified during registration)
    setStep('details')
    setError(null)
  }, [otp, language])

  // Step 3: Complete registration
  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError(language === 'hi' ? 'कृपया अपना नाम दर्ज करें' : 'Please enter your name')
      return
    }

    // Both buyers and providers must accept terms
    if (!termsAccepted) {
      setShowTerms(true)
      return
    }

    setIsLoading(true)
    try {
      const response = await authApi.register({
        phone,
        otp,
        name: name.trim(),
        email: email.trim() || undefined,
        role,
      })

      login(response.token, response.user)
      analytics.signup()
      logger.info('RegisterPage', 'User registered successfully', { userId: response.user_id, role })

      toast.success(language === 'hi' ? 'खाता सफलतापूर्वक बनाया गया!' : 'Account created successfully!')

      // Redirect based on role
      if (role === 'provider') {
        navigate('/provider-onboarding')
      } else {
        navigate(from)
      }
    } catch (err: unknown) {
      logger.error('RegisterPage', 'Registration failed', { error: err })

      // Handle specific errors
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string; message?: string } } }
        const errorCode = axiosError.response?.data?.error

        if (errorCode === 'invalid_otp' || errorCode === 'otp_expired') {
          setError(language === 'hi' ? 'OTP अमान्य या समाप्त हो गया। कृपया पुनः प्रयास करें।' : 'OTP invalid or expired. Please try again.')
          setStep('phone')
          setOtp('')
          return
        }
        if (errorCode === 'phone_already_registered') {
          setError(language === 'hi' ? 'यह नंबर पहले से पंजीकृत है।' : 'This phone number is already registered.')
          return
        }
      }

      setError(language === 'hi' ? 'पंजीकरण विफल। कृपया पुनः प्रयास करें।' : 'Registration failed. Please try again.')
      toast.error(language === 'hi' ? 'पंजीकरण विफल' : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }, [phone, otp, name, email, role, termsAccepted, login, navigate, from, language])

  const handleTermsAccept = () => {
    setTermsAccepted(true)
    setShowTerms(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-50 flex items-center justify-center px-4 py-8">
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
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Logo size="xl" variant="full" />
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {['phone', 'otp', 'details'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s
                    ? 'bg-primary-500 text-white'
                    : i < ['phone', 'otp', 'details'].indexOf(step)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && (
                <div
                  className={`w-12 h-1 mx-1 rounded ${
                    i < ['phone', 'otp', 'details'].indexOf(step) ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Phone Number */}
            {step === 'phone' && (
              <motion.form
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOtp}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {language === 'hi' ? 'नया खाता बनाएं' : 'Create New Account'}
                </h2>
                <p className="text-gray-600 text-sm mb-6">
                  {language === 'hi'
                    ? 'अपना मोबाइल नंबर दर्ज करें'
                    : 'Enter your mobile number to get started'}
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Role Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'hi' ? 'मैं हूं' : 'I am a'}
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
                      <p className="font-medium text-sm">{language === 'hi' ? 'भोजन प्रेमी' : 'Food Lover'}</p>
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
                      <p className="font-medium text-sm">{language === 'hi' ? 'भोजन प्रदाता' : 'Food Provider'}</p>
                    </button>
                  </div>
                </div>

                {/* Phone Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <PhoneIcon className="w-4 h-4 inline mr-1" />
                    {language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder={language === 'hi' ? '10 अंकों का नंबर' : '10-digit number'}
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
                    : (language === 'hi' ? 'OTP भेजें' : 'Send OTP')}
                </button>

                <p className="mt-4 text-center text-sm text-gray-600">
                  {language === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
                  <Link to="/login" className="text-primary-600 font-medium hover:underline">
                    {language === 'hi' ? 'लॉगिन करें' : 'Login'}
                  </Link>
                </p>
              </motion.form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 'otp' && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {language === 'hi' ? 'OTP सत्यापित करें' : 'Verify OTP'}
                </h2>
                <p className="text-gray-600 text-sm mb-6">
                  {language === 'hi'
                    ? `+91 ${phone} पर भेजा गया 6 अंकों का OTP दर्ज करें`
                    : `Enter the 6-digit OTP sent to +91 ${phone}`}
                </p>

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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ShieldCheckIcon className="w-4 h-4 inline mr-1" />
                    {language === 'hi' ? 'OTP कोड' : 'OTP Code'}
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setOtp(''); setError(null); setDevOtp(null); setSmsStatus(null); }}
                    className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    {language === 'hi' ? 'वापस' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="flex-1 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {language === 'hi' ? 'आगे बढ़ें' : 'Continue'}
                  </button>
                </div>

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

            {/* Step 3: User Details */}
            {step === 'details' && (
              <motion.form
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {language === 'hi' ? 'अपनी जानकारी दर्ज करें' : 'Enter Your Details'}
                </h2>
                <p className="text-gray-600 text-sm mb-6">
                  {language === 'hi'
                    ? 'कृपया अपनी जानकारी भरें'
                    : 'Please fill in your information'}
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Name Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <UserIcon className="w-4 h-4 inline mr-1" />
                    {language === 'hi' ? 'पूरा नाम' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={language === 'hi' ? 'अपना नाम दर्ज करें' : 'Enter your name'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                {/* Email Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                    {language === 'hi' ? 'ईमेल' : 'Email'} ({language === 'hi' ? 'वैकल्पिक' : 'optional'})
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={language === 'hi' ? 'your@email.com' : 'your@email.com'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Terms for Provider */}
                {role === 'provider' && (
                  <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">
                        {language === 'hi'
                          ? 'मैं '
                          : 'I accept the '}
                        <button
                          type="button"
                          onClick={() => setShowTerms(true)}
                          className="text-primary-600 font-medium hover:underline"
                        >
                          {language === 'hi' ? 'नियम और शर्तें' : 'Terms & Conditions'}
                        </button>
                        {language === 'hi' ? ' स्वीकार करता/करती हूं' : ''}
                      </span>
                    </label>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep('otp'); setError(null); }}
                    className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    {language === 'hi' ? 'वापस' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !name.trim() || !termsAccepted}
                    className="flex-1 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading
                      ? (language === 'hi' ? 'पंजीकरण हो रहा है...' : 'Registering...')
                      : (language === 'hi' ? 'पंजीकरण करें' : 'Register')}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Terms Modal */}
      <TermsModal
        isOpen={showTerms}
        onAccept={handleTermsAccept}
        onClose={() => setShowTerms(false)}
        userType={role}
      />
    </div>
  )
}
