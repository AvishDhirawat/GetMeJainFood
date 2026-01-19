// User types
export interface User {
  id: string
  phone: string
  name: string
  email: string
  role: 'buyer' | 'provider' | 'admin'
  preferences: UserPreferences | null
  created_at: string
}

export interface UserPreferences {
  jain_strict?: boolean
  no_root_veggies?: boolean
  sattvic_only?: boolean
  notifications_enabled?: boolean
}

// Provider types
export interface Provider {
  id: string
  user_id: string
  business_name: string
  address: string
  lat: number
  lng: number
  verified: boolean
  tags: string[]
  rating: number
  created_at: string
  // Extended fields from search
  distance_meters?: number
  image_url?: string
  delivery_time?: string
  price_range?: string
}

// Menu types
export interface Menu {
  id: string
  provider_id: string
  name: string
  description: string
  created_at: string
  items?: MenuItem[]
}

export interface MenuItem {
  id: string
  menu_id: string
  name: string
  price: number
  ingredients: string[]
  is_jain: boolean
  availability: boolean
  image_url: string
  created_at: string
  // Extended fields
  description?: string
  provider_id?: string
  provider_name?: string
  provider_distance_meters?: number
}

// Order types
export interface Order {
  id: string
  order_code: string
  buyer_id: string
  provider_id: string
  items: OrderItem[]
  total_estimate: number
  status: OrderStatus
  created_at: string
  // Extended fields
  provider?: Provider
  delivery_address?: string
}

export interface OrderItem {
  item_id: string
  name: string
  qty: number
  price: number
}

export type OrderStatus =
  | 'CREATED'
  | 'PENDING_PROVIDER_ACK'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'

// Cart types
export interface CartItem {
  item: MenuItem
  quantity: number
  providerId: string
  providerName: string
}

// Chat types
export interface Chat {
  id: string
  order_id: string
  participants: string[]
  created_at: string
}

export interface ChatMessage {
  id: string
  chat_id: string
  sender_id: string
  content: string
  meta: Record<string, unknown> | null
  created_at: string
}

// Search types
export interface SearchFilters {
  lat: number
  lng: number
  radius?: number
  tags?: string[]
  min_rating?: number
  jain_only?: boolean
  available_only?: boolean
  q?: string
  price_max?: number
}

export interface ProviderSearchResult extends Provider {
  distance_meters: number
}

export interface ItemSearchResult extends MenuItem {
  provider_id: string
  provider_name: string
  provider_distance_meters: number
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface AuthResponse {
  message: string
  token: string
  user_id: string
  is_new: boolean
}

export interface OtpResponse {
  message: string
  otp?: string // Only in development
}

// Jain dietary tags
export const JAIN_TAGS = {
  sattvic: 'Sattvic',
  'no-root-veggies': 'No Root Vegetables',
  'no-onion-garlic': 'No Onion/Garlic',
  'home-cook': 'Home Cook',
  'cloud-kitchen': 'Cloud Kitchen',
  hotel: 'Hotel',
  'pure-jain': 'Pure Jain',
} as const

export type JainTag = keyof typeof JAIN_TAGS

// Constants
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: 'Order Placed',
  PENDING_PROVIDER_ACK: 'Awaiting Confirmation',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Delivered',
  CANCELLED: 'Cancelled',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  CREATED: 'bg-yellow-100 text-yellow-800',
  PENDING_PROVIDER_ACK: 'bg-orange-100 text-orange-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}
