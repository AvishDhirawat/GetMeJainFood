import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useLocationStore } from './store/locationStore'

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

// Components
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { loadFromStorage } = useAuthStore()
  const { getCurrentLocation } = useLocationStore()

  useEffect(() => {
    loadFromStorage()
    getCurrentLocation()
  }, [loadFromStorage, getCurrentLocation])

  return (
    <Router>
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
    </Router>
  )
}

export default App
