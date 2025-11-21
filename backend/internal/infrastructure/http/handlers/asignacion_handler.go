package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/usecases"
)

type AsignacionHandler struct {
	asignacionUseCase *usecases.AsignacionUseCase
}

func NewAsignacionHandler(asignacionUseCase *usecases.AsignacionUseCase) *AsignacionHandler {
	return &AsignacionHandler{asignacionUseCase: asignacionUseCase}
}

func (h *AsignacionHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	asignaciones, err := h.asignacionUseCase.GetAll()
	if err != nil {
		http.Error(w, `{"error":"Error obteniendo asignaciones"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(asignaciones)
}

func (h *AsignacionHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID invalido"}`, http.StatusBadRequest)
		return
	}

	asignacion, err := h.asignacionUseCase.GetByID(id)
	if err != nil {
		http.Error(w, `{"error":"Asignacion no encontrada"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(asignacion)
}

func (h *AsignacionHandler) GetByDocente(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	docenteID, err := strconv.Atoi(vars["docente_id"])
	if err != nil {
		http.Error(w, `{"error":"ID de docente invalido"}`, http.StatusBadRequest)
		return
	}

	asignaciones, err := h.asignacionUseCase.GetByDocente(docenteID)
	if err != nil {
		http.Error(w, `{"error":"Error obteniendo asignaciones"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(asignaciones)
}

func (h *AsignacionHandler) GetByDocenteYFecha(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	docenteID, err := strconv.Atoi(vars["docente_id"])
	if err != nil {
		http.Error(w, `{"error":"ID de docente invalido"}`, http.StatusBadRequest)
		return
	}

	fechaStr := r.URL.Query().Get("fecha")
	if fechaStr == "" {
		fechaStr = time.Now().Format("2006-01-02")
	}

	fecha, err := time.Parse("2006-01-02", fechaStr)
	if err != nil {
		http.Error(w, `{"error":"Formato de fecha invalido"}`, http.StatusBadRequest)
		return
	}

	asignaciones, err := h.asignacionUseCase.GetByDocenteYFecha(docenteID, fecha)
	if err != nil {
		http.Error(w, `{"error":"Error obteniendo asignaciones"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(asignaciones)
}

func (h *AsignacionHandler) Create(w http.ResponseWriter, r *http.Request) {
	var asignacion entities.Asignacion
	if err := json.NewDecoder(r.Body).Decode(&asignacion); err != nil {
		http.Error(w, `{"error":"Datos invalidos"}`, http.StatusBadRequest)
		return
	}

	if err := h.asignacionUseCase.Create(&asignacion); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(asignacion)
}

func (h *AsignacionHandler) Update(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID invalido"}`, http.StatusBadRequest)
		return
	}

	var asignacion entities.Asignacion
	if err := json.NewDecoder(r.Body).Decode(&asignacion); err != nil {
		http.Error(w, `{"error":"Datos invalidos"}`, http.StatusBadRequest)
		return
	}

	asignacion.ID = id
	if err := h.asignacionUseCase.Update(&asignacion); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(asignacion)
}

func (h *AsignacionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID invalido"}`, http.StatusBadRequest)
		return
	}

	if err := h.asignacionUseCase.Delete(id); err != nil {
		http.Error(w, `{"error":"Error eliminando asignacion"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
