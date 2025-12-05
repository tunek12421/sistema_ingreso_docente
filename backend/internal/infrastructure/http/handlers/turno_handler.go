package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/usecases"
)

type TurnoHandler struct {
	turnoUseCase *usecases.TurnoUseCase
}

func NewTurnoHandler(turnoUseCase *usecases.TurnoUseCase) *TurnoHandler {
	return &TurnoHandler{turnoUseCase: turnoUseCase}
}

func (h *TurnoHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	turnos, err := h.turnoUseCase.GetAll()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Error obteniendo turnos"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ApiResponse{Data: turnos})
}

func (h *TurnoHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "ID inválido"})
		return
	}

	turno, err := h.turnoUseCase.GetByID(id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Turno no encontrado"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ApiResponse{Data: turno})
}

func (h *TurnoHandler) Create(w http.ResponseWriter, r *http.Request) {
	var turno entities.Turno
	if err := json.NewDecoder(r.Body).Decode(&turno); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Datos inválidos"})
		return
	}

	if err := h.turnoUseCase.Create(&turno); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ApiResponse{Data: turno, Message: "Turno creado exitosamente"})
}

func (h *TurnoHandler) Update(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "ID inválido"})
		return
	}

	// Obtener el turno existente
	existingTurno, err := h.turnoUseCase.GetByID(id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Turno no encontrado"})
		return
	}

	// Decodificar solo los campos que vienen en el request
	var updateData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Datos inválidos"})
		return
	}

	// Actualizar solo los campos proporcionados
	if nombre, ok := updateData["nombre"].(string); ok {
		existingTurno.Nombre = nombre
	}
	if horaInicio, ok := updateData["hora_inicio"].(string); ok {
		existingTurno.HoraInicio = horaInicio
	}
	if horaFin, ok := updateData["hora_fin"].(string); ok {
		existingTurno.HoraFin = horaFin
	}
	if descripcion, ok := updateData["descripcion"].(string); ok {
		existingTurno.Descripcion = &descripcion
	}
	if activo, ok := updateData["activo"].(bool); ok {
		existingTurno.Activo = activo
	}

	if err := h.turnoUseCase.Update(existingTurno); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ApiResponse{Data: existingTurno, Message: "Turno actualizado exitosamente"})
}

func (h *TurnoHandler) Delete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "ID inválido"})
		return
	}

	if err := h.turnoUseCase.Delete(id); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Error eliminando turno"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ApiResponse{Message: "Turno eliminado exitosamente"})
}

// GetTurnoActual devuelve el turno correspondiente a la hora actual de Bolivia
func (h *TurnoHandler) GetTurnoActual(w http.ResponseWriter, r *http.Request) {
	turno, err := h.turnoUseCase.GetTurnoActual()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Error obteniendo turno actual"})
		return
	}

	if turno == nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(ApiResponse{Data: nil, Message: "No hay turno activo en este momento"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ApiResponse{Data: turno})
}
