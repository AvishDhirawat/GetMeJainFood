import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import { userApi } from '../api/client'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  login: (token: string, user: User) => void
  logout: () => void
  loadFromStorage: () => void
  fetchUser: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: (token: string, user: User) => {
        set({
          token,
          user,
          isAuthenticated: true,
        })
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        })
        localStorage.removeItem('jain-food-auth')
      },

      loadFromStorage: () => {
        const state = get()
        if (state.token && !state.user) {
          state.fetchUser()
        }
      },

      fetchUser: async () => {
        set({ isLoading: true })
        try {
          const user = await userApi.getMe()
          set({ user, isAuthenticated: true, isLoading: false })
        } catch {
          set({ token: null, user: null, isAuthenticated: false, isLoading: false })
        }
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } })
        }
      },
    }),
    {
      name: 'jain-food-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
)
