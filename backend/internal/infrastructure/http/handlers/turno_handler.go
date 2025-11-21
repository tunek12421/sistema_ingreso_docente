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
		http.Error(w, `{"error":"Error obteniendo turnos"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(turnos)
}

func (h *TurnoHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID invalido"}`, http.StatusBadRequest)
		return
	}

	turno, err := h.turnoUseCase.GetByID(id)
	if err != nil {
		http.Error(w, `{"error":"Turno no encontrado"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(turno)
}

func (h *TurnoHandler) Create(w http.ResponseWriter, r *http.Request) {
	var turno entities.Turno
	if err := json.NewDecoder(r.Body).Decode(&turno); err != nil {
		http.Error(w, `{"error":"Datos invalidos"}`, http.StatusBadRequest)
		return
	}

	if err := h.turnoUseCase.Create(&turno); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(turno)
}

func (h *TurnoHandler) Update(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID invalido"}`, http.StatusBadRequest)
		return
	}

	var turno entities.Turno
	if err := json.NewDecoder(r.Body).Decode(&turno); err != nil {
		http.Error(w, `{"error":"Datos invalidos"}`, http.StatusBadRequest)
		return
	}

	turno.ID = id
	if err := h.turnoUseCase.Update(&turno); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(turno)
}

func (h *TurnoHandler) Delete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID invalido"}`, http.StatusBadRequest)
		return
	}

	if err := h.turnoUseCase.Delete(id); err != nil {
		http.Error(w, `{"error":"Error eliminando turno"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
