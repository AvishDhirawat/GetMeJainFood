import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ClockIcon,
  MapPinIcon,
  ChatBubbleLeftIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { orderApi } from '../../api/client'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../types'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [otpInput, setOtpInput] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.getById(id!),
    enabled: !!id,
  })

  const handleConfirmOrder = async () => {
    if (!id || !otpInput) return
    setIsConfirming(true)
    try {
      await orderApi.confirmOtp(id, otpInput)
      toast.success('Order confirmed!')
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
    } catch {
      toast.error('Invalid OTP')
    } finally {
      setIsConfirming(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!id) return
    if (!confirm('Are you sure you want to cancel this order?')) return

    setIsCancelling(true)
    try {
      await orderApi.cancel(id)
      toast.success('Order cancelled')
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
    } catch {
      toast.error('Failed to cancel order')
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="bg-white rounded-xl p-6">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <span className="text-6xl block mb-4">😕</span>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Order not found</h2>
        <Link to="/orders" className="text-primary-600 hover:underline">
          ← Back to Orders
        </Link>
      </div>
    )
  }

  const date = new Date(order.created_at)
  const formattedDate = date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedTime = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const canConfirm = order.status === 'CREATED' || order.status === 'PENDING_PROVIDER_ACK'
  const canCancel = order.status === 'CREATED' || order.status === 'PENDING_PROVIDER_ACK'
  const isCompleted = order.status === 'COMPLETED'
  const isCancelled = order.status === 'CANCELLED'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
      <Link to="/orders" className="text-primary-600 mb-4 inline-flex items-center gap-1 hover:underline">
        ← Back to Orders
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Order Status */}
        <div className="bg-white rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Order Details</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Order Code</p>
              <p className="font-mono font-semibold text-primary-600">{order.order_code}</p>
            </div>
            <div>
              <p className="text-gray-500">Date & Time</p>
              <p className="font-medium">{formattedDate}</p>
              <p className="text-gray-600">{formattedTime}</p>
            </div>
          </div>
        </div>

        {/* Provider Info */}
        {order.provider && (
          <div className="bg-white rounded-xl p-6 mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">Restaurant</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🍽️</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{order.provider.business_name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <MapPinIcon className="w-4 h-4" />
                  {order.provider.address}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                <PhoneIcon className="w-4 h-4" />
                Call
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                <ChatBubbleLeftIcon className="w-4 h-4" />
                Chat
              </button>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-xl p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">Items Ordered</h2>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-green-100 text-green-700 rounded flex items-center justify-center text-sm font-medium">
                    {item.qty}
                  </span>
                  <span className="text-gray-900">{item.name}</span>
                </div>
                <span className="font-medium">₹{(item.price * item.qty).toFixed(0)}</span>
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Item Total</span>
              <span>₹{order.items.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery Fee</span>
              <span>₹30</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Taxes</span>
              <span>₹{(order.total_estimate * 0.05).toFixed(0)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
              <span>Total</span>
              <span>₹{order.total_estimate.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Confirm Order with OTP */}
        {canConfirm && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-4">
            <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
              <span className="text-xl">🔐</span>
              Confirm Order with OTP
            </h3>
            <p className="text-sm text-yellow-700 mb-4">
              Share the OTP with the provider to confirm your order
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                className="flex-1 px-4 py-3 border border-yellow-300 rounded-xl text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-yellow-500"
                maxLength={6}
              />
              <button
                onClick={handleConfirmOrder}
                disabled={isConfirming || otpInput.length !== 6}
                className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-xl disabled:opacity-50 hover:bg-yellow-600"
              >
                {isConfirming ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </div>
        )}

        {/* Order Completed */}
        {isCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Order Completed</h3>
                <p className="text-sm text-green-700">Thank you for your order!</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Cancelled */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-4">
            <div className="flex items-center gap-3">
              <XCircleIcon className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Order Cancelled</h3>
                <p className="text-sm text-red-700">This order has been cancelled</p>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Button */}
        {canCancel && (
          <button
            onClick={handleCancelOrder}
            disabled={isCancelling}
            className="w-full py-3 border border-red-300 text-red-600 font-medium rounded-xl hover:bg-red-50 disabled:opacity-50"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </motion.div>
    </div>
  )
}
