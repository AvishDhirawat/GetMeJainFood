import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { searchApi } from '../api/client'
import { useLocationStore } from '../store/locationStore'
import { JAIN_TAGS } from '../types'
import type { ProviderSearchResult, ItemSearchResult } from '../types'

// Filter Panel Component
function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFilterChange,
}: {
  isOpen: boolean
  onClose: () => void
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
}) {
  const [localFilters, setLocalFilters] = useState(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleApply = () => {
    onFilterChange(localFilters)
    onClose()
  }

  const handleReset = () => {
    const defaultFilters: FilterState = {
      tags: [],
      minRating: 0,
      priceMax: 0,
      jainOnly: true,
      availableOnly: true,
    }
    setLocalFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-xl"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Jain Tags */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Dietary Preferences</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(JAIN_TAGS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => {
                          const newTags = localFilters.tags.includes(key)
                            ? localFilters.tags.filter((t) => t !== key)
                            : [...localFilters.tags, key]
                          setLocalFilters({ ...localFilters, tags: newTags })
                        }}
                        className={`px-3 py-2 rounded-full text-sm transition-colors ${
                          localFilters.tags.includes(key)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Min Rating */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Minimum Rating</h3>
                  <div className="flex gap-2">
                    {[0, 3, 3.5, 4, 4.5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setLocalFilters({ ...localFilters, minRating: rating })}
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${
                          localFilters.minRating === rating
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {rating === 0 ? (
                          'Any'
                        ) : (
                          <>
                            {rating}
                            <StarSolid className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Price */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Maximum Price</h3>
                  <div className="flex gap-2">
                    {[0, 100, 200, 500, 1000].map((price) => (
                      <button
                        key={price}
                        onClick={() => setLocalFilters({ ...localFilters, priceMax: price })}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          localFilters.priceMax === price
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {price === 0 ? 'Any' : `₹${price}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Jain Food Only</span>
                    <input
                      type="checkbox"
                      checked={localFilters.jainOnly}
                      onChange={(e) => setLocalFilters({ ...localFilters, jainOnly: e.target.checked })}
                      className="w-5 h-5 rounded text-primary-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Available Now</span>
                    <input
                      type="checkbox"
                      checked={localFilters.availableOnly}
                      onChange={(e) => setLocalFilters({ ...localFilters, availableOnly: e.target.checked })}
                      className="w-5 h-5 rounded text-primary-500"
                    />
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
                >
                  Reset
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

interface FilterState {
  tags: string[]
  minRating: number
  priceMax: number
  jainOnly: boolean
  availableOnly: boolean
}

// Provider Card
function ProviderCard({ provider }: { provider: ProviderSearchResult }) {
  const distance = provider.distance_meters
    ? provider.distance_meters >= 1000
      ? `${(provider.distance_meters / 1000).toFixed(1)} km`
      : `${Math.round(provider.distance_meters)} m`
    : null

  return (
    <Link
      to={`/provider/${provider.id}`}
      className="flex bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="w-28 h-28 flex-shrink-0 bg-gradient-to-br from-primary-100 to-orange-100 flex items-center justify-center">
        {provider.image_url ? (
          <img src={provider.image_url} alt={provider.business_name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">🍽️</span>
        )}
      </div>
      <div className="flex-1 p-3">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900 line-clamp-1">{provider.business_name}</h3>
          <div className="flex items-center gap-1 bg-green-100 px-1.5 py-0.5 rounded text-xs">
            <StarSolid className="w-3 h-3 text-green-600" />
            <span className="font-medium text-green-700">{provider.rating > 0 ? provider.rating.toFixed(1) : 'New'}</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 line-clamp-1 mt-1">{provider.address}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          {distance && (
            <span className="flex items-center gap-1">
              <MapPinIcon className="w-3 h-3" /> {distance}
            </span>
          )}
          <span className="flex items-center gap-1">
            <ClockIcon className="w-3 h-3" /> 25-35 min
          </span>
        </div>
        <div className="flex gap-1 mt-2">
          {provider.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
              {JAIN_TAGS[tag as keyof typeof JAIN_TAGS] || tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

// Item Card
function ItemCard({ item }: { item: ItemSearchResult }) {
  return (
    <Link
      to={`/provider/${item.provider_id}`}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="h-32 bg-gradient-to-br from-primary-100 to-orange-100 flex items-center justify-center">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">🍛</span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-1">{item.provider_name}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-gray-900">₹{item.price}</span>
          {item.is_jain && <span className="jain-badge">Jain</span>}
        </div>
      </div>
    </Link>
  )
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { lat, lng, address } = useLocationStore()

  // Get category filters from URL
  const providerCategory = searchParams.get('provider_category') || ''
  const foodCategory = searchParams.get('food_category') || ''

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [searchType, setSearchType] = useState<'providers' | 'items'>(
    (searchParams.get('type') as 'providers' | 'items') || 'providers'
  )
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
    minRating: parseFloat(searchParams.get('min_rating') || '0'),
    priceMax: parseFloat(searchParams.get('price_max') || '0'),
    jainOnly: searchParams.get('jain_only') !== 'false',
    availableOnly: searchParams.get('available_only') !== 'false',
  })

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (searchType !== 'providers') params.set('type', searchType)
    if (filters.tags.length) params.set('tags', filters.tags.join(','))
    if (filters.minRating) params.set('min_rating', filters.minRating.toString())
    if (filters.priceMax) params.set('price_max', filters.priceMax.toString())
    if (!filters.jainOnly) params.set('jain_only', 'false')
    if (!filters.availableOnly) params.set('available_only', 'false')
    if (providerCategory) params.set('provider_category', providerCategory)
    if (foodCategory) params.set('food_category', foodCategory)
    setSearchParams(params, { replace: true })
  }, [searchQuery, searchType, filters, providerCategory, foodCategory, setSearchParams])

  // Provider search query
  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['search-providers', lat, lng, filters, providerCategory],
    queryFn: () =>
      searchApi.providers({
        lat: lat || 19.076,
        lng: lng || 72.8777,
        radius: 15000,
        tags: filters.tags.length ? filters.tags : undefined,
        min_rating: filters.minRating || undefined,
        provider_category: providerCategory || undefined,
        limit: 50,
      }),
    enabled: searchType === 'providers',
  })

  // Item search query
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['search-items', lat, lng, searchQuery, filters, foodCategory],
    queryFn: () =>
      searchApi.items({
        lat: lat || 19.076,
        lng: lng || 72.8777,
        radius: 15000,
        q: searchQuery || undefined,
        jain_only: filters.jainOnly,
        available_only: filters.availableOnly,
        tags: filters.tags.length ? filters.tags : undefined,
        min_rating: filters.minRating || undefined,
        price_max: filters.priceMax || undefined,
        limit: 50,
      }),
    enabled: searchType === 'items',
  })

  const isLoading = searchType === 'providers' ? providersLoading : itemsLoading

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="sticky top-16 z-30 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <MapPinIcon className="w-4 h-4 text-primary-500" />
            <span>{address || 'Set your location'}</span>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for dishes or restaurants..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={() => setFiltersOpen(true)}
              className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2"
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
              {(filters.tags.length > 0 || filters.minRating > 0 || filters.priceMax > 0) && (
                <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                  {filters.tags.length + (filters.minRating > 0 ? 1 : 0) + (filters.priceMax > 0 ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setSearchType('providers')}
              className={`pb-2 font-medium border-b-2 transition-colors ${
                searchType === 'providers'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Restaurants
            </button>
            <button
              onClick={() => setSearchType('items')}
              className={`pb-2 font-medium border-b-2 transition-colors ${
                searchType === 'items'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Dishes
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {filters.tags.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap gap-2">
            {filters.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilters({ ...filters, tags: filters.tags.filter((t) => t !== tag) })}
                className="flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
              >
                {JAIN_TAGS[tag as keyof typeof JAIN_TAGS] || tag}
                <XMarkIcon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 flex gap-4">
                <div className="w-28 h-28 skeleton rounded-lg" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 skeleton rounded w-1/3" />
                  <div className="h-4 skeleton rounded w-1/2" />
                  <div className="h-4 skeleton rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : searchType === 'providers' ? (
          providers && providers.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{providers.length} restaurants found</p>
              {providers.map((provider) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ProviderCard provider={provider} />
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState />
          )
        ) : items && items.length > 0 ? (
          <div>
            <p className="text-sm text-gray-600 mb-4">{items.length} dishes found</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <ItemCard item={item} />
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
      />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <span className="text-6xl block mb-4">🔍</span>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
      <p className="text-gray-600 max-w-md mx-auto">
        Try adjusting your filters or search for something different
      </p>
    </div>
  )
}
