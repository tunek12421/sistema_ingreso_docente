package middleware

import (
	"net/http"
	"os"
)

// SecurityHeaders agrega headers de seguridad HTTP a todas las respuestas
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Prevenir clickjacking
		w.Header().Set("X-Frame-Options", "DENY")

		// Prevenir MIME type sniffing
		w.Header().Set("X-Content-Type-Options", "nosniff")

		// Protección XSS (para navegadores antiguos)
		w.Header().Set("X-XSS-Protection", "1; mode=block")

		// Referrer Policy - limitar información enviada
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// Permissions Policy - deshabilitar APIs sensibles
		w.Header().Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

		// Content Security Policy básica para API
		w.Header().Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")

		// HSTS solo en producción (requiere HTTPS)
		if os.Getenv("GO_ENV") == "production" {
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}

		// Cache control para respuestas de API
		w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, private")
		w.Header().Set("Pragma", "no-cache")

		next.ServeHTTP(w, r)
	})
}
