import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ClockIcon,
  MapPinIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { orderApi } from '../../api/client'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../types'
import type { Order } from '../../types'

function OrderCard({ order, index }: { order: Order; index: number }) {
  const date = new Date(order.created_at)
  const formattedDate = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const formattedTime = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/orders/${order.id}`}
        className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">
              {order.provider?.business_name || 'Restaurant'}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <ClockIcon className="w-4 h-4" />
              {formattedDate} at {formattedTime}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-600">Order Code:</span>
          <span className="font-mono text-sm font-semibold text-primary-600">
            {order.order_code}
          </span>
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {order.items.length} item{order.items.length > 1 ? 's' : ''}
              </p>
              <p className="font-semibold text-gray-900">₹{order.total_estimate.toFixed(0)}</p>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function OrdersPage() {
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderApi.getMyOrders(),
  })

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <span className="text-6xl block mb-4">😕</span>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to load orders</h2>
        <p className="text-gray-600">Please try again later</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-6xl block mb-4">📦</span>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-600 mb-6">
            When you place orders, they'll appear here
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600"
          >
            Start Ordering
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => (
            <OrderCard key={order.id} order={order} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}
