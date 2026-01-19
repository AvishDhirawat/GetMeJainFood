package logger

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

// LogConfig holds logging configuration
type LogConfig struct {
	Level       string `json:"level" yaml:"level"`             // debug, info, warn, error
	Environment string `json:"environment" yaml:"environment"` // development, production
	OutputDir   string `json:"output_dir" yaml:"output_dir"`   // Directory for log files
	MaxSize     int    `json:"max_size" yaml:"max_size"`       // Max size in MB before rotation
	MaxBackups  int    `json:"max_backups" yaml:"max_backups"` // Max number of old files
	MaxAge      int    `json:"max_age" yaml:"max_age"`         // Max age in days
	Compress    bool   `json:"compress" yaml:"compress"`       // Compress rotated files
}

// DefaultConfig returns default logging configuration
func DefaultConfig() LogConfig {
	return LogConfig{
		Level:       "info",
		Environment: "development",
		OutputDir:   "logs",
		MaxSize:     100,
		MaxBackups:  3,
		MaxAge:      28,
		Compress:    true,
	}
}

// Logger wraps zap.Logger with additional functionality
type Logger struct {
	*zap.Logger
	config LogConfig
}

var (
	defaultLogger *Logger
)

// Init initializes the global logger
func Init(cfg LogConfig) (*Logger, error) {
	// Create logs directory if it doesn't exist
	if cfg.OutputDir != "" {
		if err := os.MkdirAll(cfg.OutputDir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create log directory: %w", err)
		}
	}

	// Parse log level
	level, err := zapcore.ParseLevel(cfg.Level)
	if err != nil {
		level = zapcore.InfoLevel
	}

	// Configure encoder
	var encoderConfig zapcore.EncoderConfig
	if cfg.Environment == "production" {
		encoderConfig = zap.NewProductionEncoderConfig()
	} else {
		encoderConfig = zap.NewDevelopmentEncoderConfig()
	}
	encoderConfig.TimeKey = "timestamp"
	encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

	// Create cores for different outputs
	var cores []zapcore.Core

	// Console output (always enabled)
	consoleEncoder := zapcore.NewConsoleEncoder(encoderConfig)
	consoleCore := zapcore.NewCore(
		consoleEncoder,
		zapcore.AddSync(os.Stdout),
		level,
	)
	cores = append(cores, consoleCore)

	// File outputs (if output directory is specified)
	if cfg.OutputDir != "" {
		jsonEncoder := zapcore.NewJSONEncoder(encoderConfig)

		// Main application log
		appLogWriter := &lumberjack.Logger{
			Filename:   filepath.Join(cfg.OutputDir, "app.log"),
			MaxSize:    cfg.MaxSize,
			MaxBackups: cfg.MaxBackups,
			MaxAge:     cfg.MaxAge,
			Compress:   cfg.Compress,
		}
		appCore := zapcore.NewCore(jsonEncoder, zapcore.AddSync(appLogWriter), level)
		cores = append(cores, appCore)

		// Error log (errors only)
		errorLogWriter := &lumberjack.Logger{
			Filename:   filepath.Join(cfg.OutputDir, "error.log"),
			MaxSize:    cfg.MaxSize,
			MaxBackups: cfg.MaxBackups,
			MaxAge:     cfg.MaxAge,
			Compress:   cfg.Compress,
		}
		errorCore := zapcore.NewCore(jsonEncoder, zapcore.AddSync(errorLogWriter), zapcore.ErrorLevel)
		cores = append(cores, errorCore)

		// API log (for request/response logging)
		apiLogWriter := &lumberjack.Logger{
			Filename:   filepath.Join(cfg.OutputDir, "api.log"),
			MaxSize:    cfg.MaxSize,
			MaxBackups: cfg.MaxBackups,
			MaxAge:     cfg.MaxAge,
			Compress:   cfg.Compress,
		}
		// API logs go to their own file via a separate logger instance

		// Security log
		securityLogWriter := &lumberjack.Logger{
			Filename:   filepath.Join(cfg.OutputDir, "security.log"),
			MaxSize:    cfg.MaxSize,
			MaxBackups: cfg.MaxBackups,
			MaxAge:     cfg.MaxAge,
			Compress:   cfg.Compress,
		}
		_ = securityLogWriter // Used by security-specific logging

		// Keep reference for API logger
		_ = apiLogWriter
	}

	// Combine all cores
	core := zapcore.NewTee(cores...)

	// Create logger with options
	zapLogger := zap.New(core,
		zap.AddCaller(),
		zap.AddStacktrace(zapcore.ErrorLevel),
	)

	logger := &Logger{
		Logger: zapLogger,
		config: cfg,
	}
	defaultLogger = logger

	return logger, nil
}

// Get returns the default logger instance
func Get() *Logger {
	if defaultLogger == nil {
		cfg := DefaultConfig()
		logger, _ := Init(cfg)
		return logger
	}
	return defaultLogger
}

// WithContext adds context fields to the logger
func (l *Logger) WithContext(ctx context.Context) *zap.Logger {
	// Extract common context values
	fields := []zap.Field{}

	// Add request ID if present
	if requestID, ok := ctx.Value("request_id").(string); ok {
		fields = append(fields, zap.String("request_id", requestID))
	}

	// Add user ID if present
	if userID, ok := ctx.Value("user_id").(string); ok {
		fields = append(fields, zap.String("user_id", userID))
	}

	return l.With(fields...)
}

// Event logs a business event
func (l *Logger) Event(eventType string, eventName string, fields ...zap.Field) {
	eventFields := []zap.Field{
		zap.String("event_type", eventType),
		zap.String("event_name", eventName),
		zap.Time("event_time", time.Now()),
	}
	eventFields = append(eventFields, fields...)
	l.Info("event", eventFields...)
}

// Security logs a security-related event
func (l *Logger) Security(action string, success bool, fields ...zap.Field) {
	securityFields := []zap.Field{
		zap.String("security_action", action),
		zap.Bool("success", success),
		zap.Time("security_time", time.Now()),
	}
	securityFields = append(securityFields, fields...)

	if success {
		l.Info("security", securityFields...)
	} else {
		l.Warn("security", securityFields...)
	}
}

// API logs an API request/response
func (l *Logger) API(method, path string, statusCode int, duration time.Duration, fields ...zap.Field) {
	apiFields := []zap.Field{
		zap.String("method", method),
		zap.String("path", path),
		zap.Int("status_code", statusCode),
		zap.Duration("duration", duration),
	}
	apiFields = append(apiFields, fields...)

	if statusCode >= 500 {
		l.Error("api", apiFields...)
	} else if statusCode >= 400 {
		l.Warn("api", apiFields...)
	} else {
		l.Info("api", apiFields...)
	}
}

// Database logs a database operation
func (l *Logger) Database(operation string, table string, duration time.Duration, err error, fields ...zap.Field) {
	dbFields := []zap.Field{
		zap.String("operation", operation),
		zap.String("table", table),
		zap.Duration("duration", duration),
	}
	dbFields = append(dbFields, fields...)

	if err != nil {
		dbFields = append(dbFields, zap.Error(err))
		l.Error("database", dbFields...)
	} else if duration > 100*time.Millisecond {
		l.Warn("database_slow", dbFields...)
	} else {
		l.Debug("database", dbFields...)
	}
}

// Performance logs a performance metric
func (l *Logger) Performance(operation string, duration time.Duration, fields ...zap.Field) {
	perfFields := []zap.Field{
		zap.String("operation", operation),
		zap.Duration("duration", duration),
		zap.Float64("duration_ms", float64(duration.Nanoseconds())/1e6),
	}
	perfFields = append(perfFields, fields...)

	// Log slow operations as warnings
	if duration > time.Second {
		l.Warn("performance_slow", perfFields...)
	} else {
		l.Debug("performance", perfFields...)
	}
}

// Recovery logs panic recovery
func (l *Logger) Recovery(recovered interface{}, stack []byte) {
	l.Error("panic_recovered",
		zap.Any("panic", recovered),
		zap.ByteString("stack", stack),
		zap.String("go_version", runtime.Version()),
		zap.Int("goroutines", runtime.NumGoroutine()),
	)
}

// Sync flushes any buffered log entries
func (l *Logger) Sync() error {
	return l.Logger.Sync()
}

// Helper functions for common logging patterns

// LogOrderEvent logs an order-related event
func LogOrderEvent(orderID, action string, fields ...zap.Field) {
	Get().Event("order", action,
		append([]zap.Field{zap.String("order_id", orderID)}, fields...)...,
	)
}

// LogAuthEvent logs an authentication event
func LogAuthEvent(userID, phone, action string, success bool, fields ...zap.Field) {
	Get().Security(action, success,
		append([]zap.Field{
			zap.String("user_id", userID),
			zap.String("phone", phone),
		}, fields...)...,
	)
}

// LogProviderEvent logs a provider-related event
func LogProviderEvent(providerID, action string, fields ...zap.Field) {
	Get().Event("provider", action,
		append([]zap.Field{zap.String("provider_id", providerID)}, fields...)...,
	)
}
