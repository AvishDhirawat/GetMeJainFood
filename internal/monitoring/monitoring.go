package monitoring

import (
	"context"
	"fmt"
	"net/http"
	"runtime"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// Metrics holds application metrics
type Metrics struct {
	mu sync.RWMutex

	TotalRequests    uint64
	ActiveRequests   int64
	RequestsByMethod map[string]uint64
	RequestsByStatus map[int]uint64
	TotalLatencyNs   uint64
	SlowRequests     uint64
	TotalErrors      uint64
	ErrorsByType     map[string]uint64
	StartTime        time.Time
	Custom           map[string]float64
}

var (
	metrics     *Metrics
	metricsOnce sync.Once
)

// GetMetrics returns the singleton metrics instance
func GetMetrics() *Metrics {
	metricsOnce.Do(func() {
		metrics = &Metrics{
			RequestsByMethod: make(map[string]uint64),
			RequestsByStatus: make(map[int]uint64),
			ErrorsByType:     make(map[string]uint64),
			Custom:           make(map[string]float64),
			StartTime:        time.Now(),
		}
	})
	return metrics
}

// RecordRequest records request metrics
func (m *Metrics) RecordRequest(method string, status int, latency time.Duration) {
	atomic.AddUint64(&m.TotalRequests, 1)
	atomic.AddUint64(&m.TotalLatencyNs, uint64(latency.Nanoseconds()))

	m.mu.Lock()
	m.RequestsByMethod[method]++
	m.RequestsByStatus[status]++
	m.mu.Unlock()

	if latency > time.Second {
		atomic.AddUint64(&m.SlowRequests, 1)
	}
}

// RecordError records an error
func (m *Metrics) RecordError(errorType string) {
	atomic.AddUint64(&m.TotalErrors, 1)
	m.mu.Lock()
	m.ErrorsByType[errorType]++
	m.mu.Unlock()
}

// GetSnapshot returns metrics snapshot
func (m *Metrics) GetSnapshot() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	total := atomic.LoadUint64(&m.TotalRequests)
	avgLatency := float64(0)
	if total > 0 {
		avgLatency = float64(atomic.LoadUint64(&m.TotalLatencyNs)) / float64(total) / 1e6
	}

	return map[string]interface{}{
		"requests": map[string]interface{}{
			"total":          total,
			"active":         atomic.LoadInt64(&m.ActiveRequests),
			"by_method":      m.RequestsByMethod,
			"by_status":      m.RequestsByStatus,
			"slow":           atomic.LoadUint64(&m.SlowRequests),
			"avg_latency_ms": avgLatency,
		},
		"errors": map[string]interface{}{
			"total":   atomic.LoadUint64(&m.TotalErrors),
			"by_type": m.ErrorsByType,
		},
		"system": map[string]interface{}{
			"uptime_seconds": time.Since(m.StartTime).Seconds(),
			"goroutines":     runtime.NumGoroutine(),
			"memory_mb":      float64(memStats.Alloc) / 1024 / 1024,
			"gc_cycles":      memStats.NumGC,
		},
	}
}

// MetricsMiddleware records request metrics
func MetricsMiddleware() gin.HandlerFunc {
	m := GetMetrics()
	return func(c *gin.Context) {
		start := time.Now()
		atomic.AddInt64(&m.ActiveRequests, 1)

		c.Next()

		atomic.AddInt64(&m.ActiveRequests, -1)
		m.RecordRequest(c.Request.Method, c.Writer.Status(), time.Since(start))

		if c.Writer.Status() >= 400 {
			m.RecordError(http.StatusText(c.Writer.Status()))
		}
	}
}

// HealthHandler returns health check
func HealthHandler(version string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "ok",
			"timestamp": time.Now().Unix(),
			"version":   version,
		})
	}
}

// MetricsHandler returns metrics
func MetricsHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, GetMetrics().GetSnapshot())
	}
}

// RequestLogger returns structured request logger
func RequestLogger(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}
		c.Set("request_id", requestID)
		c.Header("X-Request-ID", requestID)

		c.Next()

		fields := []zap.Field{
			zap.String("request_id", requestID),
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.Int("status", c.Writer.Status()),
			zap.Duration("latency", time.Since(start)),
			zap.String("client_ip", c.ClientIP()),
		}

		if userID, exists := c.Get("user_id"); exists {
			fields = append(fields, zap.String("user_id", userID.(string)))
		}

		switch {
		case c.Writer.Status() >= 500:
			logger.Error("request", fields...)
		case c.Writer.Status() >= 400:
			logger.Warn("request", fields...)
		default:
			logger.Info("request", fields...)
		}
	}
}

// DebugHandler returns debug info (dev only)
func DebugHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		var memStats runtime.MemStats
		runtime.ReadMemStats(&memStats)

		c.JSON(http.StatusOK, gin.H{
			"runtime": gin.H{
				"go_version":   runtime.Version(),
				"num_cpu":      runtime.NumCPU(),
				"num_goroutine": runtime.NumGoroutine(),
				"gomaxprocs":   runtime.GOMAXPROCS(0),
			},
			"memory": gin.H{
				"alloc_mb":       fmt.Sprintf("%.2f", float64(memStats.Alloc)/1024/1024),
				"total_alloc_mb": fmt.Sprintf("%.2f", float64(memStats.TotalAlloc)/1024/1024),
				"sys_mb":         fmt.Sprintf("%.2f", float64(memStats.Sys)/1024/1024),
				"gc_cycles":      memStats.NumGC,
			},
			"metrics": GetMetrics().GetSnapshot(),
		})
	}
}

// DBHealthChecker checks database health
type DBHealthChecker struct {
	PingFunc func(ctx context.Context) error
}

func (d *DBHealthChecker) Check(ctx context.Context) (string, error) {
	if err := d.PingFunc(ctx); err != nil {
		return "unhealthy", err
	}
	return "healthy", nil
}

// RedisHealthChecker checks Redis health
type RedisHealthChecker struct {
	PingFunc func(ctx context.Context) error
}

func (r *RedisHealthChecker) Check(ctx context.Context) (string, error) {
	if err := r.PingFunc(ctx); err != nil {
		return "unhealthy", err
	}
	return "healthy", nil
}
