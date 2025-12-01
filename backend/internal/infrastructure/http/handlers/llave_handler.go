package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/usecases"
)

type LlaveHandler struct {
	llaveUseCase *usecases.LlaveUseCase
}

func NewLlaveHandler(llaveUseCase *usecases.LlaveUseCase) *LlaveHandler {
	return &LlaveHandler{llaveUseCase: llaveUseCase}
}

func (h *LlaveHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	llaves, err := h.llaveUseCase.GetAll()
	if err != nil {
		http.Error(w, `{"error":"Error obteniendo llaves"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(llaves)
}

func (h *LlaveHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID invalido"}`, http.StatusBadRequest)
		return
	}

	llave, err := h.llaveUseCase.GetByID(id)
	if err != nil {
		http.Error(w, `{"error":"Llave no encontrada"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(llave)
}

func (h *LlaveHandler) GetByCodigo(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	codigo := vars["codigo"]

	llave, err := h.llaveUseCase.GetByCodigo(codigo)
	if err != nil {
		http.Error(w, `{"error":"Llave no encontrada"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(llave)
}

func (h *LlaveHandler) GetByAulaCodigo(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	aulaCodigo := vars["aula_codigo"]
	if aulaCodigo == "" {
		http.Error(w, `{"error":"Código de aula requerido"}`, http.StatusBadRequest)
		return
	}

	llaves, err := h.llaveUseCase.GetByAulaCodigo(aulaCodigo)
	if err != nil {
		http.Error(w, `{"error":"Error obteniendo llaves"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(llaves)
}

func (h *LlaveHandler) Create(w http.ResponseWriter, r *http.Request) {
	var llave entities.Llave
	if err := json.NewDecoder(r.Body).Decode(&llave); err != nil {
		http.Error(w, `{"error":"Datos invalidos"}`, http.StatusBadRequest)
		return
	}

	if err := h.llaveUseCase.Create(&llave); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(llave)
}

func (h *LlaveHandler) Update(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID invalido"}`, http.StatusBadRequest)
		return
	}

	var llave entities.Llave
	if err := json.NewDecoder(r.Body).Decode(&llave); err != nil {
		http.Error(w, `{"error":"Datos invalidos"}`, http.StatusBadRequest)
		return
	}

	llave.ID = id
	if err := h.llaveUseCase.Update(&llave); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(llave)
}

func (h *LlaveHandler) UpdateEstado(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID invalido"}`, http.StatusBadRequest)
		return
	}

	var req struct {
		Estado entities.EstadoLlave `json:"estado"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Datos invalidos"}`, http.StatusBadRequest)
		return
	}

	if err := h.llaveUseCase.UpdateEstado(id, req.Estado); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Estado actualizado"})
}

func (h *LlaveHandler) Delete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID invalido"}`, http.StatusBadRequest)
		return
	}

	if err := h.llaveUseCase.Delete(id); err != nil {
		http.Error(w, `{"error":"Error eliminando llave"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
