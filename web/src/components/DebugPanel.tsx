import { useState, useEffect } from 'react'
import { logger, debugInfo, perfMonitor } from '../utils/logger'
import { useAuthStore } from '../store/authStore'
import { useLocationStore } from '../store/locationStore'
import { useCartStore } from '../store/cartStore'

interface DebugPanelProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export default function DebugPanel({ position = 'bottom-right' }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'logs' | 'state' | 'network' | 'perf' | 'system'>('logs')
  const [logs, setLogs] = useState(logger.getLogs())
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [networkRequests, setNetworkRequests] = useState<Array<{
    method: string
    url: string
    status: number
    duration: number
    timestamp: string
  }>>([])

  // Only show in development
  if (!import.meta.env.DEV) return null

  const authState = useAuthStore()
  const locationState = useLocationStore()
  const cartState = useCartStore()

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(logger.getLogs())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

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
            {log.data && (
              <pre className="mt-1 text-xs opacity-75 overflow-auto max-h-20">
                {JSON.stringify(log.data, null, 2)}
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
    </div>
  )

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
        title="Debug Panel"
      >
        🐛
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-96 bg-white rounded-lg shadow-2xl border overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
            <span className="font-semibold">Debug Panel</span>
            <button onClick={() => setIsOpen(false)} className="hover:bg-gray-700 rounded p-1">
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            {['logs', 'state', 'network', 'perf', 'system'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`flex-1 px-2 py-2 text-xs font-medium ${
                  activeTab === tab
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-4">
            {activeTab === 'logs' && renderLogs()}
            {activeTab === 'state' && renderState()}
            {activeTab === 'network' && renderNetwork()}
            {activeTab === 'perf' && renderPerformance()}
            {activeTab === 'system' && renderSystem()}
          </div>
        </div>
      )}
    </div>
  )
}
