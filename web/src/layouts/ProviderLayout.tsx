import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  Squares2X2Icon,
  UserIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

export default function ProviderLayout() {
  const location = useLocation()

  const navItems = [
    { path: '/provider/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/provider/orders', label: 'Orders', icon: ClipboardDocumentListIcon },
    { path: '/provider/menus', label: 'Menus', icon: Squares2X2Icon },
    { path: '/provider/profile', label: 'Profile', icon: UserIcon },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg hidden lg:block">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <Link to="/" className="flex items-center gap-3">
              <img src="/favicon.svg" alt="JainFood" className="w-10 h-10" />
              <div>
                <span className="text-xl font-bold text-gray-900">JainFood</span>
                <p className="text-xs text-gray-500">Provider Portal</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-primary-50 text-primary-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Back to App */}
          <div className="p-4 border-t">
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to App
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="JainFood" className="w-8 h-8" />
            <span className="font-bold text-gray-900">Provider</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
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
        </div>
      </nav>

      {/* Bottom padding for mobile navigation */}
      <div className="lg:hidden h-16" />
    </div>
  )
}
