package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/http/handlers"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/http/middleware"
)

type Handlers struct {
	Auth       *handlers.AuthHandler
	Docente    *handlers.DocenteHandler
	Registro   *handlers.RegistroHandler
	Turno      *handlers.TurnoHandler
	Ambiente   *handlers.AmbienteHandler
	Llave      *handlers.LlaveHandler
	Asignacion *handlers.AsignacionHandler
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

	// Docentes - solo jefe_carrera puede gestionar
	docentes := api.PathPrefix("/docentes").Subrouter()
	docentes.Use(middleware.RequireRole(entities.RolJefeCarrera))
	docentes.HandleFunc("", h.Docente.GetAll).Methods("GET")
	docentes.HandleFunc("", h.Docente.Create).Methods("POST")
	docentes.HandleFunc("/{id}", h.Docente.GetByID).Methods("GET")
	docentes.HandleFunc("/{id}", h.Docente.Update).Methods("PUT")
	docentes.HandleFunc("/{id}", h.Docente.Delete).Methods("DELETE")
	docentes.HandleFunc("/ci/{ci}", h.Docente.GetByCI).Methods("GET")

	// Registros - bibliotecario puede registrar ingresos/salidas
	registros := api.PathPrefix("/registros").Subrouter()
	registros.Use(middleware.RequireRole(entities.RolBibliotecario, entities.RolJefeCarrera))
	registros.HandleFunc("/ingreso", h.Registro.RegistrarIngreso).Methods("POST")
	registros.HandleFunc("/salida", h.Registro.RegistrarSalida).Methods("POST")
	registros.HandleFunc("", h.Registro.GetByFecha).Methods("GET")

	// Turnos - solo jefe_carrera puede gestionar
	turnos := api.PathPrefix("/turnos").Subrouter()
	turnos.Use(middleware.RequireRole(entities.RolJefeCarrera))
	turnos.HandleFunc("", h.Turno.GetAll).Methods("GET")
	turnos.HandleFunc("", h.Turno.Create).Methods("POST")
	turnos.HandleFunc("/{id}", h.Turno.GetByID).Methods("GET")
	turnos.HandleFunc("/{id}", h.Turno.Update).Methods("PUT")
	turnos.HandleFunc("/{id}", h.Turno.Delete).Methods("DELETE")

	// Ambientes - solo jefe_carrera puede gestionar
	ambientes := api.PathPrefix("/ambientes").Subrouter()
	ambientes.Use(middleware.RequireRole(entities.RolJefeCarrera))
	ambientes.HandleFunc("", h.Ambiente.GetAll).Methods("GET")
	ambientes.HandleFunc("", h.Ambiente.Create).Methods("POST")
	ambientes.HandleFunc("/{id}", h.Ambiente.GetByID).Methods("GET")
	ambientes.HandleFunc("/{id}", h.Ambiente.Update).Methods("PUT")
	ambientes.HandleFunc("/{id}", h.Ambiente.Delete).Methods("DELETE")
	ambientes.HandleFunc("/codigo/{codigo}", h.Ambiente.GetByCodigo).Methods("GET")

	// Llaves - solo jefe_carrera puede gestionar
	llaves := api.PathPrefix("/llaves").Subrouter()
	llaves.Use(middleware.RequireRole(entities.RolJefeCarrera))
	llaves.HandleFunc("", h.Llave.GetAll).Methods("GET")
	llaves.HandleFunc("", h.Llave.Create).Methods("POST")
	llaves.HandleFunc("/{id}", h.Llave.GetByID).Methods("GET")
	llaves.HandleFunc("/{id}", h.Llave.Update).Methods("PUT")
	llaves.HandleFunc("/{id}", h.Llave.Delete).Methods("DELETE")
	llaves.HandleFunc("/codigo/{codigo}", h.Llave.GetByCodigo).Methods("GET")
	llaves.HandleFunc("/ambiente/{ambiente_id}", h.Llave.GetByAmbiente).Methods("GET")
	llaves.HandleFunc("/{id}/estado", h.Llave.UpdateEstado).Methods("PATCH")

	// Asignaciones - solo jefe_carrera puede gestionar
	asignaciones := api.PathPrefix("/asignaciones").Subrouter()
	asignaciones.Use(middleware.RequireRole(entities.RolJefeCarrera))
	asignaciones.HandleFunc("", h.Asignacion.GetAll).Methods("GET")
	asignaciones.HandleFunc("", h.Asignacion.Create).Methods("POST")
	asignaciones.HandleFunc("/{id}", h.Asignacion.GetByID).Methods("GET")
	asignaciones.HandleFunc("/{id}", h.Asignacion.Update).Methods("PUT")
	asignaciones.HandleFunc("/{id}", h.Asignacion.Delete).Methods("DELETE")
	asignaciones.HandleFunc("/docente/{docente_id}", h.Asignacion.GetByDocente).Methods("GET")
	asignaciones.HandleFunc("/docente/{docente_id}/fecha", h.Asignacion.GetByDocenteYFecha).Methods("GET")
}
