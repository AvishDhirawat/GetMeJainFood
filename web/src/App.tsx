import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { useLocationStore } from './store/locationStore'
import { logger } from './utils/logger'

// Components
import ErrorBoundary from './components/ErrorBoundary'
import DebugPanel from './components/DebugPanel'
import ProtectedRoute from './components/ProtectedRoute'

// Layouts
import MainLayout from './layouts/MainLayout'
import ProviderLayout from './layouts/ProviderLayout'

// Public Pages
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import ProviderDetailPage from './pages/ProviderDetailPage'
import LoginPage from './pages/LoginPage'

// Buyer Pages
import CartPage from './pages/buyer/CartPage'
import OrdersPage from './pages/buyer/OrdersPage'
import OrderDetailPage from './pages/buyer/OrderDetailPage'
import ProfilePage from './pages/buyer/ProfilePage'

// Provider Pages
import ProviderDashboard from './pages/provider/Dashboard'
import ProviderMenus from './pages/provider/Menus'
import ProviderOrders from './pages/provider/Orders'
import ProviderProfile from './pages/provider/Profile'
import ProviderOnboarding from './pages/provider/Onboarding'

// Page view tracking component
function PageTracker() {
  const location = useLocation()

  useEffect(() => {
    // Track page view
    const pageName = location.pathname === '/' ? 'Home' :
                     location.pathname.replace(/^\//, '').replace(/\//g, ' > ')
    logger.info('Navigation', 'Page view', { page: pageName, path: location.pathname })
  }, [location])

  return null
}


function App() {
  const { loadFromStorage, isAuthenticated } = useAuthStore()
  const { getCurrentLocation } = useLocationStore()

  useEffect(() => {
    logger.info('App', 'Application initialized', {
      environment: import.meta.env.MODE,
      mockMode: import.meta.env.VITE_USE_MOCK_API === 'true',
    })

    loadFromStorage()
    getCurrentLocation()

    // Log authentication state changes
    logger.debug('App', 'Auth state loaded', { isAuthenticated })
  }, [loadFromStorage, getCurrentLocation, isAuthenticated])

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logger.error('Global', 'Uncaught error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('Global', 'Unhandled promise rejection', {
        reason: event.reason,
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return (
    <ErrorBoundary>
      <Router>
        <PageTracker />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Main Layout Routes (Buyer/Public) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/provider/:id" element={<ProviderDetailPage />} />

            {/* Protected Buyer Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Provider Routes */}
          <Route path="/provider-onboarding" element={
            <ProtectedRoute>
              <ProviderOnboarding />
            </ProtectedRoute>
          } />

          <Route path="/provider" element={
            <ProtectedRoute requiredRole="provider">
              <ProviderLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<ProviderDashboard />} />
            <Route path="menus" element={<ProviderMenus />} />
            <Route path="orders" element={<ProviderOrders />} />
            <Route path="profile" element={<ProviderProfile />} />
          </Route>
        </Routes>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            },
          }}
        />

        {/* Debug Panel - only shows in development */}
        <DebugPanel />
      </Router>
    </ErrorBoundary>
  )
}

export default App
