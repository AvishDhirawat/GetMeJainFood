// Frontend Logger Utility for Development and Debugging
// Provides structured logging with different levels and optional remote logging

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  message: string
  data?: unknown
  stack?: string
}

interface LoggerConfig {
  enabled: boolean
  minLevel: LogLevel
  remoteLogging: boolean
  remoteUrl?: string
  maxLocalLogs: number
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '#6B7280',
  info: '#3B82F6',
  warn: '#F59E0B',
  error: '#EF4444',
}

class Logger {
  private config: LoggerConfig
  private logs: LogEntry[] = []

  constructor() {
    this.config = {
      enabled: import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGGING === 'true',
      minLevel: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'debug',
      remoteLogging: import.meta.env.VITE_REMOTE_LOGGING === 'true',
      remoteUrl: import.meta.env.VITE_LOG_URL,
      maxLocalLogs: 1000,
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel]
  }

  private formatTime(): string {
    return new Date().toISOString()
  }

  private createEntry(level: LogLevel, component: string, message: string, data?: unknown): LogEntry {
    const entry: LogEntry = {
      timestamp: this.formatTime(),
      level,
      component,
      message,
    }

    if (data !== undefined) {
      entry.data = data
    }

    if (level === 'error' && data instanceof Error) {
      entry.stack = data.stack
    }

    return entry
  }

  private storeLog(entry: LogEntry): void {
    this.logs.push(entry)
    if (this.logs.length > this.config.maxLocalLogs) {
      this.logs.shift()
    }
  }

  private consoleLog(entry: LogEntry): void {
    const color = LOG_COLORS[entry.level]
    const prefix = `%c[${entry.level.toUpperCase()}] ${entry.timestamp} [${entry.component}]`
    const style = `color: ${color}; font-weight: bold;`

    switch (entry.level) {
      case 'debug':
        console.debug(prefix, style, entry.message, entry.data || '')
        break
      case 'info':
        console.info(prefix, style, entry.message, entry.data || '')
        break
      case 'warn':
        console.warn(prefix, style, entry.message, entry.data || '')
        break
      case 'error':
        console.error(prefix, style, entry.message, entry.data || '')
        if (entry.stack) console.error(entry.stack)
        break
    }
  }

  private async sendRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteLogging || !this.config.remoteUrl) return

    try {
      await fetch(this.config.remoteUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
    } catch {
      // Silently fail remote logging
    }
  }

  private log(level: LogLevel, component: string, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return

    const entry = this.createEntry(level, component, message, data)
    this.storeLog(entry)
    this.consoleLog(entry)

    if (level === 'error' || level === 'warn') {
      this.sendRemote(entry)
    }
  }

  debug(component: string, message: string, data?: unknown): void {
    this.log('debug', component, message, data)
  }

  info(component: string, message: string, data?: unknown): void {
    this.log('info', component, message, data)
  }

  warn(component: string, message: string, data?: unknown): void {
    this.log('warn', component, message, data)
  }

  error(component: string, message: string, data?: unknown): void {
    this.log('error', component, message, data)
  }

  // Get all stored logs
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  // Get logs filtered by level
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level)
  }

  // Get logs filtered by component
  getLogsByComponent(component: string): LogEntry[] {
    return this.logs.filter(log => log.component === component)
  }

  // Clear all stored logs
  clearLogs(): void {
    this.logs = []
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Download logs as file
  downloadLogs(): void {
    const blob = new Blob([this.exportLogs()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jainfood-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Performance measurement
  time(label: string): void {
    if (this.config.enabled) {
      console.time(`[PERF] ${label}`)
    }
  }

  timeEnd(label: string): void {
    if (this.config.enabled) {
      console.timeEnd(`[PERF] ${label}`)
    }
  }

  // Group logs
  group(label: string): void {
    if (this.config.enabled) {
      console.group(label)
    }
  }

  groupEnd(): void {
    if (this.config.enabled) {
      console.groupEnd()
    }
  }
}

// Singleton instance
export const logger = new Logger()

// Performance monitoring utility
export const perfMonitor = {
  marks: new Map<string, number>(),

  start(name: string): void {
    this.marks.set(name, performance.now())
    logger.debug('Performance', `Started: ${name}`)
  },

  end(name: string): number | null {
    const start = this.marks.get(name)
    if (!start) return null

    const duration = performance.now() - start
    this.marks.delete(name)
    logger.info('Performance', `${name} took ${duration.toFixed(2)}ms`, { duration })
    return duration
  },

  measure(name: string, fn: () => void): number {
    const start = performance.now()
    fn()
    const duration = performance.now() - start
    logger.info('Performance', `${name} took ${duration.toFixed(2)}ms`, { duration })
    return duration
  },

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    logger.info('Performance', `${name} took ${duration.toFixed(2)}ms`, { duration })
    return result
  },
}

// Error boundary helper
export const errorReporter = {
  report(error: Error, context?: Record<string, unknown>): void {
    logger.error('ErrorReporter', error.message, {
      name: error.name,
      stack: error.stack,
      context,
    })

    // In production, you could send to an error tracking service
    if (import.meta.env.PROD && import.meta.env.VITE_ERROR_TRACKING_URL) {
      fetch(import.meta.env.VITE_ERROR_TRACKING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          context,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {})
    }
  },
}

// Debug panel data
export const debugInfo = {
  getSystemInfo(): Record<string, unknown> {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      online: navigator.onLine,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      memory: (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory
        ? {
            usedHeap: `${Math.round((performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize / 1024 / 1024)}MB`,
            totalHeap: `${Math.round((performance as unknown as { memory: { totalJSHeapSize: number } }).memory.totalJSHeapSize / 1024 / 1024)}MB`,
          }
        : 'N/A',
    }
  },

  getAppInfo(): Record<string, unknown> {
    return {
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      environment: import.meta.env.MODE,
      apiUrl: import.meta.env.VITE_API_URL || '/v1',
      mockMode: import.meta.env.VITE_USE_MOCK_API === 'true',
    }
  },
}

export default logger
