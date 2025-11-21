package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/jwt"
)

type contextKey string

const UserContextKey contextKey = "user"

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error":"Token no proporcionado"}`, http.StatusUnauthorized)
			return
		}

		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		claims, err := jwt.ValidateToken(tokenString)
		if err != nil {
			http.Error(w, `{"error":"Token inválido"}`, http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func RequireRole(allowedRoles ...entities.Rol) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(UserContextKey).(*jwt.Claims)
			if !ok {
				http.Error(w, `{"error":"No autorizado"}`, http.StatusUnauthorized)
				return
			}

			for _, rol := range allowedRoles {
				if claims.Rol == rol {
					next.ServeHTTP(w, r)
					return
				}
			}

			http.Error(w, `{"error":"Acceso denegado"}`, http.StatusForbidden)
		})
	}
}
