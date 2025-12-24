package middleware

import (
	"os"
	"strings"

	"github.com/rs/cors"
)

// CORS configura el middleware de CORS con orígenes permitidos desde variable de entorno
// En producción, configurar ALLOWED_ORIGINS con el dominio específico (ej: "https://app.upds.tech")
func CORS() *cors.Cors {
	allowedOrigins := getOrigins()

	return cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Requested-With"},
		AllowCredentials: true,
		ExposedHeaders:   []string{"Content-Length"},
		MaxAge:           86400, // 24 horas de cache para preflight
	})
}

// getOrigins obtiene los orígenes permitidos desde la variable de entorno
// Para múltiples orígenes, separar por comas: "https://app.upds.tech,https://admin.upds.tech"
func getOrigins() []string {
	originsEnv := os.Getenv("ALLOWED_ORIGINS")

	// En desarrollo, permitir localhost si no hay configuración
	if originsEnv == "" {
		env := os.Getenv("GO_ENV")
		if env == "production" {
			// En producción sin configuración, denegar todo (seguro por defecto)
			return []string{}
		}
		// Solo en desarrollo permitir localhost
		return []string{
			"http://localhost:3000",
			"http://localhost:5173",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:5173",
		}
	}

	// Parsear orígenes separados por comas
	origins := strings.Split(originsEnv, ",")
	var cleanOrigins []string
	for _, origin := range origins {
		trimmed := strings.TrimSpace(origin)
		if trimmed != "" && trimmed != "*" { // Nunca permitir wildcard
			cleanOrigins = append(cleanOrigins, trimmed)
		}
	}

	return cleanOrigins
}
