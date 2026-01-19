import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { logger } from '../utils/logger'

interface LocationState {
  lat: number | null
  lng: number | null
  address: string | null
  isLoading: boolean
  error: string | null

  // Actions
  setLocation: (lat: number, lng: number, address?: string) => void
  getCurrentLocation: () => Promise<void>
  clearLocation: () => void
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      lat: null,
      lng: null,
      address: null,
      isLoading: false,
      error: null,

      setLocation: (lat: number, lng: number, address?: string) => {
        logger.info('LocationStore', 'Location set manually', { lat, lng, address })
        set({ lat, lng, address: address || null, error: null })
      },

      getCurrentLocation: async () => {
        logger.info('LocationStore', 'Getting current location')
        set({ isLoading: true, error: null })

        if (!navigator.geolocation) {
          logger.warn('LocationStore', 'Geolocation not supported, using default')
          set({
            isLoading: false,
            error: 'Geolocation is not supported by this browser',
            // Default to Mumbai coordinates
            lat: 19.0760,
            lng: 72.8777,
            address: 'Mumbai, Maharashtra'
          })
          return
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            logger.info('LocationStore', 'Location obtained', { latitude, longitude })

            // Try to get address from coordinates (reverse geocoding)
            try {
              // Using a simple approach - in production, use Google Maps or similar
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              )
              const data = await response.json()
              const address = data.display_name?.split(',').slice(0, 3).join(', ') || 'Current Location'

              logger.info('LocationStore', 'Address resolved', { address })
              set({
                lat: latitude,
                lng: longitude,
                address,
                isLoading: false,
              })
            } catch (err) {
              logger.warn('LocationStore', 'Reverse geocoding failed', { error: err })
              set({
                lat: latitude,
                lng: longitude,
                address: 'Current Location',
                isLoading: false,
              })
            }
          },
          (error) => {
            logger.warn('LocationStore', 'Geolocation error, using default', { error: error.message })
            set({
              isLoading: false,
              error: 'Unable to retrieve your location',
              // Default to Mumbai coordinates
              lat: 19.0760,
              lng: 72.8777,
              address: 'Mumbai, Maharashtra'
            })
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes cache
          }
        )
      },

      clearLocation: () => {
        logger.info('LocationStore', 'Location cleared')
        set({ lat: null, lng: null, address: null, error: null })
      },
    }),
    {
      name: 'jain-food-location',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lat: state.lat,
        lng: state.lng,
        address: state.address,
      }),
    }
  )
)
