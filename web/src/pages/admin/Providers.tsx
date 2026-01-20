import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Link, useSearchParams } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  StarIcon,
  CheckBadgeIcon,
  XCircleIcon,
  EyeIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { useLanguageStore } from '../../store/languageStore'
import type { Provider } from '../../types'

// Mock providers data - replace with actual API
const mockProviders: Provider[] = [
  {
    id: 'prov-1',
    user_id: 'user-2',
    business_name: 'Sattvic Kitchen',
    address: '123 Main St, Mumbai',
    pin_code: '400001',
    lat: 19.0760,
    lng: 72.8777,
    verified: true,
    aadhar_verified: true,
    tags: ['sattvic', 'no-onion-garlic'],
    provider_category: 'tiffin-center',
    food_categories: ['tiffin-thali'],
    rating: 4.5,
    total_ratings: 120,
    total_orders: 450,
    available_today: true,
    min_order_quantity: 1,
    bulk_order_enabled: true,
    free_delivery_min_price: 200,
    free_delivery_max_km: 5,
    is_promoted: false,
    blocked: false,
    created_at: '2025-10-01T10:00:00Z',
  },
  {
    id: 'prov-2',
    user_id: 'user-4',
    business_name: 'Jain Bhojnalaya',
    address: '456 Temple Rd, Ahmedabad',
    pin_code: '380001',
    lat: 23.0225,
    lng: 72.5714,
    verified: false,
    aadhar_verified: true,
    tags: ['pure-jain', 'no-root-veggies'],
    provider_category: 'bhojnalaya',
    food_categories: ['tiffin-thali', 'sweets'],
    rating: 0,
    total_ratings: 0,
    total_orders: 0,
    available_today: true,
    min_order_quantity: 1,
    bulk_order_enabled: false,
    free_delivery_min_price: 0,
    free_delivery_max_km: 0,
    is_promoted: false,
    blocked: false,
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'prov-3',
    user_id: 'user-5',
    business_name: 'Shree Sweets',
    address: '789 Sweet Lane, Delhi',
    pin_code: '110001',
    lat: 28.6139,
    lng: 77.2090,
    verified: true,
    aadhar_verified: false,
    tags: ['pure-jain'],
    provider_category: 'baker',
    food_categories: ['sweets', 'bakery'],
    rating: 4.8,
    total_ratings: 250,
    total_orders: 890,
    available_today: false,
    min_order_quantity: 2,
    bulk_order_enabled: true,
    free_delivery_min_price: 500,
    free_delivery_max_km: 10,
    is_promoted: true,
    blocked: false,
    created_at: '2025-08-20T10:00:00Z',
  },
]

function ProviderRow({
  provider,
  onVerify,
  onBlock,
  onUnblock,
}: {
  provider: Provider
  onVerify: (providerId: string) => void
  onBlock: (providerId: string, reason: string) => void
  onUnblock: (providerId: string) => void
}) {
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockReason, setBlockReason] = useState('')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`border-b ${provider.blocked ? 'bg-red-50' : ''}`}
      >
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-orange-100 flex items-center justify-center">
              <BuildingStorefrontIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">{provider.business_name}</p>
                {provider.is_promoted && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    Promoted
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPinIcon className="w-3 h-3" />
                {provider.address}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="text-sm text-gray-600">{provider.provider_category}</span>
        </td>
        <td className="px-6 py-4">
          {provider.rating > 0 ? (
            <div className="flex items-center gap-1">
              <StarSolid className="w-4 h-4 text-yellow-400" />
              <span className="font-medium">{provider.rating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">({provider.total_ratings})</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">New</span>
          )}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {provider.verified ? (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <CheckBadgeIcon className="w-4 h-4" />
                Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-yellow-600 text-sm">
                <XCircleIcon className="w-4 h-4" />
                Pending
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4">
          {provider.blocked ? (
            <span className="text-red-600 text-sm">Blocked</span>
          ) : provider.available_today ? (
            <span className="text-green-600 text-sm">Active</span>
          ) : (
            <span className="text-gray-500 text-sm">Inactive</span>
          )}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(provider.created_at)}</td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <Link
              to={`/provider/${provider.id}`}
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
              title="View"
            >
              <EyeIcon className="w-4 h-4" />
            </Link>
            {!provider.verified && (
              <button
                onClick={() => onVerify(provider.id)}
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Verify
              </button>
            )}
            {provider.blocked ? (
              <button
                onClick={() => onUnblock(provider.id)}
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Unblock
              </button>
            ) : (
              <button
                onClick={() => setShowBlockModal(true)}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Block
              </button>
            )}
          </div>
        </td>
      </motion.tr>

      {/* Block Modal */}
      {showBlockModal && (
        <tr>
          <td colSpan={7}>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Block Provider</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to block <strong>{provider.business_name}</strong>?
                </p>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Reason for blocking (required)"
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows={3}
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowBlockModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (blockReason.trim()) {
                        onBlock(provider.id, blockReason)
                        setShowBlockModal(false)
                        setBlockReason('')
                      } else {
                        toast.error('Please provide a reason for blocking')
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Block Provider
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function AdminProviders() {
  const { t } = useLanguageStore()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('filter') || 'all')

  // In production, fetch from API
  const providers = mockProviders

  const filteredProviders = providers.filter((provider) => {
    const matchesSearch =
      provider.business_name.toLowerCase().includes(search.toLowerCase()) ||
      provider.address.toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && !provider.verified) ||
      (statusFilter === 'verified' && provider.verified) ||
      (statusFilter === 'blocked' && provider.blocked)
    return matchesSearch && matchesStatus
  })

  const handleVerify = (providerId: string) => {
    // In production, call API
    toast.success('Provider verified successfully')
    console.log('Verifying provider', providerId)
  }

  const handleBlock = (providerId: string, reason: string) => {
    // In production, call API
    toast.success('Provider blocked successfully')
    console.log('Blocking provider', providerId, 'for', reason)
  }

  const handleUnblock = (providerId: string) => {
    // In production, call API
    toast.success('Provider unblocked successfully')
    console.log('Unblocking provider', providerId)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Manage Providers</h1>
          <p className="text-gray-600 mt-2">View and manage all food providers</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or address..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Verification</option>
              <option value="verified">Verified</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {/* Providers Table */}
        <div className="bg-white rounded-xl border overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProviders.map((provider) => (
                <ProviderRow
                  key={provider.id}
                  provider={provider}
                  onVerify={handleVerify}
                  onBlock={handleBlock}
                  onUnblock={handleUnblock}
                />
              ))}
            </tbody>
          </table>

          {filteredProviders.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <BuildingStorefrontIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No providers found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
