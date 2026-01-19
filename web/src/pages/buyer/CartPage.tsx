import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  MinusIcon,
  PlusIcon,
  TrashIcon,
  MapPinIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import { useLocationStore } from '../../store/locationStore'
import { orderApi } from '../../api/client'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, providerName, updateQuantity, removeItem, clearCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const { address } = useLocationStore()

  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderOtp, setOrderOtp] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderCode, setOrderCode] = useState<string | null>(null)

  const subtotal = items.reduce((sum, item) => sum + item.item.price * item.quantity, 0)
  const deliveryFee = 30
  const taxes = subtotal * 0.05
  const total = subtotal + deliveryFee + taxes

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/cart' } })
      return
    }

    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setIsPlacingOrder(true)
    try {
      const orderItems = items.map((item) => ({
        item_id: item.item.id,
        name: item.item.name,
        qty: item.quantity,
        price: item.item.price,
      }))

      const result = await orderApi.create({
        provider_id: items[0].provider_id,
        items: orderItems,
        total: total,
      })

      setOrderId(result.order_id)
      setOrderCode(result.order_code)
      setOrderOtp(result.otp || null)
      toast.success('Order placed successfully!')
    } catch (err) {
      toast.error('Failed to place order. Please try again.')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const handleConfirmOrder = async () => {
    if (!orderId || !orderOtp) return

    try {
      await orderApi.confirmOtp(orderId, orderOtp)
      toast.success('Order confirmed!')
      clearCart()
      navigate(`/orders/${orderId}`)
    } catch (err) {
      toast.error('Failed to confirm order')
    }
  }

  if (items.length === 0 && !orderId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <span className="text-8xl block mb-6">🛒</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">
            Add items from a restaurant to get started
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
          >
            Browse Restaurants
          </Link>
        </motion.div>
      </div>
    )
  }

  // Order Success State
  if (orderId && orderCode) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
          <p className="text-gray-600 mb-4">Your order code is</p>
          <div className="bg-gray-100 rounded-xl px-6 py-4 mb-6">
            <span className="text-2xl font-mono font-bold text-gray-900">{orderCode}</span>
          </div>

          {orderOtp && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Confirmation OTP:</strong>
              </p>
              <p className="text-2xl font-mono font-bold text-yellow-900">{orderOtp}</p>
              <p className="text-xs text-yellow-700 mt-2">
                Share this OTP with the provider to confirm your order
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleConfirmOrder}
              className="flex-1 px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600"
            >
              Confirm Order
            </button>
            <Link
              to={`/orders/${orderId}`}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 text-center"
            >
              View Order
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
        <p className="text-gray-600">{providerName}</p>
      </div>

      {/* Delivery Address */}
      <div className="bg-white rounded-xl p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <MapPinIcon className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Deliver to</p>
            <p className="font-medium text-gray-900">{address || 'Set delivery address'}</p>
          </div>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
      </div>

      {/* Cart Items */}
      <div className="bg-white rounded-xl overflow-hidden mb-4">
        <div className="divide-y">
          {items.map((item) => (
            <motion.div
              key={item.item.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 flex items-center gap-4"
            >
              {/* Item Image */}
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                {item.item.image_url ? (
                  <img
                    src={item.item.image_url}
                    alt={item.item.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-2xl">🍛</span>
                )}
              </div>

              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  {item.item.is_jain && (
                    <span className="w-4 h-4 border-2 border-green-600 flex items-center justify-center rounded flex-shrink-0 mt-1">
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                    </span>
                  )}
                  <h3 className="font-medium text-gray-900 truncate">{item.item.name}</h3>
                </div>
                <p className="text-gray-900 font-semibold mt-1">₹{item.item.price}</p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (item.quantity === 1) {
                      removeItem(item.item.id)
                      toast.success('Item removed')
                    } else {
                      updateQuantity(item.item.id, item.quantity - 1)
                    }
                  }}
                  className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  {item.quantity === 1 ? (
                    <TrashIcon className="w-4 h-4 text-red-500" />
                  ) : (
                    <MinusIcon className="w-4 h-4" />
                  )}
                </button>
                <span className="w-6 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Item Total */}
              <p className="font-semibold text-gray-900 w-20 text-right">
                ₹{(item.item.price * item.quantity).toFixed(0)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bill Details */}
      <div className="bg-white rounded-xl p-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-4">Bill Details</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Item Total</span>
            <span className="text-gray-900">₹{subtotal.toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Fee</span>
            <span className="text-gray-900">₹{deliveryFee}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Taxes & Charges</span>
            <span className="text-gray-900">₹{taxes.toFixed(0)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between font-semibold text-base">
            <span>To Pay</span>
            <span>₹{total.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Jain Food Note */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🌿</span>
          <div>
            <h4 className="font-medium text-green-800">100% Jain Compliant</h4>
            <p className="text-sm text-green-700 mt-1">
              All items are prepared following strict Jain dietary guidelines - no root vegetables, no onion, no garlic.
            </p>
          </div>
        </div>
      </div>

      {/* Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 md:relative md:shadow-none md:border-0 md:p-0 md:mt-4">
        <button
          onClick={handlePlaceOrder}
          disabled={isPlacingOrder || items.length === 0}
          className="w-full py-4 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPlacingOrder ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Placing Order...
            </>
          ) : (
            <>Place Order • ₹{total.toFixed(0)}</>
          )}
        </button>
      </div>
    </div>
  )
}
