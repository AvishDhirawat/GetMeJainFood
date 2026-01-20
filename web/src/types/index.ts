 // User types
export interface User {
  id: string
  phone: string
  name: string
  email: string
  role: 'buyer' | 'provider' | 'admin'
  preferences: UserPreferences | null
  language: 'en' | 'hi'
  blocked: boolean
  blocked_reason?: string
  terms_accepted_at?: string
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
  pin_code?: string
  lat: number
  lng: number
  verified: boolean
  aadhar_verified: boolean
  tags: string[]
  provider_category?: ProviderCategory
  food_categories?: FoodCategory[]
  rating: number
  total_ratings: number
  total_orders: number
  available_today: boolean
  external_platforms?: ExternalPlatform[]
  external_app_link?: string
  min_order_quantity: number
  bulk_order_enabled: boolean
  free_delivery_min_price: number
  free_delivery_max_km: number
  is_promoted: boolean
  blocked: boolean
  blocked_reason?: string
  terms_accepted_at?: string
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
  quantity_desc?: string // e.g., "500g", "1 plate"
  ingredients: string[]
  is_jain: boolean
  food_category?: FoodCategory
  availability: boolean
  image_url: string
  document_url?: string
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
  order_type: 'individual' | 'bulk'
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
  provider_id: string
  provider_name: string
}

// Review types
export interface Review {
  id: string
  provider_id: string
  user_id: string
  order_id?: string
  rating: number // 1-5
  comment: string
  photo_urls?: string[]
  created_at: string
  // Extended
  user_name?: string
}

// Offer types
export interface Offer {
  id: string
  provider_id: string
  title: string
  description?: string
  discount_pct?: number
  discount_amt?: number
  min_order?: number
  valid_from: string
  valid_until: string
  is_active: boolean
  created_at: string
}

// FAQ types
export interface FAQ {
  id: string
  question_en: string
  question_hi: string
  answer_en: string
  answer_hi: string
  category: string
  sort_order: number
}

// Terms & Conditions
export interface TermsConditions {
  id: string
  version: string
  content_en: string
  content_hi: string
  is_active: boolean
  created_at: string
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
  provider_category?: ProviderCategory
  food_categories?: FoodCategory[]
  min_rating?: number
  jain_only?: boolean
  available_only?: boolean
  q?: string
  price_max?: number
  sort_by?: 'distance' | 'rating' | 'orders' | 'offers'
}

export interface ProviderSearchResult extends Provider {
  distance_meters: number
  has_offers?: boolean
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
  expires_in?: number    // OTP validity in seconds (default 600)
  cooldown?: number      // Seconds until next OTP can be requested (default 30)
  otp?: string           // Only returned in local/dev environments
  dev_mode?: boolean     // True if OTP is included in response
  sms_sent?: boolean     // Whether SMS was sent (dev mode only)
  sms_error?: string     // SMS error message (dev mode only)
}

// Provider Categories (Jain-specific)
export type ProviderCategory =
  | 'tiffin-center'
  | 'caterer'
  | 'bhojnalaya'
  | 'restaurant'
  | 'baker'
  | 'raw-material'
  | 'sodh-khana'
  | 'home-chef'
  | 'chauka-bai'

export const PROVIDER_CATEGORIES: Record<ProviderCategory, { en: string; hi: string }> = {
  'tiffin-center': { en: 'Tiffin Center', hi: 'टिफिन सेंटर' },
  'caterer': { en: 'Caterer', hi: 'कैटरर' },
  'bhojnalaya': { en: 'Bhojnalaya', hi: 'भोजनालय' },
  'restaurant': { en: 'Restaurant', hi: 'रेस्टोरेंट' },
  'baker': { en: 'Baker', hi: 'बेकर' },
  'raw-material': { en: 'Raw Material Provider', hi: 'कच्चा माल प्रदाता' },
  'sodh-khana': { en: 'Sodh Khana Provider', hi: 'सोध खाना प्रदाता' },
  'home-chef': { en: 'Home Chef', hi: 'होम शेफ' },
  'chauka-bai': { en: 'Chauka Bai', hi: 'चौका बाई' },
}

// Food Categories
export type FoodCategory =
  | 'raw-materials'
  | 'bakery'
  | 'sweets'
  | 'icecream'
  | 'namkeen'
  | 'dry-fruits'
  | 'tiffin-thali'
  | 'sodh-ka-khana'
  | 'sodh-ki-samgri'
  | 'nirvaan-laddu'

export const FOOD_CATEGORIES: Record<FoodCategory, { en: string; hi: string }> = {
  'raw-materials': { en: 'Daily Use Raw Materials', hi: 'दैनिक उपयोग कच्चा माल' },
  'bakery': { en: 'Bakery Items & Desserts', hi: 'बेकरी आइटम और मिठाइयाँ' },
  'sweets': { en: 'Sweets', hi: 'मिठाइयाँ' },
  'icecream': { en: 'Icecream', hi: 'आइसक्रीम' },
  'namkeen': { en: 'Namkeen & Snacks', hi: 'नमकीन और स्नैक्स' },
  'dry-fruits': { en: 'Dry Fruits', hi: 'सूखे मेवे' },
  'tiffin-thali': { en: 'Jain Tiffin / Thali', hi: 'जैन टिफिन / थाली' },
  'sodh-ka-khana': { en: 'Sodh Ka Khana', hi: 'सोध का खाना' },
  'sodh-ki-samgri': { en: 'Sodh Ki Samgri', hi: 'सोध की सामग्री' },
  'nirvaan-laddu': { en: 'Nirvaan Laddu', hi: 'निर्वाण लड्डू' },
}

// External Platforms
export type ExternalPlatform = 'swiggy' | 'zomato' | 'own-app'

export const EXTERNAL_PLATFORMS: Record<ExternalPlatform, string> = {
  'swiggy': 'Swiggy',
  'zomato': 'Zomato',
  'own-app': 'Own App',
}

// Provider Categories (Jain-specific)
export type ProviderCategory =
  | 'tiffin-center'
  | 'caterer'
  | 'bhojnalaya'
  | 'restaurant'
  | 'baker'
  | 'raw-material'
  | 'sodh-khana'
  | 'home-chef'
  | 'chauka-bai'

export const PROVIDER_CATEGORIES: Record<ProviderCategory, { en: string; hi: string }> = {
  'tiffin-center': { en: 'Tiffin Center', hi: 'टिफिन सेंटर' },
  'caterer': { en: 'Caterer', hi: 'कैटरर' },
  'bhojnalaya': { en: 'Bhojnalaya', hi: 'भोजनालय' },
  'restaurant': { en: 'Restaurant', hi: 'रेस्टोरेंट' },
  'baker': { en: 'Baker', hi: 'बेकर' },
  'raw-material': { en: 'Raw Material Provider', hi: 'कच्चा माल प्रदाता' },
  'sodh-khana': { en: 'Sodh Khana Provider', hi: 'सोध खाना प्रदाता' },
  'home-chef': { en: 'Home Chef', hi: 'होम शेफ' },
  'chauka-bai': { en: 'Chauka Bai', hi: 'चौका बाई' },
}

// Food Categories
export type FoodCategory =
  | 'raw-materials'
  | 'bakery'
  | 'sweets'
  | 'icecream'
  | 'namkeen'
  | 'dry-fruits'
  | 'tiffin-thali'
  | 'sodh-ka-khana'
  | 'sodh-ki-samgri'
  | 'nirvaan-laddu'

export const FOOD_CATEGORIES: Record<FoodCategory, { en: string; hi: string }> = {
  'raw-materials': { en: 'Daily Use Raw Materials', hi: 'दैनिक उपयोग कच्चा माल' },
  'bakery': { en: 'Bakery Items & Desserts', hi: 'बेकरी आइटम और मिठाइयाँ' },
  'sweets': { en: 'Sweets', hi: 'मिठाइयाँ' },
  'icecream': { en: 'Icecream', hi: 'आइसक्रीम' },
  'namkeen': { en: 'Namkeen & Snacks', hi: 'नमकीन और स्नैक्स' },
  'dry-fruits': { en: 'Dry Fruits', hi: 'सूखे मेवे' },
  'tiffin-thali': { en: 'Jain Tiffin / Thali', hi: 'जैन टिफिन / थाली' },
  'sodh-ka-khana': { en: 'Sodh Ka Khana', hi: 'सोध का खाना' },
  'sodh-ki-samgri': { en: 'Sodh Ki Samgri', hi: 'सोध की सामग्री' },
  'nirvaan-laddu': { en: 'Nirvaan Laddu', hi: 'निर्वाण लड्डू' },
}

// External Platforms
export type ExternalPlatform = 'swiggy' | 'zomato' | 'own-app'

export const EXTERNAL_PLATFORMS: Record<ExternalPlatform, string> = {
  'swiggy': 'Swiggy',
  'zomato': 'Zomato',
  'own-app': 'Own App',
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

// Sort options for search
export const SORT_OPTIONS = {
  distance: { en: 'Distance', hi: 'दूरी' },
  rating: { en: 'Highest Rated', hi: 'उच्चतम रेटिंग' },
  orders: { en: 'Most Ordered', hi: 'सबसे ज्यादा ऑर्डर' },
  offers: { en: 'Offers', hi: 'ऑफर्स' },
} as const
