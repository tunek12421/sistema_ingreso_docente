package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/usecases"
)

type AmbienteHandler struct {
	ambienteUseCase *usecases.AmbienteUseCase
}

func NewAmbienteHandler(ambienteUseCase *usecases.AmbienteUseCase) *AmbienteHandler {
	return &AmbienteHandler{ambienteUseCase: ambienteUseCase}
}

func (h *AmbienteHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	ambientes, err := h.ambienteUseCase.GetAll()
	if err != nil {
		http.Error(w, `{"error":"Error obteniendo ambientes"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ambientes)
}

func (h *AmbienteHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID invalido"}`, http.StatusBadRequest)
		return
	}

	ambiente, err := h.ambienteUseCase.GetByID(id)
	if err != nil {
		http.Error(w, `{"error":"Ambiente no encontrado"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ambiente)
}

func (h *AmbienteHandler) GetByCodigo(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	codigo := vars["codigo"]

	ambiente, err := h.ambienteUseCase.GetByCodigo(codigo)
	if err != nil {
		http.Error(w, `{"error":"Ambiente no encontrado"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ambiente)
}

func (h *AmbienteHandler) Create(w http.ResponseWriter, r *http.Request) {
	var ambiente entities.Ambiente
	if err := json.NewDecoder(r.Body).Decode(&ambiente); err != nil {
		http.Error(w, `{"error":"Datos invalidos"}`, http.StatusBadRequest)
		return
	}

	if err := h.ambienteUseCase.Create(&ambiente); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ambiente)
}

func (h *AmbienteHandler) Update(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID invalido"}`, http.StatusBadRequest)
		return
	}

	var ambiente entities.Ambiente
	if err := json.NewDecoder(r.Body).Decode(&ambiente); err != nil {
		http.Error(w, `{"error":"Datos invalidos"}`, http.StatusBadRequest)
		return
	}

	ambiente.ID = id
	if err := h.ambienteUseCase.Update(&ambiente); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ambiente)
}

func (h *AmbienteHandler) Delete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID invalido"}`, http.StatusBadRequest)
		return
	}

	if err := h.ambienteUseCase.Delete(id); err != nil {
		http.Error(w, `{"error":"Error eliminando ambiente"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
