import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline'
import { orderApi, providerApi } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../types'
import type { Order } from '../../types'

function OrderCard({ order, onStatusUpdate }: { order: Order; onStatusUpdate: () => void }) {
  const date = new Date(order.created_at)
  const formattedDate = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
  const formattedTime = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleConfirm = async () => {
    try {
      await orderApi.confirmOtp(order.id, '000000') // Provider auto-confirm
      toast.success('Order confirmed!')
      onStatusUpdate()
    } catch {
      toast.error('Failed to confirm order')
    }
  }

  const handleComplete = async () => {
    try {
      await orderApi.complete(order.id)
      toast.success('Order completed!')
      onStatusUpdate()
    } catch {
      toast.error('Failed to complete order')
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    try {
      await orderApi.cancel(order.id)
      toast.success('Order cancelled')
      onStatusUpdate()
    } catch {
      toast.error('Failed to cancel order')
    }
  }

  const canConfirm = order.status === 'CREATED' || order.status === 'PENDING_PROVIDER_ACK'
  const canComplete = order.status === 'CONFIRMED'
  const canCancel = order.status !== 'COMPLETED' && order.status !== 'CANCELLED'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-mono font-semibold text-primary-600">{order.order_code}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            {formattedDate} at {formattedTime}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Order Items */}
      <div className="border-t border-b py-3 my-3">
        {order.items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm py-1">
            <span>
              <span className="text-primary-600 font-medium">{item.qty}x</span> {item.name}
            </span>
            <span className="font-medium">₹{item.price * item.qty}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-500">Total</span>
        <span className="text-lg font-bold">₹{order.total_estimate.toFixed(0)}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {canConfirm && (
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <CheckIcon className="w-4 h-4" />
            Accept
          </button>
        )}
        {canComplete && (
          <button
            onClick={handleComplete}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            <CheckIcon className="w-4 h-4" />
            Complete
          </button>
        )}
        {canCancel && (
          <button
            onClick={handleCancel}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-500 rounded-lg hover:bg-red-50"
          >
            <XMarkIcon className="w-4 h-4" />
            Cancel
          </button>
        )}
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <PhoneIcon className="w-4 h-4" />
        </button>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <ChatBubbleLeftIcon className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

export default function ProviderOrders() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Get provider
  const { data: provider } = useQuery({
    queryKey: ['my-provider', user?.id],
    queryFn: async () => {
      const providers = await providerApi.list(100, 0)
      return providers.find((p) => p.user_id === user?.id)
    },
    enabled: !!user?.id,
  })

  // Get orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ['provider-orders', provider?.id],
    queryFn: () => orderApi.getProviderOrders(provider!.id),
    enabled: !!provider?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const handleStatusUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['provider-orders'] })
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const activeOrders = orders?.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED') || []
  const pastOrders = orders?.filter(o => o.status === 'COMPLETED' || o.status === 'CANCELLED') || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Active Orders ({activeOrders.length})
          </h2>
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} onStatusUpdate={handleStatusUpdate} />
            ))}
          </div>
        </div>
      )}

      {/* Past Orders */}
      {pastOrders.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-3">Past Orders</h2>
          <div className="space-y-4">
            {pastOrders.map((order) => (
              <OrderCard key={order.id} order={order} onStatusUpdate={handleStatusUpdate} />
            ))}
          </div>
        </div>
      )}

      {/* No Orders */}
      {(!orders || orders.length === 0) && (
        <div className="bg-white rounded-xl p-8 text-center">
          <span className="text-6xl block mb-4">📦</span>
          <h2 className="text-lg font-semibold mb-2">No orders yet</h2>
          <p className="text-gray-600">Orders will appear here when customers place them</p>
        </div>
      )}
    </div>
  )
}
