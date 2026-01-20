import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  ClockIcon,
} from '@heroicons/react/24/solid'
import { searchApi } from '../api/client'
import { useLocationStore } from '../store/locationStore'
import { useLanguageStore } from '../store/languageStore'
import type { ProviderSearchResult } from '../types'
import { JAIN_TAGS } from '../types'

// Hero Section Component
function HeroSection() {
  const { t } = useLanguageStore()

  return (
    <section className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            {t('home.hero.title')}<br />
            <span className="text-emerald-200">{t('home.hero.subtitle')}</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            {t('home.hero.description')}
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/search"
              className="flex-1 flex items-center gap-3 px-5 py-4 bg-white rounded-xl text-gray-600 hover:shadow-lg transition-shadow"
            >
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              <span>{t('home.search.placeholder')}</span>
            </Link>
            <Link
              to="/search"
              className="px-6 py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors text-center"
            >
              {t('home.findFood')}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Provider Categories Section (Jain-specific)
function ProviderCategoriesSection() {
  const { t, language } = useLanguageStore()

  const providerCategories = [
    { key: 'tiffin-center', icon: '🍱', color: 'bg-orange-100' },
    { key: 'caterer', icon: '🍽️', color: 'bg-blue-100' },
    { key: 'bhojnalaya', icon: '🏠', color: 'bg-green-100' },
    { key: 'restaurant', icon: '🍛', color: 'bg-red-100' },
    { key: 'baker', icon: '🧁', color: 'bg-pink-100' },
    { key: 'raw-material', icon: '🌾', color: 'bg-yellow-100' },
    { key: 'sodh-khana', icon: '🙏', color: 'bg-purple-100' },
    { key: 'home-chef', icon: '👩‍🍳', color: 'bg-cyan-100' },
    { key: 'chauka-bai', icon: '👵', color: 'bg-amber-100' },
  ]

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {language === 'hi' ? 'जैन भोजन प्रदाता' : 'Jain Food Providers'}
        </h2>
        <p className="text-gray-600 mb-6">
          {language === 'hi' ? 'अपने पसंदीदा प्रदाता चुनें' : 'Choose your preferred provider type'}
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
          {providerCategories.map((cat, index) => (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/search?provider_category=${cat.key}`}
                className={`${cat.color} flex flex-col items-center justify-center p-3 rounded-2xl hover:shadow-md transition-all card-hover`}
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                  {t(`category.${cat.key}`)}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Food Categories Section
function FoodCategoriesSection() {
  const { t, language } = useLanguageStore()

  const foodCategories = [
    { key: 'tiffin-thali', icon: '🍛', color: 'bg-orange-100' },
    { key: 'sweets', icon: '🍬', color: 'bg-pink-100' },
    { key: 'bakery', icon: '🍰', color: 'bg-amber-100' },
    { key: 'namkeen', icon: '🥨', color: 'bg-yellow-100' },
    { key: 'dry-fruits', icon: '🥜', color: 'bg-amber-100' },
    { key: 'icecream', icon: '🍨', color: 'bg-cyan-100' },
    { key: 'raw-materials', icon: '🌾', color: 'bg-green-100' },
    { key: 'sodh-ka-khana', icon: '🙏', color: 'bg-purple-100' },
    { key: 'nirvaan-laddu', icon: '🟡', color: 'bg-yellow-100' },
  ]

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {language === 'hi' ? 'भोजन श्रेणियां' : 'Food Categories'}
        </h2>
        <p className="text-gray-600 mb-6">
          {language === 'hi' ? 'अपनी पसंद का भोजन चुनें' : 'Choose your preferred food type'}
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
          {foodCategories.map((cat, index) => (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/search?food_category=${cat.key}`}
                className={`${cat.color} flex flex-col items-center justify-center p-3 rounded-2xl hover:shadow-md transition-all card-hover`}
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                  {t(`food.${cat.key}`)}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Diet Tags Section
function DietTagsSection() {
  const { t, language } = useLanguageStore()

  const dietTags = [
    { key: 'pure-jain', icon: '🌿', color: 'bg-green-100' },
    { key: 'sattvic', icon: '🧘', color: 'bg-purple-100' },
    { key: 'no-root-veggies', icon: '🥗', color: 'bg-blue-100' },
    { key: 'home-cook', icon: '👩‍🍳', color: 'bg-orange-100' },
    { key: 'cloud-kitchen', icon: '☁️', color: 'bg-cyan-100' },
    { key: 'hotel', icon: '🏨', color: 'bg-pink-100' },
  ]

  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {language === 'hi' ? 'आहार के अनुसार छाँटें' : 'Filter by Diet'}
        </h2>
        <div className="flex flex-wrap gap-3">
          {dietTags.map((tag) => (
            <Link
              key={tag.key}
              to={`/search?tags=${tag.key}`}
              className={`${tag.color} flex items-center gap-2 px-4 py-2 rounded-full hover:shadow-md transition-all`}
            >
              <span className="text-xl">{tag.icon}</span>
              <span className="text-sm font-medium text-gray-700">{t(`tag.${tag.key}`)}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// Provider Card Component
function ProviderCard({ provider, index }: { provider: ProviderSearchResult; index: number }) {
  const distance = provider.distance_meters
    ? provider.distance_meters >= 1000
      ? `${(provider.distance_meters / 1000).toFixed(1)} km`
      : `${Math.round(provider.distance_meters)} m`
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/provider/${provider.id}`}
        className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all card-hover"
      >
        {/* Image */}
        <div className="relative h-40 bg-gradient-to-br from-primary-100 to-orange-100">
          {provider.image_url ? (
            <img
              src={provider.image_url}
              alt={provider.business_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">🍽️</span>
            </div>
          )}
          {provider.verified && (
            <div className="absolute top-3 left-3 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
              ✓ Verified
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 truncate pr-2">{provider.business_name}</h3>
            <div className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded">
              <StarIcon className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                {provider.rating > 0 ? provider.rating.toFixed(1) : 'New'}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {provider.tags?.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {JAIN_TAGS[tag as keyof typeof JAIN_TAGS] || tag}
              </span>
            ))}
          </div>

          {/* Info */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {distance && (
              <div className="flex items-center gap-1">
                <MapPinIcon className="w-4 h-4" />
                {distance}
              </div>
            )}
            <div className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              25-35 min
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// Nearby Providers Section
function NearbyProvidersSection() {
  const { lat, lng } = useLocationStore()
  const { language } = useLanguageStore()

  const { data: providers, isLoading, error } = useQuery({
    queryKey: ['nearby-providers', lat, lng],
    queryFn: () => searchApi.providers({
      lat: lat || 19.0760,
      lng: lng || 72.8777,
      radius: 10000,
      limit: 12,
    }),
    enabled: true,
  })

  if (error) return null

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {language === 'hi' ? 'आपके आस-पास के रेस्तरां' : 'Restaurants Near You'}
            </h2>
            <p className="text-gray-600 mt-1">
              {language === 'hi' ? 'अपने आस-पास जैन-अनुकूल स्थान खोजें' : 'Discover Jain-friendly places around you'}
            </p>
          </div>
          <Link to="/search" className="text-primary-600 font-medium hover:text-primary-700">
            {language === 'hi' ? 'सभी देखें →' : 'View all →'}
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden">
                <div className="h-40 skeleton" />
                <div className="p-4 space-y-3">
                  <div className="h-5 skeleton rounded w-3/4" />
                  <div className="h-4 skeleton rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : providers && providers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {providers.map((provider, index) => (
              <ProviderCard key={provider.id} provider={provider} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🔍</span>
            <p className="text-gray-600">No providers found nearby. Try expanding your search area.</p>
            <Link to="/search" className="inline-block mt-4 text-primary-600 font-medium hover:underline">
              Search everywhere →
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    {
      icon: '📍',
      title: 'Set Your Location',
      description: 'Share your location to find Jain food near you',
    },
    {
      icon: '🔍',
      title: 'Browse & Select',
      description: 'Filter by Jain dietary preferences and choose your meal',
    },
    {
      icon: '🛒',
      title: 'Place Order',
      description: 'Add items to cart and confirm with OTP',
    },
    {
      icon: '🍽️',
      title: 'Enjoy Your Food',
      description: 'Coordinate with the provider for pickup or delivery',
    },
  ]

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          <p className="text-gray-600 mt-2">Get your favorite Jain food in 4 simple steps</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">{step.icon}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Become a Provider CTA
function BecomeProviderCTA() {
  return (
    <section className="py-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">Are you a Jain Food Provider?</h2>
            <p className="text-gray-300 max-w-xl">
              Join our platform and reach thousands of customers looking for authentic Jain food.
              Whether you're a restaurant, cloud kitchen, or home cook, we'd love to have you!
            </p>
          </div>
          <Link
            to="/login"
            className="px-8 py-4 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors whitespace-nowrap"
          >
            Register as Provider
          </Link>
        </div>
      </div>
    </section>
  )
}

// Main Home Page Component
export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <ProviderCategoriesSection />
      <FoodCategoriesSection />
      <DietTagsSection />
      <NearbyProvidersSection />
      <HowItWorksSection />
      <BecomeProviderCTA />
    </div>
  )
}
