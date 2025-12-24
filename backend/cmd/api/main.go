package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/sistema-ingreso-docente/backend/internal/domain/usecases"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/database"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/http/handlers"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/http/middleware"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/http/routes"
)

func main() {
	// Forzar uso de UTC para todas las operaciones de tiempo
	os.Setenv("TZ", "UTC")
	time.Local = time.UTC

	// Cargar variables de entorno desde archivo .env
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("No se encontró archivo .env, usando variables de entorno del sistema")
	}

	// Log del entorno actual
	env := os.Getenv("GO_ENV")
	if env == "" {
		env = "development"
	}
	log.Printf("Iniciando servidor en modo: %s", env)

	// Conexión a la base de datos
	db, err := database.NewConnection()
	if err != nil {
		log.Fatal("Error conectando a la base de datos:", err)
	}
	defer db.Close()

	// Inicializar repositorios
	usuarioRepo := database.NewUsuarioRepository(db)
	docenteRepo := database.NewDocenteRepository(db)
	turnoRepo := database.NewTurnoRepository(db)
	llaveRepo := database.NewLlaveRepository(db)
	registroRepo := database.NewRegistroRepository(db)

	// Inicializar casos de uso
	authUseCase := usecases.NewAuthUseCase(usuarioRepo)
	usuarioUseCase := usecases.NewUsuarioUseCase(usuarioRepo)
	docenteUseCase := usecases.NewDocenteUseCase(docenteRepo)
	registroUseCase := usecases.NewRegistroUseCase(registroRepo, turnoRepo, llaveRepo)
	turnoUseCase := usecases.NewTurnoUseCase(turnoRepo)
	llaveUseCase := usecases.NewLlaveUseCase(llaveRepo)

	// Inicializar handlers
	authHandler := handlers.NewAuthHandler(authUseCase)
	usuarioHandler := handlers.NewUsuarioHandler(usuarioUseCase)
	docenteHandler := handlers.NewDocenteHandler(docenteUseCase, usuarioUseCase)
	registroHandler := handlers.NewRegistroHandler(registroUseCase, docenteUseCase, turnoUseCase, db)
	turnoHandler := handlers.NewTurnoHandler(turnoUseCase)
	llaveHandler := handlers.NewLlaveHandler(llaveUseCase)
	reconocimientoHandler := handlers.NewReconocimientoHandler(docenteRepo)

	handlersGroup := &routes.Handlers{
		Auth:           authHandler,
		Usuario:        usuarioHandler,
		Docente:        docenteHandler,
		Registro:       registroHandler,
		Turno:          turnoHandler,
		Llave:          llaveHandler,
		Reconocimiento: reconocimientoHandler,
	}

	// Configurar router
	r := mux.NewRouter()

	// Rate limiter para login (5 intentos por minuto por IP)
	loginLimiter := middleware.NewRateLimiter(5, time.Minute)

	// Configurar rutas con rate limiting en login
	routes.SetupWithRateLimiter(r, handlersGroup, loginLimiter)

	// Aplicar middlewares en orden:
	// 1. Audit Log (primero para registrar todas las peticiones)
	// 2. Security Headers
	// 3. CORS (debe estar antes de la lógica de negocio)
	var handler http.Handler = r
	handler = middleware.AuditLog(handler)
	handler = middleware.SecurityHeaders(handler)
	handler = middleware.CORS().Handler(handler)

	// Iniciar servidor
	port := getEnv("PORT", "8080")
	log.Printf("Servidor iniciado en puerto %s", port)

	if env == "production" {
		log.Println("CORS configurado para:", os.Getenv("ALLOWED_ORIGINS"))
	}

	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
