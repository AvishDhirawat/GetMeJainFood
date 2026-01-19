import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon } from '@heroicons/react/24/outline'
import { menuApi, menuItemApi, providerApi } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Menu, MenuItem } from '../../types'

export default function ProviderMenus() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  // Get provider ID
  const { data: providerData } = useQuery({
    queryKey: ['my-provider', user?.id],
    queryFn: async () => {
      const providers = await providerApi.list(100, 0)
      return providers.find((p) => p.user_id === user?.id)
    },
    enabled: !!user?.id,
  })

  // Fetch menus
  const { data: menus, isLoading } = useQuery({
    queryKey: ['provider-menus', providerData?.id],
    queryFn: () => menuApi.getByProvider(providerData!.id),
    enabled: !!providerData?.id,
  })

  // Fetch items for all menus
  const { data: allItems } = useQuery({
    queryKey: ['provider-items', menus],
    queryFn: async () => {
      if (!menus) return []
      const items = await Promise.all(menus.map((m) => menuItemApi.getByMenu(m.id)))
      return items.flat()
    },
    enabled: !!menus?.length,
  })

  const handleAddMenu = () => {
    setEditingMenu(null)
    setShowMenuModal(true)
  }

  const handleAddItem = (menuId: string) => {
    setSelectedMenuId(menuId)
    setEditingItem(null)
    setShowItemModal(true)
  }

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Menus</h1>
        <button
          onClick={handleAddMenu}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg"
        >
          <PlusIcon className="w-5 h-5" />
          Add Menu
        </button>
      </div>

      {!menus || menus.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <span className="text-4xl block mb-4">📋</span>
          <h2 className="text-lg font-semibold mb-2">No menus yet</h2>
          <p className="text-gray-600 mb-4">Create your first menu to start adding items</p>
          <button
            onClick={handleAddMenu}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl"
          >
            Create Menu
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {menus.map((menu) => {
            const items = allItems?.filter((i) => i.menu_id === menu.id) || []
            return (
              <div key={menu.id} className="bg-white rounded-xl overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">{menu.name}</h2>
                    {menu.description && (
                      <p className="text-sm text-gray-500">{menu.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddItem(menu.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-primary-600 hover:bg-primary-50 rounded-lg"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
                <div className="divide-y">
                  {items.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No items in this menu
                    </div>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="p-4 flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <span className="text-2xl">🍛</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {item.is_jain && (
                              <span className="w-4 h-4 border-2 border-green-600 rounded flex items-center justify-center">
                                <span className="w-2 h-2 bg-green-600 rounded-full" />
                              </span>
                            )}
                            <h3 className="font-medium">{item.name}</h3>
                          </div>
                          <p className="text-gray-900 font-semibold">₹{item.price}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${item.availability ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.availability ? 'Available' : 'Unavailable'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Menu Modal - simplified */}
      {showMenuModal && (
        <MenuModal
          providerId={providerData?.id || ''}
          menu={editingMenu}
          onClose={() => setShowMenuModal(false)}
        />
      )}

      {/* Item Modal - simplified */}
      {showItemModal && selectedMenuId && (
        <ItemModal
          menuId={selectedMenuId}
          item={editingItem}
          onClose={() => setShowItemModal(false)}
        />
      )}
    </div>
  )
}

function MenuModal({ providerId, menu, onClose }: { providerId: string; menu: Menu | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(menu?.name || '')
  const [description, setDescription] = useState(menu?.description || '')

  const handleSubmit = async () => {
    try {
      await menuApi.create({ provider_id: providerId, name, description })
      queryClient.invalidateQueries({ queryKey: ['provider-menus'] })
      toast.success('Menu created!')
      onClose()
    } catch {
      toast.error('Failed to create menu')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">{menu ? 'Edit Menu' : 'Add Menu'}</h2>
        <div className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Menu name"
            className="w-full px-4 py-3 border rounded-xl"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-4 py-3 border rounded-xl"
            rows={3}
          />
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border rounded-xl">Cancel</button>
            <button onClick={handleSubmit} className="flex-1 py-3 bg-primary-500 text-white rounded-xl">Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ItemModal({ menuId, item, onClose }: { menuId: string; item: MenuItem | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(item?.name || '')
  const [price, setPrice] = useState(item?.price?.toString() || '')
  const [isJain, setIsJain] = useState(item?.is_jain ?? true)
  const [available, setAvailable] = useState(item?.availability ?? true)

  const handleSubmit = async () => {
    try {
      await menuItemApi.create({
        menu_id: menuId,
        name,
        price: parseFloat(price),
        is_jain: isJain,
        availability: available,
      })
      queryClient.invalidateQueries({ queryKey: ['provider-items'] })
      toast.success('Item added!')
      onClose()
    } catch {
      toast.error('Failed to add item')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">{item ? 'Edit Item' : 'Add Item'}</h2>
        <div className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            className="w-full px-4 py-3 border rounded-xl"
          />
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            className="w-full px-4 py-3 border rounded-xl"
          />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isJain} onChange={(e) => setIsJain(e.target.checked)} />
            <span>Jain (No onion/garlic/root veggies)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
            <span>Available</span>
          </label>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border rounded-xl">Cancel</button>
            <button onClick={handleSubmit} className="flex-1 py-3 bg-primary-500 text-white rounded-xl">Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
