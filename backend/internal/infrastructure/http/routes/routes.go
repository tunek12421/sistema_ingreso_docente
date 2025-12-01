package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/http/handlers"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/http/middleware"
)

type Handlers struct {
	Auth     *handlers.AuthHandler
	Docente  *handlers.DocenteHandler
	Registro *handlers.RegistroHandler
	Turno    *handlers.TurnoHandler
	Llave    *handlers.LlaveHandler
}

func Setup(r *mux.Router, h *Handlers) {
	// Public routes
	r.HandleFunc("/login", h.Auth.Login).Methods("POST")
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status":"ok"}`))
	}).Methods("GET")

	// Protected routes
	api := r.PathPrefix("/").Subrouter()
	api.Use(middleware.AuthMiddleware)

	// ==================== DOCENTES ====================
	// Lectura - Bibliotecario y Jefe de Carrera
	api.Handle("/docentes", middleware.RequireRole(entities.RolBibliotecario, entities.RolJefeCarrera)(http.HandlerFunc(h.Docente.GetAll))).Methods("GET")
	api.Handle("/docentes/{id}", middleware.RequireRole(entities.RolBibliotecario, entities.RolJefeCarrera)(http.HandlerFunc(h.Docente.GetByID))).Methods("GET")
	api.Handle("/docentes/ci/{ci}", middleware.RequireRole(entities.RolBibliotecario, entities.RolJefeCarrera)(http.HandlerFunc(h.Docente.GetByCI))).Methods("GET")

	// Escritura - Solo Jefe de Carrera
	api.Handle("/docentes", middleware.RequireRole(entities.RolJefeCarrera)(http.HandlerFunc(h.Docente.Create))).Methods("POST")
	api.Handle("/docentes/{id}", middleware.RequireRole(entities.RolJefeCarrera)(http.HandlerFunc(h.Docente.Update))).Methods("PUT")
	api.Handle("/docentes/{id}", middleware.RequireRole(entities.RolJefeCarrera)(http.HandlerFunc(h.Docente.Delete))).Methods("DELETE")

	// ==================== REGISTROS ====================
	// Bibliotecario y Jefe de Carrera
	api.Handle("/registros/ingreso", middleware.RequireRole(entities.RolBibliotecario, entities.RolJefeCarrera)(http.HandlerFunc(h.Registro.RegistrarIngreso))).Methods("POST")
	api.Handle("/registros/salida", middleware.RequireRole(entities.RolBibliotecario, entities.RolJefeCarrera)(http.HandlerFunc(h.Registro.RegistrarSalida))).Methods("POST")
	api.Handle("/registros/hoy", middleware.RequireRole(entities.RolBibliotecario, entities.RolJefeCarrera)(http.HandlerFunc(h.Registro.GetRegistrosHoy))).Methods("GET")
	api.Handle("/registros/llave-actual", middleware.RequireRole(entities.RolBibliotecario, entities.RolJefeCarrera)(http.HandlerFunc(h.Registro.GetLlaveActual))).Methods("GET")
	api.Handle("/registros", middleware.RequireRole(entities.RolBibliotecario, entities.RolJefeCarrera)(http.HandlerFunc(h.Registro.GetByFecha))).Methods("GET")

	// ==================== TURNOS ====================
	// Lectura - Bibliotecario y Jefe de Carrera
	api.Handle("/turnos", middleware.RequireRole(entities.RolBibliotecario, entities.RolJefeCarrera)(http.HandlerFunc(h.Turno.GetAll))).Methods("GET")
	api.Handle("/turnos/{id}", middleware.RequireRole(entities.RolBibliotecario, entities.RolJefeCarrera)(http.HandlerFunc(h.Turno.GetByID))).Methods("GET")

	// Escritura - Solo Jefe de Carrera
	api.Handle("/turnos", middleware.RequireRole(entities.RolJefeCarrera)(http.HandlerFunc(h.Turno.Create))).Methods("POST")
	api.Handle("/turnos/{id}", middleware.RequireRole(entities.RolJefeCarrera)(http.HandlerFunc(h.Turno.Update))).Methods("PUT")
	api.Handle("/turnos/{id}", middleware.RequireRole(entities.RolJefeCarrera)(http.HandlerFunc(h.Turno.Delete))).Methods("DELETE")

	// ==================== LLAVES ====================
	// Lectura - Bibliotecario y Jefe de Carrera
	api.Handle("/llaves", middleware.RequireRole(entities.RolBibliotecario, entities.RolJefeCarrera)(http.HandlerFunc(h.Llave.GetAll))).Methods("GET")
	api.Handle("/llaves/{id}", middleware.RequireRole(entities.RolBibliotecario, entities.RolJefeCarrera)(http.HandlerFunc(h.Llave.GetByID))).Methods("GET")
	api.Handle("/llaves/codigo/{codigo}", middleware.RequireRole(entities.RolBibliotecario, entities.RolJefeCarrera)(http.HandlerFunc(h.Llave.GetByCodigo))).Methods("GET")
	api.Handle("/llaves/aula/{aula_codigo}", middleware.RequireRole(entities.RolBibliotecario, entities.RolJefeCarrera)(http.HandlerFunc(h.Llave.GetByAulaCodigo))).Methods("GET")

	// Escritura - Solo Jefe de Carrera
	api.Handle("/llaves", middleware.RequireRole(entities.RolJefeCarrera)(http.HandlerFunc(h.Llave.Create))).Methods("POST")
	api.Handle("/llaves/{id}", middleware.RequireRole(entities.RolJefeCarrera)(http.HandlerFunc(h.Llave.Update))).Methods("PUT")
	api.Handle("/llaves/{id}", middleware.RequireRole(entities.RolJefeCarrera)(http.HandlerFunc(h.Llave.Delete))).Methods("DELETE")
	api.Handle("/llaves/{id}/estado", middleware.RequireRole(entities.RolJefeCarrera)(http.HandlerFunc(h.Llave.UpdateEstado))).Methods("PATCH")
}
