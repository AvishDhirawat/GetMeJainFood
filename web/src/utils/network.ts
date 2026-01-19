// Network monitoring and API request logging utilities
import { logger } from './logger'
import { analytics } from './monitoring'

export interface NetworkRequest {
  id: string
  method: string
  url: string
  startTime: number
  endTime?: number
  status?: number
  duration?: number
  error?: string
  requestHeaders?: Record<string, string>
  responseHeaders?: Record<string, string>
  requestSize?: number
  responseSize?: number
}

// Store for network requests
const MAX_REQUESTS = 100
let networkRequests: NetworkRequest[] = []

// Generate unique request ID
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Record a new request
export function recordRequest(request: Omit<NetworkRequest, 'id'>): string {
  const id = generateRequestId()
  const newRequest: NetworkRequest = { ...request, id }

  networkRequests.push(newRequest)

  // Keep only last MAX_REQUESTS
  if (networkRequests.length > MAX_REQUESTS) {
    networkRequests = networkRequests.slice(-MAX_REQUESTS)
  }

  return id
}

// Update a request with response info
export function updateRequest(id: string, update: Partial<NetworkRequest>): void {
  const index = networkRequests.findIndex(r => r.id === id)
  if (index !== -1) {
    networkRequests[index] = { ...networkRequests[index], ...update }

    // Log slow requests
    const request = networkRequests[index]
    if (request.duration && request.duration > 3000) {
      logger.warn('Network', `Slow request: ${request.method} ${request.url}`, {
        duration: request.duration,
        status: request.status,
      })
    }

    // Track API latency for analytics
    if (request.duration && request.url.includes('/v1/')) {
      analytics.apiLatency(request.url, request.duration)
    }

    // Track errors
    if (request.status && request.status >= 400) {
      analytics.apiError(request.url, request.status, request.error || 'Unknown error')
    }
  }
}

// Get all recorded requests
export function getNetworkRequests(): NetworkRequest[] {
  return [...networkRequests]
}

// Get requests by status
export function getRequestsByStatus(status: 'success' | 'error' | 'pending'): NetworkRequest[] {
  return networkRequests.filter(r => {
    if (status === 'pending') return !r.status
    if (status === 'success') return r.status && r.status < 400
    if (status === 'error') return r.status && r.status >= 400
    return false
  })
}

// Get average response time
export function getAverageResponseTime(): number {
  const completedRequests = networkRequests.filter(r => r.duration)
  if (completedRequests.length === 0) return 0
  const total = completedRequests.reduce((sum, r) => sum + (r.duration || 0), 0)
  return total / completedRequests.length
}

// Get error rate
export function getErrorRate(): number {
  const completedRequests = networkRequests.filter(r => r.status)
  if (completedRequests.length === 0) return 0
  const errors = completedRequests.filter(r => r.status && r.status >= 400)
  return (errors.length / completedRequests.length) * 100
}

// Clear all requests
export function clearNetworkRequests(): void {
  networkRequests = []
  logger.info('Network', 'Network request history cleared')
}

// Network statistics
export function getNetworkStats(): {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  pendingRequests: number
  averageResponseTime: number
  errorRate: number
} {
  const completed = networkRequests.filter(r => r.status)
  const successful = completed.filter(r => r.status! < 400)
  const failed = completed.filter(r => r.status! >= 400)
  const pending = networkRequests.filter(r => !r.status)

  return {
    totalRequests: networkRequests.length,
    successfulRequests: successful.length,
    failedRequests: failed.length,
    pendingRequests: pending.length,
    averageResponseTime: getAverageResponseTime(),
    errorRate: getErrorRate(),
  }
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  retryOn: number[]
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryOn: [408, 429, 500, 502, 503, 504],
}

// Fetch with retry logic
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig: Partial<RetryConfig> = {}
): Promise<Response> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    const requestId = recordRequest({
      method: options.method || 'GET',
      url,
      startTime: performance.now(),
    })

    try {
      const response = await fetch(url, options)
      const endTime = performance.now()
      const request = networkRequests.find(r => r.id === requestId)

      updateRequest(requestId, {
        endTime,
        duration: endTime - (request?.startTime || endTime),
        status: response.status,
      })

      // Check if we should retry
      if (config.retryOn.includes(response.status) && attempt < config.maxRetries) {
        const delay = Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay)
        logger.warn('Network', `Request failed with ${response.status}, retrying in ${delay}ms`, {
          url,
          attempt: attempt + 1,
          maxRetries: config.maxRetries,
        })
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      return response
    } catch (error) {
      lastError = error as Error
      const endTime = performance.now()
      const request = networkRequests.find(r => r.id === requestId)

      updateRequest(requestId, {
        endTime,
        duration: endTime - (request?.startTime || endTime),
        status: 0,
        error: lastError.message,
      })

      // Retry on network errors
      if (attempt < config.maxRetries) {
        const delay = Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay)
        logger.warn('Network', `Network error, retrying in ${delay}ms`, {
          url,
          error: lastError.message,
          attempt: attempt + 1,
        })
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
    }
  }

  throw lastError || new Error('Request failed after retries')
}

// Connection status monitoring
let isOnline = navigator.onLine
let connectionChangeListeners: ((online: boolean) => void)[] = []

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true
    logger.info('Network', 'Connection restored')
    connectionChangeListeners.forEach(listener => listener(true))
  })

  window.addEventListener('offline', () => {
    isOnline = false
    logger.warn('Network', 'Connection lost')
    connectionChangeListeners.forEach(listener => listener(false))
  })
}

export function isNetworkOnline(): boolean {
  return isOnline
}

export function onConnectionChange(listener: (online: boolean) => void): () => void {
  connectionChangeListeners.push(listener)
  return () => {
    connectionChangeListeners = connectionChangeListeners.filter(l => l !== listener)
  }
}

export default {
  recordRequest,
  updateRequest,
  getNetworkRequests,
  getRequestsByStatus,
  getNetworkStats,
  clearNetworkRequests,
  fetchWithRetry,
  isNetworkOnline,
  onConnectionChange,
}
