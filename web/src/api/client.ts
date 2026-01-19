import axios, { AxiosError, AxiosInstance } from 'axios'
import { useAuthStore } from '../store/authStore'
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
} from './mockApi'

const API_BASE_URL = '/v1'

// Enable mock mode when backend is not available
// Set to true for development without backend, false to use real API
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ==================== AUTH API ====================
export const authApi = {
  sendOtp: async (phone: string): Promise<OtpResponse> => {
    if (USE_MOCK_API) return mockAuthApi.sendOtp(phone)
    const { data } = await api.post('/auth/send-otp', { phone })
    return data
  },

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

export default api
