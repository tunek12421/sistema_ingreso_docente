package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/sistema-ingreso-docente/backend/internal/application/dto"
	"github.com/sistema-ingreso-docente/backend/internal/domain/usecases"
)

type RegistroHandler struct {
	registroUseCase *usecases.RegistroUseCase
	docenteUseCase  *usecases.DocenteUseCase
}

func NewRegistroHandler(
	registroUseCase *usecases.RegistroUseCase,
	docenteUseCase *usecases.DocenteUseCase,
) *RegistroHandler {
	return &RegistroHandler{
		registroUseCase: registroUseCase,
		docenteUseCase:  docenteUseCase,
	}
}

func (h *RegistroHandler) RegistrarIngreso(w http.ResponseWriter, r *http.Request) {
	var req dto.RegistroIngresoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Datos inválidos"}`, http.StatusBadRequest)
		return
	}

	// Buscar docente por CI
	docente, err := h.docenteUseCase.GetByCI(req.CI)
	if err != nil {
		http.Error(w, `{"error":"Docente no encontrado"}`, http.StatusNotFound)
		return
	}

	// Por ahora, usar valores por defecto (luego se puede mejorar con asignaciones)
	ambienteID := 1  // TODO: obtener de asignación del docente
	turnoID := 2     // TODO: obtener de asignación actual

	registro, err := h.registroUseCase.RegistrarIngreso(docente.ID, ambienteID, turnoID, req.LlaveID)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(registro)
}

func (h *RegistroHandler) RegistrarSalida(w http.ResponseWriter, r *http.Request) {
	var req dto.RegistroSalidaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Datos inválidos"}`, http.StatusBadRequest)
		return
	}

	docente, err := h.docenteUseCase.GetByCI(req.CI)
	if err != nil {
		http.Error(w, `{"error":"Docente no encontrado"}`, http.StatusNotFound)
		return
	}

	ambienteID := 1
	turnoID := 2

	registro, err := h.registroUseCase.RegistrarSalida(docente.ID, ambienteID, turnoID, req.LlaveID)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(registro)
}

func (h *RegistroHandler) GetByFecha(w http.ResponseWriter, r *http.Request) {
	fechaStr := r.URL.Query().Get("fecha")
	if fechaStr == "" {
		fechaStr = time.Now().Format("2006-01-02")
	}

	fecha, err := time.Parse("2006-01-02", fechaStr)
	if err != nil {
		http.Error(w, `{"error":"Fecha inválida"}`, http.StatusBadRequest)
		return
	}

	registros, err := h.registroUseCase.GetByFecha(fecha)
	if err != nil {
		http.Error(w, `{"error":"Error obteniendo registros"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(registros)
}
