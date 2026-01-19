import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
        set({ lat, lng, address: address || null, error: null })
      },

      getCurrentLocation: async () => {
        set({ isLoading: true, error: null })

        if (!navigator.geolocation) {
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

            // Try to get address from coordinates (reverse geocoding)
            try {
              // Using a simple approach - in production, use Google Maps or similar
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              )
              const data = await response.json()
              const address = data.display_name?.split(',').slice(0, 3).join(', ') || 'Current Location'

              set({
                lat: latitude,
                lng: longitude,
                address,
                isLoading: false,
              })
            } catch {
              set({
                lat: latitude,
                lng: longitude,
                address: 'Current Location',
                isLoading: false,
              })
            }
          },
          () => {
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
        set({ lat: null, lng: null, address: null, error: null })
      },
    }),
    {
      name: 'jain-food-location',
    }
  )
)
