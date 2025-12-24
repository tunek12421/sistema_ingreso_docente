package middleware

import (
	"log"
	"net/http"
	"time"

	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/jwt"
)

// responseWriter wrapper para capturar el status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// AuditLog registra todas las peticiones HTTP con información de auditoría
func AuditLog(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Wrapper para capturar status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		// Ejecutar handler
		next.ServeHTTP(wrapped, r)

		// Obtener información del usuario si está autenticado
		userInfo := "anonymous"
		if claims, ok := r.Context().Value(UserContextKey).(*jwt.Claims); ok {
			userInfo = claims.Username
		}

		// Calcular duración
		duration := time.Since(start)

		// Log de auditoría
		log.Printf("[AUDIT] %s | %d | %s | %s | %s | %v",
			time.Now().Format("2006-01-02 15:04:05"),
			wrapped.statusCode,
			r.Method,
			r.URL.Path,
			userInfo,
			duration,
		)

		// Log adicional para operaciones sensibles
		if isSensitiveOperation(r.Method, r.URL.Path) {
			log.Printf("[AUDIT-SENSITIVE] User=%s Method=%s Path=%s IP=%s Status=%d",
				userInfo,
				r.Method,
				r.URL.Path,
				getClientIP(r),
				wrapped.statusCode,
			)
		}
	})
}

// isSensitiveOperation determina si una operación es sensible
func isSensitiveOperation(method, path string) bool {
	// Operaciones de escritura en recursos sensibles
	sensitivePatterns := []string{
		"/usuarios",
		"/login",
		"/password",
	}

	if method == "POST" || method == "PUT" || method == "DELETE" || method == "PATCH" {
		for _, pattern := range sensitivePatterns {
			if len(path) >= len(pattern) && path[:len(pattern)] == pattern {
				return true
			}
		}
	}

	return false
}
