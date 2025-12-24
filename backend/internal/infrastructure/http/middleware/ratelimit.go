package middleware

import (
	"net/http"
	"strings"
	"sync"
	"time"
)

// RateLimiter implementa un rate limiter simple basado en token bucket por IP
type RateLimiter struct {
	visitors map[string]*visitor
	mu       sync.RWMutex
	rate     int           // requests permitidos
	window   time.Duration // ventana de tiempo
}

type visitor struct {
	count    int
	lastSeen time.Time
}

// NewRateLimiter crea un nuevo rate limiter
// rate: número de requests permitidos por ventana
// window: duración de la ventana (ej: time.Minute)
func NewRateLimiter(rate int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*visitor),
		rate:     rate,
		window:   window,
	}

	// Limpiar visitors antiguos cada minuto
	go rl.cleanupVisitors()

	return rl
}

// Limit es el middleware que aplica rate limiting
func (rl *RateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := getClientIP(r)

		if !rl.allow(ip) {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "60")
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"error":"Demasiadas solicitudes. Intente nuevamente en un momento."}`))
			return
		}

		next.ServeHTTP(w, r)
	})
}

// LimitHandler aplica rate limiting a un handler específico
func (rl *RateLimiter) LimitHandler(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip := getClientIP(r)

		if !rl.allow(ip) {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "60")
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"error":"Demasiadas solicitudes. Intente nuevamente en un momento."}`))
			return
		}

		next(w, r)
	}
}

func (rl *RateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	v, exists := rl.visitors[ip]
	now := time.Now()

	if !exists {
		rl.visitors[ip] = &visitor{count: 1, lastSeen: now}
		return true
	}

	// Si la ventana expiró, resetear contador
	if now.Sub(v.lastSeen) > rl.window {
		v.count = 1
		v.lastSeen = now
		return true
	}

	// Incrementar contador
	v.count++
	v.lastSeen = now

	return v.count <= rl.rate
}

func (rl *RateLimiter) cleanupVisitors() {
	for {
		time.Sleep(time.Minute)

		rl.mu.Lock()
		for ip, v := range rl.visitors {
			if time.Since(v.lastSeen) > 3*rl.window {
				delete(rl.visitors, ip)
			}
		}
		rl.mu.Unlock()
	}
}

// TrustProxy indica si confiar en headers de proxy (solo activar si hay proxy reverso configurado)
var TrustProxy = false

// TrustedProxies lista de IPs de proxies confiables (configurar según infraestructura)
var TrustedProxies = map[string]bool{
	"127.0.0.1": true,
	"::1":       true,
}

func getClientIP(r *http.Request) string {
	// Obtener IP directa del socket
	remoteAddr := r.RemoteAddr

	// Extraer solo la IP (sin puerto)
	if idx := strings.LastIndex(remoteAddr, ":"); idx != -1 {
		remoteAddr = remoteAddr[:idx]
	}

	// Solo confiar en headers de proxy si está habilitado Y viene de proxy confiable
	if TrustProxy && TrustedProxies[remoteAddr] {
		// X-Forwarded-For puede contener múltiples IPs: "client, proxy1, proxy2"
		// La primera IP es el cliente original
		forwarded := r.Header.Get("X-Forwarded-For")
		if forwarded != "" {
			// Tomar solo la primera IP (cliente original)
			if idx := strings.Index(forwarded, ","); idx != -1 {
				return strings.TrimSpace(forwarded[:idx])
			}
			return strings.TrimSpace(forwarded)
		}

		realIP := r.Header.Get("X-Real-IP")
		if realIP != "" {
			return strings.TrimSpace(realIP)
		}
	}

	// Por defecto, usar la IP del socket (más seguro)
	return remoteAddr
}
