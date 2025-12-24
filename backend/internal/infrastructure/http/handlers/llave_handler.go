package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/usecases"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/security"
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
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Error obteniendo llaves"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ApiResponse{Data: llaves})
}

func (h *LlaveHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := security.ValidateID(vars["id"])
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "ID inválido"})
		return
	}

	llave, err := h.llaveUseCase.GetByID(id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Llave no encontrada"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ApiResponse{Data: llave})
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

func (h *LlaveHandler) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, `{"error":"Parámetro de búsqueda 'q' requerido"}`, http.StatusBadRequest)
		return
	}

	llaves, err := h.llaveUseCase.Search(query)
	if err != nil {
		http.Error(w, `{"error":"Error buscando llaves"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(llaves)
}

func (h *LlaveHandler) Create(w http.ResponseWriter, r *http.Request) {
	var llave entities.Llave
	if err := json.NewDecoder(r.Body).Decode(&llave); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Datos inválidos"})
		return
	}

	// Verificar si ya existe una llave con el mismo código
	existing, _ := h.llaveUseCase.GetByCodigo(llave.Codigo)
	if existing != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Ya existe una llave con el código " + llave.Codigo})
		return
	}

	if err := h.llaveUseCase.Create(&llave); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ApiResponse{Data: llave, Message: "Llave creada exitosamente"})
}

func (h *LlaveHandler) Update(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := security.ValidateID(vars["id"])
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "ID inválido"})
		return
	}

	// Obtener la llave existente
	existingLlave, err := h.llaveUseCase.GetByID(id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Llave no encontrada"})
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
	if codigo, ok := updateData["codigo"].(string); ok {
		// Validar longitud de código
		if err := security.ValidateCodigo(codigo); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(ApiResponse{Error: err.Error()})
			return
		}
		// Verificar si el nuevo código ya existe en otra llave
		if codigo != existingLlave.Codigo {
			duplicate, _ := h.llaveUseCase.GetByCodigo(codigo)
			if duplicate != nil && duplicate.ID != id {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusConflict)
				json.NewEncoder(w).Encode(ApiResponse{Error: "Ya existe una llave con el código " + codigo})
				return
			}
		}
		existingLlave.Codigo = codigo
	}
	if aulaCodigo, ok := updateData["aula_codigo"].(string); ok {
		if err := security.ValidateCodigo(aulaCodigo); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(ApiResponse{Error: "Código de aula inválido"})
			return
		}
		existingLlave.AulaCodigo = aulaCodigo
	}
	if aulaNombre, ok := updateData["aula_nombre"].(string); ok {
		if err := security.ValidateNombreCompleto(aulaNombre); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(ApiResponse{Error: "Nombre de aula demasiado largo"})
			return
		}
		existingLlave.AulaNombre = aulaNombre
	}
	if estado, ok := updateData["estado"].(string); ok {
		estadoLlave := entities.EstadoLlave(estado)
		if !estadoLlave.IsValid() {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(ApiResponse{Error: "Estado inválido. Valores permitidos: disponible, en_uso, extraviada, inactiva"})
			return
		}
		existingLlave.Estado = estadoLlave
	}
	if descripcion, ok := updateData["descripcion"].(string); ok {
		if err := security.ValidateDescripcion(descripcion); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(ApiResponse{Error: "Descripción demasiado larga"})
			return
		}
		existingLlave.Descripcion = &descripcion
	}

	if err := h.llaveUseCase.Update(existingLlave); err != nil {
		log.Printf("[ERROR] Error actualizando llave %d: %v", id, err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Error al actualizar llave"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ApiResponse{Data: existingLlave, Message: "Llave actualizada exitosamente"})
}

func (h *LlaveHandler) UpdateEstado(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := security.ValidateID(vars["id"])
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

	// Validar estado
	if !req.Estado.IsValid() {
		http.Error(w, `{"error":"Estado inválido"}`, http.StatusBadRequest)
		return
	}

	if err := h.llaveUseCase.UpdateEstado(id, req.Estado); err != nil {
		log.Printf("[ERROR] Error actualizando estado de llave %d: %v", id, err)
		http.Error(w, `{"error":"Error al actualizar estado"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Estado actualizado"})
}

func (h *LlaveHandler) Delete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := security.ValidateID(vars["id"])
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "ID inválido"})
		return
	}

	if err := h.llaveUseCase.Delete(id); err != nil {
		log.Printf("[ERROR] Error eliminando llave %d: %v", id, err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Error eliminando llave"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ApiResponse{Message: "Llave eliminada exitosamente"})
}
