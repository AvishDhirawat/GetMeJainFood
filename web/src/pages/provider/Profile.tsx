import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { providerApi } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import { JAIN_TAGS } from '../../types'

export default function ProviderProfile() {
  const { user, logout } = useAuthStore()
  const [isSaving, setIsSaving] = useState(false)

  const { data: provider, isLoading } = useQuery({
    queryKey: ['my-provider', user?.id],
    queryFn: async () => {
      const providers = await providerApi.list(100, 0)
      return providers.find((p) => p.user_id === user?.id)
    },
    enabled: !!user?.id,
  })

  const [formData, setFormData] = useState({
    business_name: provider?.business_name || '',
    address: provider?.address || '',
    tags: provider?.tags || [],
  })

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  if (!provider) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <p className="text-gray-600">Provider profile not found</p>
      </div>
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await providerApi.update(provider.id, {
        business_name: formData.business_name,
        address: formData.address,
        tags: formData.tags,
      })
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      <div className="bg-white rounded-xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-6">
          {provider.verified ? (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">✓ Verified</span>
          ) : (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">Pending Verification</span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input
              type="text"
              value={formData.business_name || provider.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.address || provider.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Food Tags</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(JAIN_TAGS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    const tags = formData.tags || provider.tags || []
                    setFormData({
                      ...formData,
                      tags: tags.includes(key) ? tags.filter((t) => t !== key) : [...tags, key],
                    })
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    (formData.tags || provider.tags)?.includes(key)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 bg-primary-500 text-white font-semibold rounded-xl disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Account</h2>
        <p className="text-gray-600 mb-4">Phone: {user?.phone}</p>
        <button
          onClick={logout}
          className="w-full py-3 border border-red-500 text-red-500 font-semibold rounded-xl hover:bg-red-50"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
