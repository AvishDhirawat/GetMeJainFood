import { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { authApi, userApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { logger } from '../utils/logger'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [role, setRole] = useState<'buyer' | 'provider'>('buyer')
  const [isLoading, setIsLoading] = useState(false)
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: string })?.from || '/'

  const handleSendOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setError(null)

    logger.info('LoginPage', 'Attempting to send OTP', { phone: phone.slice(0, 4) + '****' })

    if (!phone || phone.length < 10) {
      const errorMsg = 'Please enter a valid phone number'
      setError(errorMsg)
      toast.error(errorMsg)
      logger.warn('LoginPage', 'Invalid phone number', { phoneLength: phone.length })
      return
    }

    setIsLoading(true)
    try {
      const response = await authApi.sendOtp(phone)
      logger.info('LoginPage', 'OTP sent successfully', { hasDevOtp: !!response.otp })
      toast.success('OTP sent successfully!')
      setStep('otp')
      // In development, show OTP for testing
      if (response.otp) {
        setDevOtp(response.otp)
        logger.debug('LoginPage', 'Dev OTP received', { otp: response.otp })
      }
    } catch (err) {
      const errorMsg = 'Failed to send OTP. Please try again.'
      setError(errorMsg)
      toast.error(errorMsg)
      logger.error('LoginPage', 'Failed to send OTP', err)
    } finally {
      setIsLoading(false)
    }
  }, [phone])

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    setIsLoading(true)
    try {
      const response = await authApi.verifyOtp(phone, otp, role)
      const user = await userApi.getMe()
      login(response.token, user)
      toast.success(response.is_new ? 'Account created successfully!' : 'Welcome back!')

      // Redirect based on role
      if (role === 'provider' && response.is_new) {
        navigate('/provider-onboarding')
      } else if (user.role === 'provider') {
        navigate('/provider/dashboard')
      } else {
        navigate(from)
      }
    } catch {
      toast.error('Invalid OTP. Please try again.')
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
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🌿</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">JainFood</h1>
          <p className="text-gray-600 mt-2">Pure Jain Food Delivery</p>
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
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Login or Sign up</h2>

                {/* Error Display */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Role Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
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
                      <span className="text-2xl mb-1">🍽️</span>
                      <p className="font-medium">Food Lover</p>
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
                      <span className="text-2xl mb-1">👨‍🍳</span>
                      <p className="font-medium">Food Provider</p>
                    </button>
                  </div>
                </div>

                {/* Phone Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter 10-digit number"
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
                  {isLoading ? 'Sending OTP...' : 'Continue'}
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
                  ← Back
                </button>

                <h2 className="text-xl font-semibold text-gray-900 mb-2">Verify OTP</h2>
                <p className="text-gray-600 mb-6">
                  Enter the 6-digit code sent to +91 {phone}
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
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    maxLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Login'}
                </button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full mt-3 text-primary-600 hover:text-primary-700"
                >
                  Resend OTP
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Terms */}
        <p className="text-center text-sm text-gray-500 mt-6">
          By continuing, you agree to our{' '}
          <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
        </p>
      </motion.div>
    </div>
  )
}
