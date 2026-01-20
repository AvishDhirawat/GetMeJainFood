import { useState, useEffect } from 'react'
import { logger, debugInfo } from '../utils/logger'
import { getEvents, getSessionId, healthCheck } from '../utils/monitoring'
import { getNetworkStats } from '../utils/network'
import { useAuthStore } from '../store/authStore'
import { useLocationStore } from '../store/locationStore'
import { useCartStore } from '../store/cartStore'
import { authApi } from '../api/client'

interface DebugPanelProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

/**
 * Debug Panel - DEVELOPMENT ONLY
 *
 * This component is completely stripped from production builds.
 * It provides logging, state inspection, network monitoring, and performance tools
 * for developers during local development.
 *
 * SECURITY: This component will NOT render in production under any circumstances.
 * There are no keyboard shortcuts or hidden ways to access it in production.
 */
export default function DebugPanel({ position = 'bottom-right' }: DebugPanelProps) {
  // CRITICAL: Block rendering entirely in production - no exceptions
  // This check happens before any hooks to ensure complete exclusion
  if (!import.meta.env.DEV) {
    return null
  }

  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'logs' | 'state' | 'network' | 'perf' | 'system' | 'events' | 'otp'>('logs')
  const [logs, setLogs] = useState(logger.getLogs())
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [networkRequests, setNetworkRequests] = useState<Array<{
    method: string
    url: string
    status: number
    duration: number
    timestamp: string
  }>>([])
  const [networkStats, setNetworkStats] = useState(getNetworkStats())
  const [healthStatus, setHealthStatus] = useState<{ api: string; storage: string; network: string } | null>(null)

  // OTP Testing State
  const [testPhone, setTestPhone] = useState('9876543210')
  const [testOtp, setTestOtp] = useState('')
  const [testName, setTestName] = useState('Test User')
  const [testRole, setTestRole] = useState<'buyer' | 'provider'>('buyer')
  const [otpTestResult, setOtpTestResult] = useState<{
    action: string
    status: 'success' | 'error' | 'pending'
    message: string
    data?: Record<string, unknown>
  } | null>(null)
  const [isTestLoading, setIsTestLoading] = useState(false)

  const authState = useAuthStore()
  const locationState = useLocationStore()
  const cartState = useCartStore()

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(logger.getLogs())
      setNetworkStats(getNetworkStats())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Escape to close debug panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Intercept fetch for network monitoring
  useEffect(() => {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const start = performance.now()
      const [url, options] = args
      const method = (options?.method || 'GET').toUpperCase()

      try {
        const response = await originalFetch(...args)
        const duration = performance.now() - start

        setNetworkRequests(prev => [
          {
            method,
            url: url.toString(),
            status: response.status,
            duration: Math.round(duration),
            timestamp: new Date().toISOString(),
          },
          ...prev.slice(0, 49),
        ])

        return response
      } catch (error) {
        const duration = performance.now() - start
        setNetworkRequests(prev => [
          {
            method,
            url: url.toString(),
            status: 0,
            duration: Math.round(duration),
            timestamp: new Date().toISOString(),
          },
          ...prev.slice(0, 49),
        ])
        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  }

  const filteredLogs = filterLevel === 'all'
    ? logs
    : logs.filter(log => log.level === filterLevel)

  const renderLogs = () => (
    <div className="space-y-2">
      <div className="flex gap-2 mb-3">
        {['all', 'debug', 'info', 'warn', 'error'].map(level => (
          <button
            key={level}
            onClick={() => setFilterLevel(level)}
            className={`px-2 py-1 text-xs rounded ${
              filterLevel === level
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {level.toUpperCase()}
          </button>
        ))}
        <button
          onClick={() => logger.clearLogs()}
          className="ml-auto px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Clear
        </button>
        <button
          onClick={() => logger.downloadLogs()}
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Export
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {filteredLogs.slice().reverse().map((log, i) => (
          <div
            key={i}
            className={`text-xs p-2 rounded font-mono ${
              log.level === 'error' ? 'bg-red-50 text-red-800' :
              log.level === 'warn' ? 'bg-yellow-50 text-yellow-800' :
              log.level === 'info' ? 'bg-blue-50 text-blue-800' :
              'bg-gray-50 text-gray-700'
            }`}
          >
            <div className="flex justify-between">
              <span className="font-semibold">[{log.level.toUpperCase()}] {log.component}</span>
              <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
            <div>{log.message}</div>
            {log.data !== undefined && (
              <pre className="mt-1 text-xs opacity-75 overflow-auto max-h-20">
                {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : String(log.data)}
              </pre>
            )}
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="text-gray-500 text-center py-4">No logs</div>
        )}
      </div>
    </div>
  )

  const renderState = () => (
    <div className="space-y-4 max-h-80 overflow-y-auto">
      <details open className="bg-gray-50 rounded-lg p-3">
        <summary className="font-semibold cursor-pointer">Auth State</summary>
        <pre className="mt-2 text-xs overflow-auto">
          {JSON.stringify({
            isAuthenticated: authState.isAuthenticated,
            isLoading: authState.isLoading,
            user: authState.user,
            hasToken: !!authState.token,
          }, null, 2)}
        </pre>
      </details>
      <details className="bg-gray-50 rounded-lg p-3">
        <summary className="font-semibold cursor-pointer">Location State</summary>
        <pre className="mt-2 text-xs overflow-auto">
          {JSON.stringify(locationState, null, 2)}
        </pre>
      </details>
      <details className="bg-gray-50 rounded-lg p-3">
        <summary className="font-semibold cursor-pointer">Cart State</summary>
        <pre className="mt-2 text-xs overflow-auto">
          {JSON.stringify({
            items: cartState.items,
            providerId: cartState.providerId,
            total: cartState.getTotal?.() || 0,
          }, null, 2)}
        </pre>
      </details>
    </div>
  )

  const renderNetwork = () => (
    <div className="max-h-80 overflow-y-auto">
      <div className="space-y-1">
        {networkRequests.map((req, i) => (
          <div
            key={i}
            className={`text-xs p-2 rounded ${
              req.status >= 400 ? 'bg-red-50' :
              req.status >= 200 && req.status < 300 ? 'bg-green-50' :
              'bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className={`font-semibold ${
                req.method === 'GET' ? 'text-blue-600' :
                req.method === 'POST' ? 'text-green-600' :
                req.method === 'PUT' ? 'text-yellow-600' :
                req.method === 'DELETE' ? 'text-red-600' : ''
              }`}>
                {req.method}
              </span>
              <span className={`${req.status >= 400 ? 'text-red-600' : 'text-green-600'}`}>
                {req.status || 'Failed'}
              </span>
              <span className="text-gray-500">{req.duration}ms</span>
            </div>
            <div className="truncate text-gray-600 mt-1">{req.url}</div>
          </div>
        ))}
        {networkRequests.length === 0 && (
          <div className="text-gray-500 text-center py-4">No requests</div>
        )}
      </div>
    </div>
  )

  const renderPerformance = () => {
    const entries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    return (
      <div className="space-y-3 max-h-80 overflow-y-auto text-sm">
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-semibold mb-2">Page Load Timing</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>DNS Lookup</span>
              <span>{Math.round(entries?.domainLookupEnd - entries?.domainLookupStart || 0)}ms</span>
            </div>
            <div className="flex justify-between">
              <span>TCP Connection</span>
              <span>{Math.round(entries?.connectEnd - entries?.connectStart || 0)}ms</span>
            </div>
            <div className="flex justify-between">
              <span>DOM Content Loaded</span>
              <span>{Math.round(entries?.domContentLoadedEventEnd - entries?.fetchStart || 0)}ms</span>
            </div>
            <div className="flex justify-between">
              <span>Page Load Complete</span>
              <span>{Math.round(entries?.loadEventEnd - entries?.fetchStart || 0)}ms</span>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-semibold mb-2">Memory (if available)</h4>
          <pre className="text-xs">
            {JSON.stringify(debugInfo.getSystemInfo().memory, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  const renderSystem = () => (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="font-semibold mb-2">App Info</h4>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(debugInfo.getAppInfo(), null, 2)}
        </pre>
      </div>
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="font-semibold mb-2">System Info</h4>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(debugInfo.getSystemInfo(), null, 2)}
        </pre>
      </div>
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="font-semibold mb-2">Session</h4>
        <div className="text-xs font-mono break-all">{getSessionId()}</div>
      </div>
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="font-semibold mb-2">Network Stats</h4>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(networkStats, null, 2)}
        </pre>
      </div>
      <button
        onClick={async () => {
          const health = await healthCheck.runAll()
          setHealthStatus({
            api: health.api.status,
            storage: health.storage.status,
            network: health.network.status,
          })
        }}
        className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
      >
        Run Health Check
      </button>
      {healthStatus && (
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-semibold mb-2">Health Status</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>API</span>
              <span className={healthStatus.api === 'ok' ? 'text-green-600' : 'text-red-600'}>
                {healthStatus.api}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Storage</span>
              <span className={healthStatus.storage === 'ok' ? 'text-green-600' : 'text-red-600'}>
                {healthStatus.storage}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Network</span>
              <span className={healthStatus.network === 'online' ? 'text-green-600' : 'text-red-600'}>
                {healthStatus.network}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderEvents = () => {
    const events = getEvents().slice(-50).reverse()
    return (
      <div className="max-h-80 overflow-y-auto">
        <div className="space-y-1">
          {events.map((event, i) => (
            <div key={i} className="text-xs p-2 rounded bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-primary-600">{event.category}</span>
                <span className="text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="text-gray-700">{event.action}</div>
              {event.label && <div className="text-gray-500 text-xs">{event.label}</div>}
              {event.metadata && (
                <pre className="mt-1 text-xs opacity-75 overflow-auto max-h-16">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              )}
            </div>
          ))}
          {events.length === 0 && (
            <div className="text-gray-500 text-center py-4">No events tracked</div>
          )}
        </div>
      </div>
    )
  }

  // OTP Testing Functions
  const handleTestCheckPhone = async () => {
    setIsTestLoading(true)
    setOtpTestResult({ action: 'Check Phone', status: 'pending', message: 'Checking...' })
    try {
      const result = await authApi.checkPhone(testPhone)
      setOtpTestResult({
        action: 'Check Phone',
        status: 'success',
        message: result.exists ? 'Phone exists (can login)' : 'Phone not found (can register)',
        data: result as Record<string, unknown>,
      })
    } catch (error) {
      setOtpTestResult({
        action: 'Check Phone',
        status: 'error',
        message: String(error),
      })
    } finally {
      setIsTestLoading(false)
    }
  }

  const handleTestSendOtp = async (purpose: 'login' | 'register') => {
    setIsTestLoading(true)
    setOtpTestResult({ action: `Send OTP (${purpose})`, status: 'pending', message: 'Sending...' })
    try {
      const result = await authApi.sendOtp(testPhone, purpose)
      if (result.otp) {
        setTestOtp(result.otp)
      }
      setOtpTestResult({
        action: `Send OTP (${purpose})`,
        status: 'success',
        message: result.otp ? `OTP: ${result.otp}` : 'OTP sent (check SMS)',
        data: result as Record<string, unknown>,
      })
    } catch (error) {
      setOtpTestResult({
        action: `Send OTP (${purpose})`,
        status: 'error',
        message: String(error),
      })
    } finally {
      setIsTestLoading(false)
    }
  }

  const handleTestRegister = async () => {
    if (!testOtp) {
      setOtpTestResult({ action: 'Register', status: 'error', message: 'OTP is required' })
      return
    }
    setIsTestLoading(true)
    setOtpTestResult({ action: 'Register', status: 'pending', message: 'Registering...' })
    try {
      const result = await authApi.register({
        phone: testPhone,
        otp: testOtp,
        name: testName,
        role: testRole,
      })
      setOtpTestResult({
        action: 'Register',
        status: 'success',
        message: `Registered! User ID: ${result.user_id}`,
        data: result as unknown as Record<string, unknown>,
      })
  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-700 transition-colors relative"
        title="Debug Panel (Ctrl+Shift+D x3 to enable in production)"
      >
        🐛
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-96 bg-white rounded-lg shadow-2xl border overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Developer Panel</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsOpen(false)} className="hover:bg-gray-700 rounded p-1">
                ✕
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            {['logs', 'state', 'network', 'otp', 'perf', 'events', 'system'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`flex-1 px-2 py-2 text-xs font-medium ${
                  activeTab === tab
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'otp' ? '🔑' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-4">
            {activeTab === 'logs' && renderLogs()}
            {activeTab === 'state' && renderState()}
            {activeTab === 'network' && renderNetwork()}
            {activeTab === 'otp' && renderOtpTesting()}
            {activeTab === 'perf' && renderPerformance()}
            {activeTab === 'events' && renderEvents()}
            {activeTab === 'system' && renderSystem()}
          </div>
        </div>
      )}
    </div>
  )
}
