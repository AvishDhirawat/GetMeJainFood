import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HomeIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import LocationSelector from '../components/LocationSelector'
import Logo from '../components/Logo'

export default function MainLayout() {
  const location = useLocation()
  const { isAuthenticated, user } = useAuthStore()
  const cartItems = useCartStore((state) => state.items)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const navItems = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/search', label: 'Search', icon: MagnifyingGlassIcon },
    { path: '/orders', label: 'Orders', icon: ClipboardDocumentListIcon, protected: true },
    { path: '/profile', label: 'Profile', icon: UserIcon, protected: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Location */}
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center">
                <Logo size="md" variant="horizontal" showText={true} />
              </Link>

              {/* Location Selector */}
              <div className="hidden sm:block">
                <LocationSelector />
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                if (item.protected && !isAuthenticated) return null
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                      isActive ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                )
              })}

              {/* Cart */}
              <Link
                to="/cart"
                className="relative flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <ShoppingCartIcon className="w-5 h-5" />
                Cart
                {totalCartItems > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                    {totalCartItems}
                  </span>
                )}
              </Link>

              {/* Auth */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{user?.name || user?.phone}</span>
                  {user?.role === 'provider' && (
                    <Link
                      to="/provider/dashboard"
                      className="px-3 py-1.5 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      Dashboard
                    </Link>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Login
                </Link>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t"
            >
              <div className="px-4 py-4 space-y-2">
                {/* Mobile Location Selector */}
                <div className="pb-3 mb-3 border-b border-gray-100">
                  <LocationSelector />
                </div>

                {navItems.map((item) => {
                  if (item.protected && !isAuthenticated) return null
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                        isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  )
                })}
                <Link
                  to="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600"
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                  Cart {totalCartItems > 0 && `(${totalCartItems})`}
                </Link>
                {!isAuthenticated && (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2 bg-primary-500 text-white rounded-lg"
                  >
                    Login
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 4).map((item) => {
            if (item.protected && !isAuthenticated) {
              return (
                <Link
                  key={item.path}
                  to="/login"
                  className="flex flex-col items-center gap-0.5 px-3 py-1 text-gray-400"
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              )
            }
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                  isActive ? 'text-primary-600' : 'text-gray-600'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
          <Link
            to="/cart"
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1 ${
              location.pathname === '/cart' ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <ShoppingCartIcon className="w-6 h-6" />
            <span className="text-xs">Cart</span>
            {totalCartItems > 0 && (
              <span className="absolute top-0 right-1 w-4 h-4 bg-primary-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {totalCartItems}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* Bottom padding for mobile navigation */}
      <div className="md:hidden h-16" />
    </div>
  )
}
