// Mock data for development without backend
import type { Provider, Menu, MenuItem, Order, User, ProviderSearchResult, ItemSearchResult } from '../types'

// Sample Jain food images (using placeholder URLs)
const foodImages = [
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1567337710282-00832b415979?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=300&fit=crop',
]

const providerImages = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop',
]

// Generate random distance
const randomDistance = () => Math.floor(Math.random() * 8000) + 500

// Generate random rating
const randomRating = () => (Math.random() * 1.5 + 3.5).toFixed(1)

// Mock Providers
export const mockProviders: ProviderSearchResult[] = [
  {
    id: 'prov-1',
    user_id: 'user-prov-1',
    business_name: 'Jain Rasoi - Pure Veg Kitchen',
    address: 'Dadar West, Mumbai',
    lat: 19.0186,
    lng: 72.8422,
    verified: true,
    tags: ['pure-jain', 'sattvic', 'no-root-veggies', 'home-cook'],
    rating: 4.7,
    created_at: new Date().toISOString(),
    distance_meters: randomDistance(),
    image_url: providerImages[0],
    delivery_time: '25-35 min',
    price_range: '₹150-300',
  },
  {
    id: 'prov-2',
    user_id: 'user-prov-2',
    business_name: 'Sattvic Delights',
    address: 'Andheri East, Mumbai',
    lat: 19.1136,
    lng: 72.8697,
    verified: true,
    tags: ['sattvic', 'no-onion-garlic', 'cloud-kitchen'],
    rating: 4.5,
    created_at: new Date().toISOString(),
    distance_meters: randomDistance(),
    image_url: providerImages[1],
    delivery_time: '30-40 min',
    price_range: '₹100-250',
  },
  {
    id: 'prov-3',
    user_id: 'user-prov-3',
    business_name: 'Shudh Jain Bhojanalaya',
    address: 'Borivali West, Mumbai',
    lat: 19.2288,
    lng: 72.8544,
    verified: true,
    tags: ['pure-jain', 'no-root-veggies', 'hotel'],
    rating: 4.8,
    created_at: new Date().toISOString(),
    distance_meters: randomDistance(),
    image_url: providerImages[2],
    delivery_time: '20-30 min',
    price_range: '₹200-400',
  },
  {
    id: 'prov-4',
    user_id: 'user-prov-4',
    business_name: 'Maa Ka Khana - Home Tiffin',
    address: 'Ghatkopar East, Mumbai',
    lat: 19.0788,
    lng: 72.9081,
    verified: true,
    tags: ['home-cook', 'sattvic', 'no-onion-garlic'],
    rating: 4.9,
    created_at: new Date().toISOString(),
    distance_meters: randomDistance(),
    image_url: providerImages[3],
    delivery_time: '35-45 min',
    price_range: '₹120-200',
  },
  {
    id: 'prov-5',
    user_id: 'user-prov-5',
    business_name: 'Paryushan Special Kitchen',
    address: 'Mulund West, Mumbai',
    lat: 19.1726,
    lng: 72.9425,
    verified: true,
    tags: ['pure-jain', 'sattvic', 'cloud-kitchen'],
    rating: 4.6,
    created_at: new Date().toISOString(),
    distance_meters: randomDistance(),
    image_url: providerImages[4],
    delivery_time: '25-35 min',
    price_range: '₹150-350',
  },
  {
    id: 'prov-6',
    user_id: 'user-prov-6',
    business_name: 'Gujarati Thali House',
    address: 'Vile Parle West, Mumbai',
    lat: 19.1043,
    lng: 72.8361,
    verified: false,
    tags: ['pure-jain', 'no-root-veggies', 'hotel'],
    rating: 4.3,
    created_at: new Date().toISOString(),
    distance_meters: randomDistance(),
    image_url: providerImages[0],
    delivery_time: '30-40 min',
    price_range: '₹250-450',
  },
  {
    id: 'prov-7',
    user_id: 'user-prov-7',
    business_name: 'Jain Fast Food Corner',
    address: 'Malad West, Mumbai',
    lat: 19.1868,
    lng: 72.8483,
    verified: true,
    tags: ['pure-jain', 'cloud-kitchen'],
    rating: 4.4,
    created_at: new Date().toISOString(),
    distance_meters: randomDistance(),
    image_url: providerImages[1],
    delivery_time: '15-25 min',
    price_range: '₹80-180',
  },
  {
    id: 'prov-8',
    user_id: 'user-prov-8',
    business_name: 'Pure Satvik Foods',
    address: 'Kandivali East, Mumbai',
    lat: 19.2072,
    lng: 72.8728,
    verified: true,
    tags: ['sattvic', 'no-onion-garlic', 'home-cook'],
    rating: 4.7,
    created_at: new Date().toISOString(),
    distance_meters: randomDistance(),
    image_url: providerImages[2],
    delivery_time: '40-50 min',
    price_range: '₹100-220',
  },
]

// Mock Menus
export const mockMenus: Record<string, Menu[]> = {
  'prov-1': [
    { id: 'menu-1-1', provider_id: 'prov-1', name: 'Main Course', description: 'Traditional Jain main dishes', created_at: new Date().toISOString() },
    { id: 'menu-1-2', provider_id: 'prov-1', name: 'Breads', description: 'Fresh rotis and parathas', created_at: new Date().toISOString() },
    { id: 'menu-1-3', provider_id: 'prov-1', name: 'Sweets', description: 'Traditional desserts', created_at: new Date().toISOString() },
  ],
  'prov-2': [
    { id: 'menu-2-1', provider_id: 'prov-2', name: 'Thali Combos', description: 'Complete meal thalis', created_at: new Date().toISOString() },
    { id: 'menu-2-2', provider_id: 'prov-2', name: 'Snacks', description: 'Evening snacks', created_at: new Date().toISOString() },
  ],
  'prov-3': [
    { id: 'menu-3-1', provider_id: 'prov-3', name: 'Special Thali', description: 'Unlimited Jain Thali', created_at: new Date().toISOString() },
    { id: 'menu-3-2', provider_id: 'prov-3', name: 'A La Carte', description: 'Order individual dishes', created_at: new Date().toISOString() },
  ],
  'prov-4': [
    { id: 'menu-4-1', provider_id: 'prov-4', name: 'Tiffin Menu', description: 'Daily tiffin options', created_at: new Date().toISOString() },
  ],
  'prov-5': [
    { id: 'menu-5-1', provider_id: 'prov-5', name: 'Paryushan Special', description: 'Special dishes for Paryushan', created_at: new Date().toISOString() },
    { id: 'menu-5-2', provider_id: 'prov-5', name: 'Regular Menu', description: 'Everyday Jain dishes', created_at: new Date().toISOString() },
  ],
}

// Mock Menu Items
export const mockMenuItems: Record<string, MenuItem[]> = {
  'menu-1-1': [
    { id: 'item-1', menu_id: 'menu-1-1', name: 'Dal Fry', price: 120, ingredients: ['Yellow lentils', 'Cumin', 'Ghee', 'Coriander'], is_jain: true, availability: true, image_url: foodImages[0], created_at: new Date().toISOString(), description: 'Creamy yellow dal tempered with cumin and ghee' },
    { id: 'item-2', menu_id: 'menu-1-1', name: 'Paneer Butter Masala', price: 220, ingredients: ['Paneer', 'Tomatoes', 'Cream', 'Cashews'], is_jain: true, availability: true, image_url: foodImages[1], created_at: new Date().toISOString(), description: 'Rich and creamy paneer curry' },
    { id: 'item-3', menu_id: 'menu-1-1', name: 'Mix Veg Sabzi', price: 150, ingredients: ['Beans', 'Cauliflower', 'Peas', 'Capsicum'], is_jain: true, availability: true, image_url: foodImages[2], created_at: new Date().toISOString(), description: 'Assorted vegetables in mild spices' },
    { id: 'item-4', menu_id: 'menu-1-1', name: 'Palak Paneer', price: 200, ingredients: ['Spinach', 'Paneer', 'Cream'], is_jain: true, availability: false, image_url: foodImages[3], created_at: new Date().toISOString(), description: 'Cottage cheese in spinach gravy' },
  ],
  'menu-1-2': [
    { id: 'item-5', menu_id: 'menu-1-2', name: 'Butter Roti', price: 25, ingredients: ['Wheat flour', 'Butter'], is_jain: true, availability: true, image_url: '', created_at: new Date().toISOString(), description: 'Soft whole wheat bread with butter' },
    { id: 'item-6', menu_id: 'menu-1-2', name: 'Plain Paratha', price: 35, ingredients: ['Wheat flour', 'Ghee'], is_jain: true, availability: true, image_url: '', created_at: new Date().toISOString(), description: 'Layered flatbread' },
    { id: 'item-7', menu_id: 'menu-1-2', name: 'Paneer Paratha', price: 70, ingredients: ['Wheat flour', 'Paneer', 'Spices'], is_jain: true, availability: true, image_url: '', created_at: new Date().toISOString(), description: 'Stuffed paratha with spiced paneer' },
  ],
  'menu-1-3': [
    { id: 'item-8', menu_id: 'menu-1-3', name: 'Gulab Jamun', price: 60, ingredients: ['Khoya', 'Sugar syrup', 'Cardamom'], is_jain: true, availability: true, image_url: foodImages[4], created_at: new Date().toISOString(), description: '2 pieces of soft milk balls in sugar syrup' },
    { id: 'item-9', menu_id: 'menu-1-3', name: 'Rasgulla', price: 50, ingredients: ['Chhena', 'Sugar syrup'], is_jain: true, availability: true, image_url: '', created_at: new Date().toISOString(), description: '2 pieces of spongy cottage cheese balls' },
  ],
  'menu-2-1': [
    { id: 'item-10', menu_id: 'menu-2-1', name: 'Mini Thali', price: 150, ingredients: ['2 Sabzi', '3 Roti', 'Dal', 'Rice', 'Sweet'], is_jain: true, availability: true, image_url: foodImages[0], created_at: new Date().toISOString(), description: 'Compact meal with all essentials' },
    { id: 'item-11', menu_id: 'menu-2-1', name: 'Regular Thali', price: 220, ingredients: ['3 Sabzi', '4 Roti', 'Dal', 'Rice', 'Papad', 'Sweet'], is_jain: true, availability: true, image_url: foodImages[1], created_at: new Date().toISOString(), description: 'Complete satisfying meal' },
    { id: 'item-12', menu_id: 'menu-2-1', name: 'Premium Thali', price: 350, ingredients: ['4 Sabzi', 'Unlimited Roti', 'Dal', 'Rice', 'Papad', 'Raita', '2 Sweet'], is_jain: true, availability: true, image_url: foodImages[2], created_at: new Date().toISOString(), description: 'Unlimited premium experience' },
  ],
  'menu-2-2': [
    { id: 'item-13', menu_id: 'menu-2-2', name: 'Samosa (2 pcs)', price: 40, ingredients: ['Flour', 'Peas', 'Spices'], is_jain: true, availability: true, image_url: foodImages[3], created_at: new Date().toISOString(), description: 'Crispy triangular pastry with peas filling' },
    { id: 'item-14', menu_id: 'menu-2-2', name: 'Kachori (2 pcs)', price: 50, ingredients: ['Flour', 'Moong dal', 'Spices'], is_jain: true, availability: true, image_url: foodImages[4], created_at: new Date().toISOString(), description: 'Deep fried stuffed bread' },
  ],
  'menu-3-1': [
    { id: 'item-15', menu_id: 'menu-3-1', name: 'Unlimited Jain Thali', price: 399, ingredients: ['Multiple sabzi', 'Rotis', 'Dal', 'Rice', 'Sweet', 'Farsan'], is_jain: true, availability: true, image_url: foodImages[0], created_at: new Date().toISOString(), description: 'All you can eat Jain thali' },
  ],
  'menu-3-2': [
    { id: 'item-16', menu_id: 'menu-3-2', name: 'Undhiyu', price: 180, ingredients: ['Mix vegetables', 'Muthia', 'Spices'], is_jain: true, availability: true, image_url: foodImages[1], created_at: new Date().toISOString(), description: 'Traditional Gujarati mixed vegetable' },
    { id: 'item-17', menu_id: 'menu-3-2', name: 'Khichdi Kadhi', price: 140, ingredients: ['Rice', 'Moong dal', 'Curd', 'Besan'], is_jain: true, availability: true, image_url: foodImages[2], created_at: new Date().toISOString(), description: 'Classic comfort food combo' },
  ],
  'menu-4-1': [
    { id: 'item-18', menu_id: 'menu-4-1', name: 'Basic Tiffin', price: 80, ingredients: ['2 Roti', '1 Sabzi', 'Dal', 'Rice'], is_jain: true, availability: true, image_url: foodImages[3], created_at: new Date().toISOString(), description: 'Simple daily meal' },
    { id: 'item-19', menu_id: 'menu-4-1', name: 'Premium Tiffin', price: 120, ingredients: ['4 Roti', '2 Sabzi', 'Dal', 'Rice', 'Salad'], is_jain: true, availability: true, image_url: foodImages[4], created_at: new Date().toISOString(), description: 'Complete nutritious meal' },
    { id: 'item-20', menu_id: 'menu-4-1', name: 'Monthly Subscription', price: 2500, ingredients: ['Daily tiffin for 30 days'], is_jain: true, availability: true, image_url: foodImages[0], created_at: new Date().toISOString(), description: 'Best value - daily delivery' },
  ],
  'menu-5-1': [
    { id: 'item-21', menu_id: 'menu-5-1', name: 'Farali Thali', price: 250, ingredients: ['Sabudana khichdi', 'Fruits', 'Curd', 'Dry fruits'], is_jain: true, availability: true, image_url: foodImages[1], created_at: new Date().toISOString(), description: 'Special fasting thali' },
    { id: 'item-22', menu_id: 'menu-5-1', name: 'Sabudana Vada', price: 60, ingredients: ['Sabudana', 'Peanuts', 'Spices'], is_jain: true, availability: true, image_url: foodImages[2], created_at: new Date().toISOString(), description: '4 crispy tapioca fritters' },
  ],
  'menu-5-2': [
    { id: 'item-23', menu_id: 'menu-5-2', name: 'Jain Pizza', price: 180, ingredients: ['Flour base', 'Cheese', 'Vegetables', 'Herbs'], is_jain: true, availability: true, image_url: foodImages[3], created_at: new Date().toISOString(), description: 'Italian with Jain twist' },
    { id: 'item-24', menu_id: 'menu-5-2', name: 'Jain Pasta', price: 150, ingredients: ['Pasta', 'Cream', 'Vegetables'], is_jain: true, availability: true, image_url: foodImages[4], created_at: new Date().toISOString(), description: 'Creamy white sauce pasta' },
  ],
}

// Mock Orders
export const mockOrders: Order[] = []

// Helper to generate order code
export const generateOrderCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'JF-'
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Generate mock OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Default mock user
export const mockUser: User = {
  id: 'user-1',
  phone: '9876543210',
  name: 'Test User',
  email: 'test@jainfood.com',
  role: 'buyer',
  preferences: {
    jain_strict: true,
    no_root_veggies: true,
    sattvic_only: false,
    notifications_enabled: true,
  },
  created_at: new Date().toISOString(),
}

// Mock provider user
export const mockProviderUser: User = {
  id: 'user-prov-1',
  phone: '9876543211',
  name: 'Provider User',
  email: 'provider@jainfood.com',
  role: 'provider',
  preferences: null,
  created_at: new Date().toISOString(),
}
