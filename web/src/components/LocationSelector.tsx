import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPinIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import { MapPinIcon as MapPinSolidIcon } from '@heroicons/react/24/solid'
import { useLocationStore } from '../store/locationStore'

// Predefined locations for India (major cities with Jain population)
export const PREDEFINED_LOCATIONS = [
  { name: 'Mumbai, Maharashtra', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090 },
  { name: 'Ahmedabad, Gujarat', lat: 23.0225, lng: 72.5714 },
  { name: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Jaipur, Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'Surat, Gujarat', lat: 21.1702, lng: 72.8311 },
  { name: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata, West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867 },
  { name: 'Indore, Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { name: 'Udaipur, Rajasthan', lat: 24.5854, lng: 73.7125 },
  { name: 'Vadodara, Gujarat', lat: 22.3072, lng: 73.1812 },
  { name: 'Rajkot, Gujarat', lat: 22.3039, lng: 70.8022 },
  { name: 'Nagpur, Maharashtra', lat: 21.1458, lng: 79.0882 },
]

export default function LocationSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { address, setLocation, getCurrentLocation, isLoading } = useLocationStore()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredLocations = PREDEFINED_LOCATIONS.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectLocation = (location: typeof PREDEFINED_LOCATIONS[0]) => {
    setLocation(location.lat, location.lng, location.name)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleUseCurrentLocation = () => {
    getCurrentLocation()
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors max-w-[220px] group"
        disabled={isLoading}
      >
        <MapPinIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        <span className="text-sm text-gray-700 truncate font-medium">
          {isLoading ? 'Detecting...' : address || 'Select Location'}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                autoFocus
              />
            </div>

            {/* Use Current Location Button */}
            <div className="p-2 border-b border-gray-100">
              <button
                onClick={handleUseCurrentLocation}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-colors text-left group"
              >
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <MapPinSolidIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Use Current Location</p>
                  <p className="text-xs text-gray-500">Enable GPS to auto-detect</p>
                </div>
              </button>
            </div>

            {/* Location List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredLocations.length > 0 ? (
                <div className="p-2">
                  {filteredLocations.map((location) => {
                    const isSelected = address === location.name
                    return (
                      <button
                        key={location.name}
                        onClick={() => handleSelectLocation(location)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-left ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <MapPinIcon className={`w-4 h-4 ${isSelected ? 'text-emerald-500' : 'text-gray-400'}`} />
                          <span className="text-sm font-medium">{location.name}</span>
                        </div>
                        {isSelected && (
                          <CheckIcon className="w-4 h-4 text-emerald-500" />
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500">No cities found</p>
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="p-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                More cities coming soon! 🚀
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
