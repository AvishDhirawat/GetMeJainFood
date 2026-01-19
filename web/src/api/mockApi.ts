// Mock API service for development without backend
import type {
  User,
  Provider,
  Menu,
  MenuItem,
  Order,
  OrderStatus,
  AuthResponse,
  OtpResponse,
  ProviderSearchResult,
  ItemSearchResult,
  Chat,
  ChatMessage,
} from '../types'

import {
  mockProviders,
  mockMenus,
  mockMenuItems,
  mockOrders,
  mockUser,
  mockProviderUser,
  generateOrderCode,
  generateOTP,
} from './mockData'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

let currentUser: User | null = null
let currentToken: string | null = null
let orders: Order[] = [...mockOrders]
let providers: ProviderSearchResult[] = [...mockProviders]
const menus: Record<string, Menu[]> = { ...mockMenus }
let menuItems: Record<string, MenuItem[]> = { ...mockMenuItems }
let otpStore: Record<string, string> = {}
const chats: Chat[] = []
const messages: ChatMessage[] = []

export const mockAuthApi = {
  sendOtp: async (phone: string): Promise<OtpResponse> => {
    await delay(500)
    const otp = generateOTP()
    otpStore[phone] = otp
    return { message: 'otp_sent', otp }
  },

  verifyOtp: async (phone: string, otp: string, role?: string): Promise<AuthResponse> => {
    await delay(500)
    const isValid = otp.length === 6 || otpStore[phone] === otp
    if (!isValid) throw new Error('Invalid OTP')

    const isNew = !currentUser
    const userRole = role || 'buyer'
    currentUser = userRole === 'provider' ? { ...mockProviderUser, phone } : { ...mockUser, phone }
    currentToken = 'mock-jwt-token-' + Date.now()
    delete otpStore[phone]

    return { message: isNew ? 'user_created' : 'login_success', token: currentToken, user_id: currentUser.id, is_new: isNew }
  },
}

export const mockUserApi = {
  getMe: async (): Promise<User> => {
    await delay(200)
    if (!currentUser) throw new Error('Not authenticated')
    return currentUser
  },
  updateMe: async (updates: Partial<User>): Promise<void> => {
    await delay(300)
    if (currentUser) currentUser = { ...currentUser, ...updates }
  },
  deleteMe: async (): Promise<void> => {
    await delay(300)
    currentUser = null
    currentToken = null
  },
}

export const mockProviderApi = {
  getById: async (id: string): Promise<Provider> => {
    await delay(300)
    const p = providers.find(p => p.id === id)
    if (!p) throw new Error('Provider not found')
    return p
  },
  list: async (limit = 20, offset = 0): Promise<Provider[]> => {
    await delay(300)
    return providers.slice(offset, offset + limit)
  },
  create: async (provider: { business_name: string; address: string; lat: number; lng: number; tags?: string[] }): Promise<Provider> => {
    await delay(500)
    const newP: ProviderSearchResult = {
      id: 'prov-' + Date.now(), user_id: currentUser?.id || 'unknown', business_name: provider.business_name,
      address: provider.address, lat: provider.lat, lng: provider.lng, verified: false, tags: provider.tags || [],
      rating: 0, created_at: new Date().toISOString(), distance_meters: 0,
    }
    providers.push(newP)
    if (currentUser) currentUser = { ...currentUser, role: 'provider' }
    return newP
  },
  update: async (id: string, updates: Partial<Provider>): Promise<void> => {
    await delay(300)
    const i = providers.findIndex(p => p.id === id)
    if (i !== -1) providers[i] = { ...providers[i], ...updates }
  },
  verify: async (id: string, verified: boolean): Promise<void> => {
    await delay(300)
    const i = providers.findIndex(p => p.id === id)
    if (i !== -1) providers[i] = { ...providers[i], verified }
  },
}

export const mockMenuApi = {
  getById: async (id: string): Promise<Menu> => {
    await delay(200)
    for (const m of Object.values(menus)) { const found = m.find(x => x.id === id); if (found) return found }
    throw new Error('Menu not found')
  },
  getByProvider: async (providerId: string): Promise<Menu[]> => {
    await delay(300)
    return menus[providerId] || []
  },
  create: async (menu: { provider_id: string; name: string; description?: string }): Promise<Menu> => {
    await delay(400)
    const newM: Menu = { id: 'menu-' + Date.now(), provider_id: menu.provider_id, name: menu.name, description: menu.description || '', created_at: new Date().toISOString() }
    if (!menus[menu.provider_id]) menus[menu.provider_id] = []
    menus[menu.provider_id].push(newM)
    return newM
  },
  update: async (id: string, updates: { name?: string; description?: string }): Promise<void> => {
    await delay(300)
    for (const pId in menus) { const i = menus[pId].findIndex(m => m.id === id); if (i !== -1) { menus[pId][i] = { ...menus[pId][i], ...updates }; break } }
  },
  delete: async (id: string): Promise<void> => {
    await delay(300)
    for (const pId in menus) menus[pId] = menus[pId].filter(m => m.id !== id)
  },
}

export const mockMenuItemApi = {
  getById: async (id: string): Promise<MenuItem> => {
    await delay(200)
    for (const items of Object.values(menuItems)) { const found = items.find(i => i.id === id); if (found) return found }
    throw new Error('Item not found')
  },
  getByMenu: async (menuId: string): Promise<MenuItem[]> => {
    await delay(300)
    return menuItems[menuId] || []
  },
  create: async (item: { menu_id: string; name: string; price: number; ingredients?: string[]; is_jain?: boolean; availability?: boolean; image_url?: string }): Promise<MenuItem> => {
    await delay(400)
    const newI: MenuItem = { id: 'item-' + Date.now(), menu_id: item.menu_id, name: item.name, price: item.price, ingredients: item.ingredients || [], is_jain: item.is_jain ?? true, availability: item.availability ?? true, image_url: item.image_url || '', created_at: new Date().toISOString() }
    if (!menuItems[item.menu_id]) menuItems[item.menu_id] = []
    menuItems[item.menu_id].push(newI)
    return newI
  },
  update: async (id: string, updates: Partial<MenuItem>): Promise<void> => {
    await delay(300)
    for (const mId in menuItems) { const i = menuItems[mId].findIndex(x => x.id === id); if (i !== -1) { menuItems[mId][i] = { ...menuItems[mId][i], ...updates }; break } }
  },
  toggleAvailability: async (id: string, available: boolean): Promise<void> => {
    await delay(200)
    for (const mId in menuItems) { const i = menuItems[mId].findIndex(x => x.id === id); if (i !== -1) { menuItems[mId][i] = { ...menuItems[mId][i], availability: available }; break } }
  },
  delete: async (id: string): Promise<void> => {
    await delay(300)
    for (const mId in menuItems) menuItems[mId] = menuItems[mId].filter(i => i.id !== id)
  },
}

export const mockSearchApi = {
  providers: async (params: { lat: number; lng: number; radius?: number; tags?: string[]; min_rating?: number; limit?: number; offset?: number }): Promise<ProviderSearchResult[]> => {
    await delay(400)
    let results = [...providers]
    if (params.tags?.length) results = results.filter(p => params.tags!.some(t => p.tags.includes(t)))
    if (params.min_rating && params.min_rating > 0) results = results.filter(p => p.rating >= params.min_rating!)
    results = results.map(p => ({ ...p, distance_meters: Math.floor(Math.random() * (params.radius || 10000)) + 200 }))
    results.sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0))
    return results.slice(params.offset || 0, (params.offset || 0) + (params.limit || 20))
  },
  items: async (params: { lat: number; lng: number; radius?: number; q?: string; jain_only?: boolean; available_only?: boolean; tags?: string[]; price_max?: number; limit?: number; offset?: number }): Promise<ItemSearchResult[]> => {
    await delay(400)
    let allItems: ItemSearchResult[] = []
    for (const p of providers) {
      const pMenus = menus[p.id] || []
      for (const m of pMenus) {
        const items = menuItems[m.id] || []
        for (const item of items) allItems.push({ ...item, provider_id: p.id, provider_name: p.business_name, provider_distance_meters: Math.floor(Math.random() * 5000) + 200 })
      }
    }
    if (params.q) { const q = params.q.toLowerCase(); allItems = allItems.filter(i => i.name.toLowerCase().includes(q) || i.ingredients.some(ing => ing.toLowerCase().includes(q))) }
    if (params.jain_only) allItems = allItems.filter(i => i.is_jain)
    if (params.available_only) allItems = allItems.filter(i => i.availability)
    if (params.price_max && params.price_max > 0) allItems = allItems.filter(i => i.price <= params.price_max!)
    return allItems.slice(params.offset || 0, (params.offset || 0) + (params.limit || 20))
  },
}

export const mockOrderApi = {
  create: async (order: { provider_id: string; items: Array<{ item_id: string; name: string; qty: number; price: number }>; total: number }): Promise<{ order_id: string; order_code: string; otp?: string }> => {
    await delay(600)
    const p = providers.find(x => x.id === order.provider_id)
    const otp = generateOTP()
    const code = generateOrderCode()
    const newO: Order = { id: 'order-' + Date.now(), order_code: code, buyer_id: currentUser?.id || 'guest', provider_id: order.provider_id, items: order.items, total_estimate: order.total, status: 'CREATED', created_at: new Date().toISOString(), provider: p }
    orders.push(newO)
    otpStore[newO.id] = otp
    return { order_id: newO.id, order_code: code, otp }
  },
  getById: async (id: string): Promise<Order> => {
    await delay(200)
    const o = orders.find(x => x.id === id)
    if (!o) throw new Error('Order not found')
    return o
  },
  getByCode: async (code: string): Promise<{ order_id: string; order_code: string }> => {
    await delay(200)
    const o = orders.find(x => x.order_code === code)
    if (!o) throw new Error('Order not found')
    return { order_id: o.id, order_code: o.order_code }
  },
  getMyOrders: async (): Promise<Order[]> => {
    await delay(300)
    return orders.filter(o => o.buyer_id === currentUser?.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },
  getProviderOrders: async (providerId: string): Promise<Order[]> => {
    await delay(300)
    return orders.filter(o => o.provider_id === providerId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },
  confirmOtp: async (orderId: string, otp: string): Promise<void> => {
    await delay(400)
    const o = orders.find(x => x.id === orderId)
    if (!o) throw new Error('Order not found')
    if (otp.length !== 6 && otpStore[orderId] !== otp) throw new Error('Invalid OTP')
    o.status = 'CONFIRMED'
    delete otpStore[orderId]
  },
  cancel: async (orderId: string): Promise<void> => {
    await delay(300)
    const o = orders.find(x => x.id === orderId)
    if (o) o.status = 'CANCELLED'
  },
  complete: async (orderId: string): Promise<void> => {
    await delay(300)
    const o = orders.find(x => x.id === orderId)
    if (o) o.status = 'COMPLETED'
  },
  updateStatus: async (orderId: string, status: OrderStatus): Promise<void> => {
    await delay(300)
    const o = orders.find(x => x.id === orderId)
    if (o) o.status = status
  },
}

export const mockChatApi = {
  create: async (orderID: string, participants: string[]): Promise<Chat> => {
    await delay(300)
    const c: Chat = { id: 'chat-' + Date.now(), order_id: orderID, participants, created_at: new Date().toISOString() }
    chats.push(c)
    return c
  },
  getByOrder: async (orderId: string): Promise<Chat> => {
    await delay(200)
    let c = chats.find(x => x.order_id === orderId)
    if (!c) { c = { id: 'chat-' + Date.now(), order_id: orderId, participants: [currentUser?.id || 'guest'], created_at: new Date().toISOString() }; chats.push(c) }
    return c
  },
  getMessages: async (chatId: string, limit = 50, offset = 0): Promise<ChatMessage[]> => {
    await delay(200)
    return messages.filter(m => m.chat_id === chatId).slice(offset, offset + limit)
  },
  sendMessage: async (chatId: string, content: string): Promise<ChatMessage> => {
    await delay(200)
    const msg: ChatMessage = { id: 'msg-' + Date.now(), chat_id: chatId, sender_id: currentUser?.id || 'guest', content, meta: null, created_at: new Date().toISOString() }
    messages.push(msg)
    return msg
  },
}

export const mockMediaApi = {
  getUploadUrl: async (folder: string, _contentType: string, fileName: string) => {
    await delay(200)
    return { upload_url: 'https://mock-storage.example.com/upload', object_key: `${folder}/${Date.now()}-${fileName}`, expires_in_seconds: 3600 }
  },
  getDownloadUrl: async (objectKey: string) => {
    await delay(200)
    return { url: `https://mock-storage.example.com/${objectKey}`, expires_in_seconds: 3600 }
  },
}

export const resetMockData = () => { currentUser = null; currentToken = null; orders = []; otpStore = {} }
export const getCurrentMockUser = () => currentUser
export const setCurrentMockUser = (user: User | null) => { currentUser = user }
