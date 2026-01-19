import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, MenuItem } from '../types'

interface CartState {
  items: CartItem[]
  providerId: string | null
  providerName: string | null

  // Computed
  totalItems: () => number
  totalAmount: () => number

  // Actions
  addItem: (item: MenuItem, providerId: string, providerName: string) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  canAddItem: (providerId: string) => boolean
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      providerId: null,
      providerName: null,

      totalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      totalAmount: () => {
        return get().items.reduce((sum, item) => sum + (item.item.price * item.quantity), 0)
      },

      addItem: (item: MenuItem, providerId: string, providerName: string) => {
        const state = get()

        // If adding from a different provider, clear cart first
        if (state.providerId && state.providerId !== providerId) {
          set({ items: [], providerId: null, providerName: null })
        }

        const existingItem = state.items.find(i => i.item.id === item.id)

        if (existingItem) {
          set({
            items: state.items.map(i =>
              i.item.id === item.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
            providerId,
            providerName,
          })
        } else {
          set({
            items: [...state.items, { item, quantity: 1, provider_id: providerId, provider_name: providerName }],
            providerId,
            providerName,
          })
        }
      },

      removeItem: (itemId: string) => {
        const state = get()
        const newItems = state.items.filter(i => i.item.id !== itemId)

        if (newItems.length === 0) {
          set({ items: [], providerId: null, providerName: null })
        } else {
          set({ items: newItems })
        }
      },

      updateQuantity: (itemId: string, quantity: number) => {
        const state = get()

        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }

        set({
          items: state.items.map(i =>
            i.item.id === itemId
              ? { ...i, quantity }
              : i
          ),
        })
      },

      clearCart: () => {
        set({ items: [], providerId: null, providerName: null })
      },

      canAddItem: (providerId: string) => {
        const state = get()
        return !state.providerId || state.providerId === providerId
      },
    }),
    {
      name: 'jain-food-cart',
    }
  )
)
