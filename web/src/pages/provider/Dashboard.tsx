import { ClipboardDocumentListIcon, CurrencyRupeeIcon, StarIcon } from '@heroicons/react/24/outline'

export default function ProviderDashboard() {
  const stats = [
    { label: 'Total Orders', value: '0', icon: ClipboardDocumentListIcon, color: 'bg-blue-500' },
    { label: 'Revenue', value: '₹0', icon: CurrencyRupeeIcon, color: 'bg-green-500' },
    { label: 'Rating', value: '4.5', icon: StarIcon, color: 'bg-yellow-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <a href="/provider/menus" className="p-4 bg-primary-50 rounded-xl text-center hover:bg-primary-100">
            <span className="text-2xl block mb-2">📋</span>
            <span className="text-sm font-medium text-primary-700">Manage Menu</span>
          </a>
          <a href="/provider/orders" className="p-4 bg-green-50 rounded-xl text-center hover:bg-green-100">
            <span className="text-2xl block mb-2">📦</span>
            <span className="text-sm font-medium text-green-700">View Orders</span>
          </a>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-br from-primary-500 to-orange-500 rounded-xl p-6 text-white">
        <h2 className="font-semibold mb-2">🌿 Tip of the Day</h2>
        <p className="text-white/90 text-sm">
          Keep your menu updated with seasonal Jain dishes. Adding new items regularly
          keeps customers engaged and improves your visibility in search results.
        </p>
      </div>
    </div>
  )
}
