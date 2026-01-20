import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'
import { logger } from '../utils/logger'
import type {
  User,
  Provider,
  Menu,
  MenuItem,
  Order,
  Chat,
  ChatMessage,
  AuthResponse,
  OtpResponse,
  ProviderSearchResult,
  ItemSearchResult,
  Review,
} from '../types'

// Import mock APIs for development mode
import {
  mockAuthApi,
  mockUserApi,
  mockProviderApi,
  mockMenuApi,
  mockMenuItemApi,
  mockSearchApi,
  mockOrderApi,
  mockChatApi,
  mockMediaApi,
  mockReviewApi,
} from './mockApi'

// API URL configuration for different environments
// In production, set VITE_API_URL to your backend URL (e.g., https://jainfood-api.onrender.com)
const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/v1`
  : '/v1'

// Enable mock mode when backend is not available
// Set to true for development without backend, false to use real API
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

logger.info('ApiClient', 'Initialized', { mockMode: USE_MOCK_API, baseUrl: API_BASE_URL })

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
})

// Request interceptor - add auth token and logging
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Add request ID for tracking
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  config.headers['X-Request-ID'] = requestId

  logger.debug('ApiClient', `Request: ${config.method?.toUpperCase()} ${config.url}`, {
    requestId,
    params: config.params,
    hasAuth: !!token,
  })

  return config
})

// Response interceptor - handle errors and logging
api.interceptors.response.use(
  (response) => {
    logger.debug('ApiClient', `Response: ${response.status} ${response.config.url}`, {
      requestId: response.config.headers['X-Request-ID'],
      status: response.status,
    })
    return response
  },
  (error: AxiosError) => {
    const requestId = error.config?.headers?.['X-Request-ID']

    logger.error('ApiClient', `Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      requestId,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    })

    if (error.response?.status === 401) {
      logger.warn('ApiClient', 'Unauthorized - logging out user')
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ==================== AUTH API ====================
export interface CheckPhoneResponse {
  exists: boolean
  can_login: boolean
  can_register: boolean
}

export interface RegisterRequest {
  phone: string
  otp: string
  name: string
  email?: string
  role?: 'buyer' | 'provider'
}

export interface RegisterResponse {
  message: string
  token: string
  user_id: string
  user: User
}

export interface LoginRequest {
  phone: string
  otp: string
}

export interface LoginResponse {
  message: string
  token: string
  user_id: string
  user: User
}

export const authApi = {
  // Check if phone number is registered
  checkPhone: async (phone: string): Promise<CheckPhoneResponse> => {
    if (USE_MOCK_API) {
      // Mock: treat any phone starting with '9999' as existing
      const exists = phone.startsWith('9999')
      return { exists, can_login: exists, can_register: !exists }
    }
    const { data } = await api.post('/auth/check-phone', { phone })
    return data
  },

  // Send OTP (for both login and registration)
  sendOtp: async (phone: string, purpose?: 'login' | 'register'): Promise<OtpResponse> => {
    if (USE_MOCK_API) return mockAuthApi.sendOtp(phone)
    const { data } = await api.post('/auth/send-otp', { phone, purpose })
    return data
  },

  // Register new user
  register: async (request: RegisterRequest): Promise<RegisterResponse> => {
    if (USE_MOCK_API) {
      const response = await mockAuthApi.verifyOtp(request.phone, request.otp, request.role)
      return {
        message: 'registration_success',
        token: response.token,
        user_id: response.user_id,
        user: {
          id: response.user_id,
          phone: request.phone,
          name: request.name,
          email: request.email || '',
          role: request.role || 'buyer',
          preferences: null,
          language: 'en',
          blocked: false,
          created_at: new Date().toISOString(),
        },
      }
    }
    const { data } = await api.post('/auth/register', request)
    return data
  },

  // Login existing user
  login: async (request: LoginRequest): Promise<LoginResponse> => {
    if (USE_MOCK_API) {
      const response = await mockAuthApi.verifyOtp(request.phone, request.otp)
      return {
        message: 'login_success',
        token: response.token,
        user_id: response.user_id,
        user: {
          id: response.user_id,
          phone: request.phone,
          name: 'Test User',
          email: '',
          role: 'buyer',
          preferences: null,
          language: 'en',
          blocked: false,
          created_at: new Date().toISOString(),
        },
      }
    }
    const { data } = await api.post('/auth/login', request)
    return data
  },

  // Legacy: verify OTP (for backward compatibility)
  verifyOtp: async (phone: string, otp: string, role?: string): Promise<AuthResponse> => {
    if (USE_MOCK_API) return mockAuthApi.verifyOtp(phone, otp, role)
    const { data } = await api.post('/auth/verify-otp', { phone, otp, role })
    return data
  },
}

// ==================== USER API ====================
export const userApi = {
  getMe: async (): Promise<User> => {
    if (USE_MOCK_API) return mockUserApi.getMe()
    const { data } = await api.get('/users/me')
    return data
  },

  updateMe: async (updates: { name?: string; email?: string; preferences?: Record<string, unknown> }): Promise<void> => {
    if (USE_MOCK_API) return mockUserApi.updateMe(updates)
    await api.put('/users/me', updates)
  },

  deleteMe: async (): Promise<void> => {
    if (USE_MOCK_API) return mockUserApi.deleteMe()
    await api.delete('/users/me')
  },
}

// ==================== PROVIDER API ====================
export const providerApi = {
  getById: async (id: string): Promise<Provider> => {
    if (USE_MOCK_API) return mockProviderApi.getById(id)
    const { data } = await api.get(`/providers/${id}`)
    return data
  },

  list: async (limit = 20, offset = 0): Promise<Provider[]> => {
    if (USE_MOCK_API) return mockProviderApi.list(limit, offset)
    const { data } = await api.get('/providers', { params: { limit, offset } })
    return data || []
  },

  create: async (provider: {
    business_name: string
    address: string
    lat: number
    lng: number
    tags?: string[]
  }): Promise<Provider> => {
    if (USE_MOCK_API) return mockProviderApi.create(provider)
    const { data } = await api.post('/providers', provider)
    return data
  },

  update: async (id: string, provider: Partial<Provider>): Promise<void> => {
    if (USE_MOCK_API) return mockProviderApi.update(id, provider)
    await api.put(`/providers/${id}`, provider)
  },

  verify: async (id: string, verified: boolean): Promise<void> => {
    if (USE_MOCK_API) return mockProviderApi.verify(id, verified)
    await api.post(`/providers/${id}/verify`, { verified })
  },
}

// ==================== MENU API ====================
export const menuApi = {
  getById: async (id: string): Promise<Menu> => {
    if (USE_MOCK_API) return mockMenuApi.getById(id)
    const { data } = await api.get(`/menus/${id}`)
    return data
  },

  getByProvider: async (providerId: string): Promise<Menu[]> => {
    if (USE_MOCK_API) return mockMenuApi.getByProvider(providerId)
    const { data } = await api.get(`/menus/provider/${providerId}`)
    return data || []
  },

  create: async (menu: { provider_id: string; name: string; description?: string }): Promise<Menu> => {
    if (USE_MOCK_API) return mockMenuApi.create(menu)
    const { data } = await api.post('/menus', menu)
    return data
  },

  update: async (id: string, menu: { name?: string; description?: string }): Promise<void> => {
    if (USE_MOCK_API) return mockMenuApi.update(id, menu)
    await api.put(`/menus/${id}`, menu)
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK_API) return mockMenuApi.delete(id)
    await api.delete(`/menus/${id}`)
  },
}

// ==================== MENU ITEM API ====================
export const menuItemApi = {
  getById: async (id: string): Promise<MenuItem> => {
    if (USE_MOCK_API) return mockMenuItemApi.getById(id)
    const { data } = await api.get(`/menu-items/${id}`)
    return data
  },

  getByMenu: async (menuId: string): Promise<MenuItem[]> => {
    if (USE_MOCK_API) return mockMenuItemApi.getByMenu(menuId)
    const { data } = await api.get(`/menu-items/menu/${menuId}`)
    return data || []
  },

  create: async (item: {
    menu_id: string
    name: string
    price: number
    ingredients?: string[]
    is_jain?: boolean
    availability?: boolean
    image_url?: string
  }): Promise<MenuItem> => {
    if (USE_MOCK_API) return mockMenuItemApi.create(item)
    const { data } = await api.post('/menu-items', item)
    return data
  },

  update: async (id: string, item: Partial<MenuItem>): Promise<void> => {
    if (USE_MOCK_API) return mockMenuItemApi.update(id, item)
    await api.put(`/menu-items/${id}`, item)
  },

  toggleAvailability: async (id: string, available: boolean): Promise<void> => {
    if (USE_MOCK_API) return mockMenuItemApi.toggleAvailability(id, available)
    await api.patch(`/menu-items/${id}/availability`, { available })
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK_API) return mockMenuItemApi.delete(id)
    await api.delete(`/menu-items/${id}`)
  },
}

// ==================== SEARCH API ====================
export const searchApi = {
  providers: async (params: {
    lat: number
    lng: number
    radius?: number
    tags?: string[]
    min_rating?: number
    provider_category?: string
    limit?: number
    offset?: number
  }): Promise<ProviderSearchResult[]> => {
    if (USE_MOCK_API) return mockSearchApi.providers(params)
    const { data } = await api.get('/search/providers', {
      params: {
        ...params,
        tags: params.tags?.join(','),
      },
    })
    return data || []
  },

  items: async (params: {
    lat: number
    lng: number
    radius?: number
    q?: string
    jain_only?: boolean
    available_only?: boolean
    tags?: string[]
    min_rating?: number
    price_max?: number
    limit?: number
    offset?: number
  }): Promise<ItemSearchResult[]> => {
    if (USE_MOCK_API) return mockSearchApi.items(params)
    const { data } = await api.get('/search/items', {
      params: {
        ...params,
        tags: params.tags?.join(','),
      },
    })
    return data || []
  },
}

// ==================== ORDER API ====================
export const orderApi = {
  create: async (order: {
    provider_id: string
    items: Array<{ item_id: string; name: string; qty: number; price: number }>
    total: number
  }): Promise<{ order_id: string; order_code: string; otp?: string }> => {
    if (USE_MOCK_API) return mockOrderApi.create(order)
    const { data } = await api.post('/orders', order)
    return data
  },

  getById: async (id: string): Promise<Order> => {
    if (USE_MOCK_API) return mockOrderApi.getById(id)
    const { data } = await api.get(`/orders/${id}`)
    return data
  },

  getByCode: async (code: string): Promise<{ order_id: string; order_code: string }> => {
    if (USE_MOCK_API) return mockOrderApi.getByCode(code)
    const { data } = await api.get(`/orders/code/${code}`)
    return data
  },

  getMyOrders: async (): Promise<Order[]> => {
    if (USE_MOCK_API) return mockOrderApi.getMyOrders()
    const { data } = await api.get('/orders/my')
    return data || []
  },

  getProviderOrders: async (providerId: string): Promise<Order[]> => {
    if (USE_MOCK_API) return mockOrderApi.getProviderOrders(providerId)
    const { data } = await api.get(`/orders/provider/${providerId}`)
    return data || []
  },

  confirmOtp: async (orderId: string, otp: string): Promise<void> => {
    if (USE_MOCK_API) return mockOrderApi.confirmOtp(orderId, otp)
    await api.post(`/orders/${orderId}/confirm-otp`, { otp })
  },

  cancel: async (orderId: string): Promise<void> => {
    if (USE_MOCK_API) return mockOrderApi.cancel(orderId)
    await api.post(`/orders/${orderId}/cancel`)
  },

  complete: async (orderId: string): Promise<void> => {
    if (USE_MOCK_API) return mockOrderApi.complete(orderId)
    await api.post(`/orders/${orderId}/complete`)
  },
}

// ==================== CHAT API ====================
export const chatApi = {
  create: async (orderID: string, participants: string[]): Promise<Chat> => {
    if (USE_MOCK_API) return mockChatApi.create(orderID, participants)
    const { data } = await api.post('/chat', { order_id: orderID, participants })
    return data
  },

  getByOrder: async (orderId: string): Promise<Chat> => {
    if (USE_MOCK_API) return mockChatApi.getByOrder(orderId)
    const { data } = await api.get(`/chat/order/${orderId}`)
    return data
  },

  getMessages: async (chatId: string, limit = 50, offset = 0): Promise<ChatMessage[]> => {
    if (USE_MOCK_API) return mockChatApi.getMessages(chatId, limit, offset)
    const { data } = await api.get(`/chat/${chatId}/messages`, { params: { limit, offset } })
    return data || []
  },
}

// ==================== MEDIA API ====================
export const mediaApi = {
  getUploadUrl: async (folder: string, contentType: string, fileName: string): Promise<{
    upload_url: string
    object_key: string
    expires_in_seconds: number
  }> => {
    if (USE_MOCK_API) return mockMediaApi.getUploadUrl(folder, contentType, fileName)
    const { data } = await api.post('/media/upload-url', { folder, content_type: contentType, file_name: fileName })
    return data
  },

  getDownloadUrl: async (objectKey: string): Promise<{ url: string; expires_in_seconds: number }> => {
    if (USE_MOCK_API) return mockMediaApi.getDownloadUrl(objectKey)
    const { data } = await api.post('/media/download-url', { object_key: objectKey })
    return data
  },
}

// ==================== REVIEW API ====================
export const reviewApi = {
  getByProvider: async (providerId: string, limit = 20, offset = 0): Promise<Review[]> => {
    if (USE_MOCK_API) return mockReviewApi.getByProvider(providerId, limit, offset)
    const { data } = await api.get(`/reviews/provider/${providerId}`, { params: { limit, offset } })
    return data || []
  },

  getStats: async (providerId: string): Promise<{
    average_rating: number
    total_reviews: number
    rating_counts: { [key: string]: number }
  }> => {
    if (USE_MOCK_API) return mockReviewApi.getStats(providerId)
    const { data } = await api.get(`/reviews/provider/${providerId}/stats`)
    return data
  },

  create: async (review: {
    provider_id: string
    order_id?: string
    rating: number
    comment: string
    photo_urls?: string[]
  }): Promise<Review> => {
    if (USE_MOCK_API) return mockReviewApi.create(review)
    const { data } = await api.post('/reviews', review)
    return data
  },

  getMyReviews: async (limit = 20, offset = 0): Promise<Review[]> => {
    if (USE_MOCK_API) return mockReviewApi.getMyReviews(limit, offset)
    const { data } = await api.get('/reviews/my', { params: { limit, offset } })
    return data || []
  },

  delete: async (reviewId: string): Promise<void> => {
    if (USE_MOCK_API) return mockReviewApi.delete(reviewId)
    await api.delete(`/reviews/${reviewId}`)
  },
}

// ==================== PAYMENT API (Razorpay) ====================
export interface RazorpayOrderResponse {
  razorpay_order_id: string
  amount: number
  currency: string
  key_id: string
}

export interface PaymentVerifyRequest {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  order_id: string
}

export const paymentApi = {
  // Create a Razorpay order
  createOrder: async (orderId: string, amount: number, currency = 'INR'): Promise<RazorpayOrderResponse> => {
    if (USE_MOCK_API) {
      // Mock response for development
      return {
        razorpay_order_id: 'order_mock_' + Date.now(),
        amount: amount,
        currency: currency,
        key_id: 'rzp_test_mock',
      }
    }
    const { data } = await api.post('/payments/create-order', {
      order_id: orderId,
      amount: amount, // Amount in paise
      currency: currency,
    })
    return data
  },

  // Verify payment after Razorpay checkout
  verifyPayment: async (request: PaymentVerifyRequest): Promise<{ message: string; payment_id: string }> => {
    if (USE_MOCK_API) {
      return { message: 'payment verified', payment_id: 'pay_mock_' + Date.now() }
    }
    const { data } = await api.post('/payments/verify', request)
    return data
  },

  // Get payment details
  getPaymentDetails: async (paymentId: string): Promise<{
    id: string
    amount: number
    currency: string
    status: string
    method: string
  }> => {
    if (USE_MOCK_API) {
      return {
        id: paymentId,
        amount: 10000,
        currency: 'INR',
        status: 'captured',
        method: 'upi',
      }
    }
    const { data } = await api.get(`/payments/${paymentId}`)
    return data
  },
}

// ==================== RAZORPAY CHECKOUT HELPER ====================
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  theme?: {
    color?: string
  }
  modal?: {
    ondismiss?: () => void
  }
}

interface RazorpayInstance {
  open: () => void
  close: () => void
}

interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

// Helper function to initiate Razorpay checkout
export const initiateRazorpayCheckout = async (
  orderId: string,
  amountInPaise: number,
  userName: string,
  userPhone: string,
  userEmail: string,
  onSuccess: (paymentId: string) => void,
  onFailure: (error: string) => void
): Promise<void> => {
  try {
    // Create order on backend
    const orderResponse = await paymentApi.createOrder(orderId, amountInPaise)

    // Check if Razorpay is loaded
    if (!window.Razorpay) {
      throw new Error('Razorpay SDK not loaded. Add <script src="https://checkout.razorpay.com/v1/checkout.js"></script> to your HTML.')
    }

    const options: RazorpayOptions = {
      key: orderResponse.key_id,
      amount: orderResponse.amount,
      currency: orderResponse.currency,
      name: 'JainFood',
      description: `Order #${orderId}`,
      order_id: orderResponse.razorpay_order_id,
      handler: async (response: RazorpayResponse) => {
        try {
          // Verify payment on backend
          const verifyResponse = await paymentApi.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            order_id: orderId,
          })
          onSuccess(verifyResponse.payment_id)
        } catch (err) {
          onFailure('Payment verification failed')
        }
      },
      prefill: {
        name: userName,
        contact: userPhone,
        email: userEmail,
      },
      theme: {
        color: '#f97316', // Primary orange color
      },
      modal: {
        ondismiss: () => {
          onFailure('Payment cancelled by user')
        },
      },
    }

    const razorpay = new window.Razorpay(options)
    razorpay.open()
  } catch (err) {
    onFailure(err instanceof Error ? err.message : 'Failed to initiate payment')
  }
}

export default api
