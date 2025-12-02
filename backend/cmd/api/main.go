package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/sistema-ingreso-docente/backend/internal/domain/usecases"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/database"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/http/handlers"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/http/middleware"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/http/routes"
)

func main() {
	// Cargar variables de entorno desde archivo .env
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("No se encontró archivo .env, usando variables de entorno del sistema")
	}

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

	handlersGroup := &routes.Handlers{
		Auth:     authHandler,
		Usuario:  usuarioHandler,
		Docente:  docenteHandler,
		Registro: registroHandler,
		Turno:    turnoHandler,
		Llave:    llaveHandler,
	}

	// Configurar router
	r := mux.NewRouter()
	routes.Setup(r, handlersGroup)

	// Aplicar CORS
	corsHandler := middleware.CORS().Handler(r)

	// Iniciar servidor
	port := getEnv("PORT", "8080")
	log.Printf("🚀 Servidor iniciado en puerto %s", port)
	log.Fatal(http.ListenAndServe(":"+port, corsHandler))
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
