// Enhanced Monitoring Utility for Production-Ready Application
// Provides event tracking, error monitoring, and performance metrics

import { logger, perfMonitor } from './logger'

// Event types for tracking
export type EventCategory =
  | 'auth'
  | 'order'
  | 'cart'
  | 'navigation'
  | 'search'
  | 'provider'
  | 'user'
  | 'error'
  | 'performance'

export interface TrackingEvent {
  category: EventCategory
  action: string
  label?: string
  value?: number
  metadata?: Record<string, unknown>
  timestamp: string
  sessionId: string
  userId?: string
}

// Session management
const SESSION_KEY = 'jain-food-session-id'
let sessionId = localStorage.getItem(SESSION_KEY)
if (!sessionId) {
  sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  localStorage.setItem(SESSION_KEY, sessionId)
}

// Event storage for analytics
const MAX_EVENTS = 500
let events: TrackingEvent[] = []

// Load events from storage
try {
  const stored = localStorage.getItem('jain-food-events')
  if (stored) {
    events = JSON.parse(stored)
  }
} catch {
  events = []
}

// Save events to storage
function persistEvents() {
  try {
    localStorage.setItem('jain-food-events', JSON.stringify(events.slice(-MAX_EVENTS)))
  } catch {
    // Storage full - clear old events
    events = events.slice(-100)
  }
}

// Get current user ID from auth store (lazy load to avoid circular deps)
function getCurrentUserId(): string | undefined {
  try {
    const authData = localStorage.getItem('jain-food-auth')
    if (authData) {
      const parsed = JSON.parse(authData)
      return parsed.state?.user?.id
    }
  } catch {
    return undefined
  }
}

// Main tracking function
export function trackEvent(
  category: EventCategory,
  action: string,
  label?: string,
  value?: number,
  metadata?: Record<string, unknown>
): void {
  const event: TrackingEvent = {
    category,
    action,
    label,
    value,
    metadata,
    timestamp: new Date().toISOString(),
    sessionId: sessionId!,
    userId: getCurrentUserId(),
  }

  events.push(event)
  persistEvents()

  // Log to console in development
  logger.debug('Monitoring', `Event: ${category}/${action}`, { label, value, metadata })

  // In production, send to analytics service
  if (import.meta.env.PROD && import.meta.env.VITE_ANALYTICS_URL) {
    sendToAnalytics(event).catch(() => {})
  }
}

// Send event to analytics backend
async function sendToAnalytics(event: TrackingEvent): Promise<void> {
  const url = import.meta.env.VITE_ANALYTICS_URL
  if (!url) return

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
  } catch {
    // Silently fail - don't disrupt user experience
  }
}

// Convenience functions for common events
export const analytics = {
  // Authentication events
  login: (method: 'otp' | 'token' = 'otp') => {
    trackEvent('auth', 'login', method)
  },

  logout: () => {
    trackEvent('auth', 'logout')
  },

  signup: () => {
    trackEvent('auth', 'signup')
  },

  // Order events
  orderCreated: (orderId: string, total: number, itemCount: number) => {
    trackEvent('order', 'created', orderId, total, { itemCount })
  },

  orderConfirmed: (orderId: string) => {
    trackEvent('order', 'confirmed', orderId)
  },

  orderCancelled: (orderId: string, reason?: string) => {
    trackEvent('order', 'cancelled', orderId, undefined, { reason })
  },

  orderCompleted: (orderId: string) => {
    trackEvent('order', 'completed', orderId)
  },

  // Cart events
  addToCart: (itemId: string, itemName: string, price: number, providerId: string) => {
    trackEvent('cart', 'add_item', itemName, price, { itemId, providerId })
  },

  removeFromCart: (itemId: string, itemName: string) => {
    trackEvent('cart', 'remove_item', itemName, undefined, { itemId })
  },

  cartCleared: () => {
    trackEvent('cart', 'cleared')
  },

  checkoutStarted: (total: number, itemCount: number) => {
    trackEvent('cart', 'checkout_started', undefined, total, { itemCount })
  },

  // Navigation events
  pageView: (pageName: string, path: string) => {
    trackEvent('navigation', 'page_view', pageName, undefined, { path })
  },

  // Search events
  search: (query: string, resultCount: number, filters?: Record<string, unknown>) => {
    trackEvent('search', 'search', query, resultCount, { filters })
  },

  searchResultClick: (itemId: string, position: number) => {
    trackEvent('search', 'result_click', itemId, position)
  },

  // Provider events
  providerViewed: (providerId: string, providerName: string) => {
    trackEvent('provider', 'viewed', providerName, undefined, { providerId })
  },

  providerCreated: (providerId: string) => {
    trackEvent('provider', 'created', providerId)
  },

  // User events
  profileUpdated: (fields: string[]) => {
    trackEvent('user', 'profile_updated', fields.join(','))
  },

  preferencesChanged: (preferences: Record<string, unknown>) => {
    trackEvent('user', 'preferences_changed', undefined, undefined, preferences)
  },

  // Error events
  error: (errorType: string, message: string, stack?: string) => {
    trackEvent('error', errorType, message, undefined, { stack })
  },

  apiError: (endpoint: string, status: number, message: string) => {
    trackEvent('error', 'api_error', endpoint, status, { message })
  },

  // Performance events
  pageLoad: (pageName: string, loadTime: number) => {
    trackEvent('performance', 'page_load', pageName, loadTime)
  },

  apiLatency: (endpoint: string, latency: number) => {
    trackEvent('performance', 'api_latency', endpoint, latency)
  },
}

// Performance monitoring with automatic tracking
export const performanceMonitor = {
  ...perfMonitor,

  // Track page load performance
  trackPageLoad: (pageName: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.startTime
        analytics.pageLoad(pageName, loadTime)
        logger.info('Performance', `Page ${pageName} loaded in ${loadTime.toFixed(2)}ms`)
      }
    }
  },

  // Track component render time
  trackRender: (componentName: string, callback: () => void) => {
    const start = performance.now()
    callback()
    const duration = performance.now() - start
    if (duration > 16) { // More than one frame (60fps)
      logger.warn('Performance', `Slow render: ${componentName} took ${duration.toFixed(2)}ms`)
    }
    return duration
  },

  // Track async operation
  trackAsync: async <T>(operationName: string, operation: () => Promise<T>): Promise<T> => {
    const start = performance.now()
    try {
      const result = await operation()
      const duration = performance.now() - start
      logger.debug('Performance', `${operationName} completed in ${duration.toFixed(2)}ms`)
      return result
    } catch (error) {
      const duration = performance.now() - start
      logger.error('Performance', `${operationName} failed after ${duration.toFixed(2)}ms`, { error })
      throw error
    }
  },
}

// Health check utilities
export const healthCheck = {
  // Check if API is reachable
  async checkApi(): Promise<{ status: 'ok' | 'error'; latency?: number; error?: string }> {
    const start = performance.now()
    try {
      const response = await fetch('/health', { method: 'GET' })
      const latency = performance.now() - start
      if (response.ok) {
        return { status: 'ok', latency }
      }
      return { status: 'error', latency, error: `HTTP ${response.status}` }
    } catch (error) {
      return { status: 'error', error: String(error) }
    }
  },

  // Check localStorage availability
  checkStorage(): { status: 'ok' | 'error'; error?: string } {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return { status: 'ok' }
    } catch (error) {
      return { status: 'error', error: String(error) }
    }
  },

  // Check network connectivity
  checkNetwork(): { status: 'online' | 'offline' } {
    return { status: navigator.onLine ? 'online' : 'offline' }
  },

  // Run all health checks
  async runAll(): Promise<{
    api: { status: 'ok' | 'error'; latency?: number; error?: string }
    storage: { status: 'ok' | 'error'; error?: string }
    network: { status: 'online' | 'offline' }
  }> {
    const [api, storage, network] = await Promise.all([
      this.checkApi(),
      Promise.resolve(this.checkStorage()),
      Promise.resolve(this.checkNetwork()),
    ])
    return { api, storage, network }
  },
}

// Get all tracked events for debugging
export function getEvents(): TrackingEvent[] {
  return [...events]
}

// Get events by category
export function getEventsByCategory(category: EventCategory): TrackingEvent[] {
  return events.filter(e => e.category === category)
}

// Clear all tracked events
export function clearEvents(): void {
  events = []
  localStorage.removeItem('jain-food-events')
  logger.info('Monitoring', 'Events cleared')
}

// Export session ID for debugging
export function getSessionId(): string {
  return sessionId!
}

export default analytics
