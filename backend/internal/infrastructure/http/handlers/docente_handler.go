package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/usecases"
)

type DocenteHandler struct {
	docenteUseCase *usecases.DocenteUseCase
}

func NewDocenteHandler(docenteUseCase *usecases.DocenteUseCase) *DocenteHandler {
	return &DocenteHandler{docenteUseCase: docenteUseCase}
}

func (h *DocenteHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	docentes, err := h.docenteUseCase.GetAll()
	if err != nil {
		http.Error(w, `{"error":"Error obteniendo docentes"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(docentes)
}

func (h *DocenteHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID inválido"}`, http.StatusBadRequest)
		return
	}

	docente, err := h.docenteUseCase.GetByID(id)
	if err != nil {
		http.Error(w, `{"error":"Docente no encontrado"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(docente)
}

func (h *DocenteHandler) GetByCI(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	ci, err := strconv.ParseInt(vars["ci"], 10, 64)
	if err != nil {
		http.Error(w, `{"error":"CI inválido"}`, http.StatusBadRequest)
		return
	}

	docente, err := h.docenteUseCase.GetByCI(ci)
	if err != nil {
		http.Error(w, `{"error":"Docente no encontrado"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(docente)
}

func (h *DocenteHandler) Create(w http.ResponseWriter, r *http.Request) {
	var docente entities.Docente
	if err := json.NewDecoder(r.Body).Decode(&docente); err != nil {
		http.Error(w, `{"error":"Datos inválidos"}`, http.StatusBadRequest)
		return
	}

	if err := h.docenteUseCase.Create(&docente); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(docente)
}

func (h *DocenteHandler) Update(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID inválido"}`, http.StatusBadRequest)
		return
	}

	var docente entities.Docente
	if err := json.NewDecoder(r.Body).Decode(&docente); err != nil {
		http.Error(w, `{"error":"Datos inválidos"}`, http.StatusBadRequest)
		return
	}

	docente.ID = id
	if err := h.docenteUseCase.Update(&docente); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(docente)
}

func (h *DocenteHandler) Delete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID inválido"}`, http.StatusBadRequest)
		return
	}

	if err := h.docenteUseCase.Delete(id); err != nil {
		http.Error(w, `{"error":"Error eliminando docente"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
