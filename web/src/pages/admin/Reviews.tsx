import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  FlagIcon,
  EyeIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { useLanguageStore } from '../../store/languageStore'
import type { Review } from '../../types'

// Mock reviews data - replace with actual API
const mockReviews: (Review & { provider_name?: string; reported?: boolean })[] = [
  {
    id: 'rev-1',
    provider_id: 'prov-1',
    user_id: 'user-1',
    rating: 5,
    comment: 'Amazing authentic Jain food! The thali was delicious and perfectly sattvic.',
    photo_urls: [],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    user_name: 'Rahul S.',
    provider_name: 'Sattvic Kitchen',
    reported: false,
  },
  {
    id: 'rev-2',
    provider_id: 'prov-1',
    user_id: 'user-2',
    rating: 4,
    comment: 'Good quality food. Delivery was on time. Will order again!',
    photo_urls: [],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    user_name: 'Priya M.',
    provider_name: 'Sattvic Kitchen',
    reported: false,
  },
  {
    id: 'rev-3',
    provider_id: 'prov-2',
    user_id: 'user-3',
    rating: 1,
    comment: 'Very poor experience! Food was cold and taste was bad.',
    photo_urls: [],
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    user_name: 'Amit K.',
    provider_name: 'Jain Bhojnalaya',
    reported: true,
  },
  {
    id: 'rev-4',
    provider_id: 'prov-3',
    user_id: 'user-4',
    rating: 5,
    comment: 'Best sweets in town! Pure Jain preparation with excellent taste.',
    photo_urls: [],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    user_name: 'Sneha J.',
    provider_name: 'Shree Sweets',
    reported: false,
  },
  {
    id: 'rev-5',
    provider_id: 'prov-1',
    user_id: 'user-5',
    rating: 2,
    comment: 'This restaurant is fraud! They use onion in cooking!!!',
    photo_urls: [],
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    user_name: 'Anonymous',
    provider_name: 'Sattvic Kitchen',
    reported: true,
  },
]

function ReviewCard({
  review,
  onDelete,
  onDismissReport,
}: {
  review: Review & { provider_name?: string; reported?: boolean }
  onDelete: (reviewId: string) => void
  onDismissReport: (reviewId: string) => void
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-xl p-4 border ${review.reported ? 'border-red-300 bg-red-50' : ''}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{review.user_name || 'Anonymous'}</p>
              <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {review.reported && (
              <span className="flex items-center gap-1 text-red-600 text-xs bg-red-100 px-2 py-1 rounded-full">
                <FlagIcon className="w-3 h-3" />
                Reported
              </span>
            )}
            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-lg">
              <StarSolid className="w-4 h-4" />
              <span className="font-semibold">{review.rating}</span>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-sm text-primary-600 font-medium mb-1">
            {review.provider_name}
          </p>
          <p className="text-gray-700">{review.comment}</p>
        </div>

        {review.photo_urls && review.photo_urls.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {review.photo_urls.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Review photo ${idx + 1}`}
                className="w-16 h-16 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t">
          {review.reported && (
            <button
              onClick={() => onDismissReport(review.id)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg"
            >
              <EyeIcon className="w-4 h-4" />
              Dismiss Report
            </button>
          )}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Review</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this review by <strong>{review.user_name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(review.id)
                  setShowDeleteModal(false)
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete Review
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function AdminReviews() {
  const { t } = useLanguageStore()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>(searchParams.get('filter') || 'all')
  const [ratingFilter, setRatingFilter] = useState<string>('all')

  // In production, fetch from API
  const reviews = mockReviews

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.comment?.toLowerCase().includes(search.toLowerCase()) ||
      review.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      review.provider_name?.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      filter === 'all' ||
      (filter === 'reported' && review.reported)
    const matchesRating =
      ratingFilter === 'all' || review.rating === parseInt(ratingFilter)
    return matchesSearch && matchesFilter && matchesRating
  })

  const handleDelete = (reviewId: string) => {
    // In production, call API
    toast.success('Review deleted successfully')
    console.log('Deleting review', reviewId)
  }

  const handleDismissReport = (reviewId: string) => {
    // In production, call API
    toast.success('Report dismissed')
    console.log('Dismissing report for review', reviewId)
  }

  const reportedCount = reviews.filter(r => r.reported).length

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Moderate Reviews</h1>
          <p className="text-gray-600 mt-2">
            Manage and moderate user reviews
            {reportedCount > 0 && (
              <span className="ml-2 text-red-600">
                ({reportedCount} reported)
              </span>
            )}
          </p>
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
                placeholder="Search reviews..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Reviews</option>
              <option value="reported">Reported Only</option>
            </select>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onDelete={handleDelete}
              onDismissReport={handleDismissReport}
            />
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <div className="bg-white rounded-xl p-8 border text-center text-gray-500">
            <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No reviews found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}
