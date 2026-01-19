import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  StarIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { providerApi, menuApi, menuItemApi } from '../api/client'
import { useCartStore } from '../store/cartStore'
import { JAIN_TAGS } from '../types'
import type { MenuItem } from '../types'

// Menu Item Component
function MenuItemCard({
  item,
  providerId,
  providerName,
}: {
  item: MenuItem
  providerId: string
  providerName: string
}) {
  const { items, addItem, updateQuantity, canAddItem, providerId: cartProviderId } = useCartStore()
  const cartItem = items.find((i) => i.item.id === item.id)
  const quantity = cartItem?.quantity || 0

  const handleAddToCart = () => {
    if (!canAddItem(providerId)) {
      if (confirm('Your cart contains items from another restaurant. Would you like to clear it and add this item?')) {
        addItem(item, providerId, providerName)
        toast.success('Item added to cart')
      }
    } else {
      addItem(item, providerId, providerName)
      toast.success('Item added to cart')
    }
  }

  const handleIncrement = () => {
    if (cartItem) {
      updateQuantity(item.id, quantity + 1)
    } else {
      handleAddToCart()
    }
  }

  const handleDecrement = () => {
    if (quantity > 0) {
      updateQuantity(item.id, quantity - 1)
      if (quantity === 1) {
        toast.success('Item removed from cart')
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl p-4 border ${
        !item.availability ? 'opacity-60' : ''
      }`}
    >
      <div className="flex gap-4">
        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start gap-2 mb-2">
            {item.is_jain && (
              <span className="w-5 h-5 border-2 border-green-600 flex items-center justify-center rounded">
                <span className="w-2 h-2 bg-green-600 rounded-full" />
              </span>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{item.name}</h3>
              <p className="text-lg font-bold text-gray-900 mt-1">₹{item.price}</p>
            </div>
          </div>

          {item.ingredients && item.ingredients.length > 0 && (
            <p className="text-sm text-gray-500 line-clamp-2 mt-2">
              {item.ingredients.join(', ')}
            </p>
          )}

          {!item.availability && (
            <p className="text-sm text-red-500 mt-2">Currently unavailable</p>
          )}
        </div>

        {/* Image & Add Button */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-primary-100 to-orange-100 flex items-center justify-center overflow-hidden">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">🍛</span>
            )}
          </div>

          {item.availability && (
            <div className="mt-2 -mb-2">
              {quantity > 0 ? (
                <div className="flex items-center gap-3 bg-primary-500 text-white rounded-lg px-2 py-1">
                  <button onClick={handleDecrement} className="p-1">
                    <MinusIcon className="w-4 h-4" />
                  </button>
                  <span className="font-semibold w-6 text-center">{quantity}</span>
                  <button onClick={handleIncrement} className="p-1">
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="px-4 py-2 border-2 border-primary-500 text-primary-500 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
                >
                  ADD
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { items: cartItems, providerId: cartProviderId } = useCartStore()

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalCartAmount = cartItems.reduce((sum, item) => sum + item.item.price * item.quantity, 0)

  // Fetch provider
  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ['provider', id],
    queryFn: () => providerApi.getById(id!),
    enabled: !!id,
  })

  // Fetch menus
  const { data: menus, isLoading: menusLoading } = useQuery({
    queryKey: ['menus', id],
    queryFn: () => menuApi.getByProvider(id!),
    enabled: !!id,
  })

  // Fetch menu items for each menu
  const { data: menuItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['menu-items', id, menus],
    queryFn: async () => {
      if (!menus) return []
      const allItems = await Promise.all(
        menus.map((menu) => menuItemApi.getByMenu(menu.id))
      )
      return allItems.flat()
    },
    enabled: !!menus && menus.length > 0,
  })

  if (providerLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <span className="text-6xl block mb-4">🔍</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Provider not found</h2>
        <p className="text-gray-600 mb-6">The restaurant you're looking for doesn't exist.</p>
        <Link to="/search" className="text-primary-600 font-medium hover:underline">
          ← Back to search
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero Section */}
      <div className="relative h-64 bg-gradient-to-br from-primary-500 to-orange-500">
        {provider.image_url ? (
          <img
            src={provider.image_url}
            alt={provider.business_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl">🍽️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Provider Info */}
      <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{provider.business_name}</h1>
                {provider.verified && (
                  <CheckBadgeIcon className="w-6 h-6 text-green-500" />
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {provider.address}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {provider.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full"
                  >
                    {JAIN_TAGS[tag as keyof typeof JAIN_TAGS] || tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Rating & Info */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-lg">
                <StarSolid className="w-5 h-5" />
                <span className="font-bold text-lg">
                  {provider.rating > 0 ? provider.rating.toFixed(1) : 'New'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  25-35 min
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="mt-6">
          {menusLoading || itemsLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
                  <div className="h-20 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : menus && menus.length > 0 ? (
            <div className="space-y-8">
              {menus.map((menu) => {
                const items = menuItems?.filter((item) => item.menu_id === menu.id) || []
                if (items.length === 0) return null

                return (
                  <div key={menu.id}>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      {menu.name}
                      {menu.description && (
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          {menu.description}
                        </span>
                      )}
                    </h2>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          providerId={provider.id}
                          providerName={provider.business_name}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center">
              <span className="text-4xl block mb-4">📋</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No menu available</h3>
              <p className="text-gray-600">
                This provider hasn't added any menu items yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Footer */}
      {cartProviderId === id && totalCartItems > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40"
        >
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link
              to="/cart"
              className="flex items-center justify-between bg-primary-500 text-white rounded-xl px-6 py-4 hover:bg-primary-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-lg px-3 py-1">
                  <span className="font-bold">{totalCartItems}</span> items
                </div>
                <span className="font-semibold">₹{totalCartAmount.toFixed(0)}</span>
              </div>
              <div className="flex items-center gap-2 font-semibold">
                View Cart
                <ShoppingCartIcon className="w-5 h-5" />
              </div>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Cart from other provider */}
      {cartProviderId && cartProviderId !== id && totalCartItems > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white z-40"
        >
          <div className="max-w-4xl mx-auto px-4 py-3">
            <Link
              to="/cart"
              className="flex items-center justify-between"
            >
              <span className="text-sm">You have items from another restaurant</span>
              <span className="text-primary-400 font-medium">View Cart →</span>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}
