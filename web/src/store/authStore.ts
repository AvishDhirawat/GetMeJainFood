import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import { userApi } from '../api/client'
import { logger } from '../utils/logger'

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
        logger.info('AuthStore', 'User logged in', { userId: user.id, role: user.role })
        set({
          token,
          user,
          isAuthenticated: true,
        })
      },

      logout: () => {
        logger.info('AuthStore', 'User logged out')
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        })
        localStorage.removeItem('jain-food-auth')
      },

      loadFromStorage: () => {
        const state = get()
        logger.debug('AuthStore', 'Loading from storage', { hasToken: !!state.token })
        if (state.token && !state.user) {
          state.fetchUser()
        }
      },

      fetchUser: async () => {
        logger.debug('AuthStore', 'Fetching user')
        set({ isLoading: true })
        try {
          const user = await userApi.getMe()
          logger.info('AuthStore', 'User fetched successfully', { userId: user.id })
          set({ user, isAuthenticated: true, isLoading: false })
        } catch (err) {
          logger.error('AuthStore', 'Failed to fetch user', { error: err })
          set({ token: null, user: null, isAuthenticated: false, isLoading: false })
        }
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          logger.info('AuthStore', 'User updated', { updates })
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
