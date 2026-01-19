import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '../types'
import { userApi } from '../api/client'
import { logger } from '../utils/logger'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  lastFetchTime: number | null

  // Actions
  login: (token: string, user: User) => void
  logout: () => void
  loadFromStorage: () => void
  fetchUser: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      lastFetchTime: null,

      login: (token: string, user: User) => {
        logger.info('AuthStore', 'User logged in', { userId: user.id, role: user.role })
        set({
          token,
          user,
          isAuthenticated: true,
          lastFetchTime: Date.now(),
        })
      },

      logout: () => {
        logger.info('AuthStore', 'User logged out')
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          lastFetchTime: null,
        })
        // Clear all auth-related storage
        localStorage.removeItem('jain-food-auth')
        localStorage.removeItem('jain-food-mock-user')
        localStorage.removeItem('jain-food-mock-token')
      },

      loadFromStorage: () => {
        const state = get()
        logger.debug('AuthStore', 'Loading from storage', { hasToken: !!state.token, hasUser: !!state.user })

        // If we have a token but no user, fetch the user
        if (state.token && !state.user) {
          state.fetchUser()
        } else if (state.token && state.user) {
          // We have both - mark as authenticated
          set({ isAuthenticated: true })
        }
      },

      fetchUser: async () => {
        const state = get()
        if (!state.token) {
          logger.debug('AuthStore', 'No token, skipping user fetch')
          return
        }

        logger.debug('AuthStore', 'Fetching user')
        set({ isLoading: true })
        try {
          const user = await userApi.getMe()
          logger.info('AuthStore', 'User fetched successfully', { userId: user.id })
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            lastFetchTime: Date.now(),
          })
        } catch (err) {
          logger.error('AuthStore', 'Failed to fetch user', { error: err })
          // Don't clear auth on network errors - only on 401
          if ((err as { response?: { status?: number } })?.response?.status === 401) {
            set({ token: null, user: null, isAuthenticated: false, isLoading: false })
          } else {
            set({ isLoading: false })
          }
        }
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates }
          logger.info('AuthStore', 'User updated', { updates })
          set({ user: updatedUser })
        }
      },

      setUser: (user: User) => {
        logger.info('AuthStore', 'User set directly', { userId: user.id })
        set({ user, isAuthenticated: true })
      },
    }),
    {
      name: 'jain-food-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        lastFetchTime: state.lastFetchTime,
      }),
    }
  )
)
