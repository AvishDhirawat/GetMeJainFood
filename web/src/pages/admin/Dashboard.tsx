import { motion } from 'framer-motion'
import {
  UsersIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
  CurrencyRupeeIcon,
  ArrowTrendingUpIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { useLanguageStore } from '../../store/languageStore'

// Mock stats - replace with actual API call
const mockStats = {
  totalUsers: 1250,
  totalProviders: 85,
  totalOrders: 4520,
  totalReviews: 890,
  pendingVerifications: 12,
  reportedReviews: 5,
  todayOrders: 45,
  revenue: 125000,
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  link,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  link?: string
}) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl p-6 border hover:shadow-md transition-shadow ${link ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  )

  if (link) {
    return <Link to={link}>{content}</Link>
  }
  return content
}

export default function AdminDashboard() {
  // In production, fetch from API
  const stats = mockStats

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of GetMeJainFood platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={UsersIcon}
            color="bg-blue-500"
            link="/admin/users"
          />
          <StatCard
            title="Total Providers"
            value={stats.totalProviders.toLocaleString()}
            icon={BuildingStorefrontIcon}
            color="bg-green-500"
            link="/admin/providers"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders.toLocaleString()}
            icon={ShoppingBagIcon}
            color="bg-purple-500"
          />
          <StatCard
            title="Reviews"
            value={stats.totalReviews.toLocaleString()}
            icon={ChatBubbleLeftRightIcon}
            color="bg-orange-500"
            link="/admin/reviews"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Today's Orders"
            value={stats.todayOrders}
            icon={ArrowTrendingUpIcon}
            color="bg-indigo-500"
          />
          <StatCard
            title="Today's Revenue"
            value={`₹${stats.revenue.toLocaleString()}`}
            icon={CurrencyRupeeIcon}
            color="bg-emerald-500"
          />
          <StatCard
            title="Pending Verifications"
            value={stats.pendingVerifications}
            icon={CheckBadgeIcon}
            color="bg-amber-500"
            link="/admin/providers?filter=pending"
          />
          <StatCard
            title="Reported Reviews"
            value={stats.reportedReviews}
            icon={ExclamationTriangleIcon}
            color="bg-red-500"
            link="/admin/reviews?filter=reported"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 border mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/admin/users"
              className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <UsersIcon className="w-8 h-8 text-blue-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Manage Users</span>
            </Link>
            <Link
              to="/admin/providers"
              className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <BuildingStorefrontIcon className="w-8 h-8 text-green-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Manage Providers</span>
            </Link>
            <Link
              to="/admin/reviews"
              className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-orange-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Moderate Reviews</span>
            </Link>
            <Link
              to="/admin/providers?filter=pending"
              className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <CheckBadgeIcon className="w-8 h-8 text-amber-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Verify Providers</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 border">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg">
                <BuildingStorefrontIcon className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New provider registered</p>
                <p className="text-xs text-gray-500">Shree Jain Bhojnalaya - 2 mins ago</p>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                Pending Verification
              </span>
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New user signup</p>
                <p className="text-xs text-gray-500">+91 98xxx xxxxx - 5 mins ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New review posted</p>
                <p className="text-xs text-gray-500">Sattvic Kitchen - 10 mins ago</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                ★ 5.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
