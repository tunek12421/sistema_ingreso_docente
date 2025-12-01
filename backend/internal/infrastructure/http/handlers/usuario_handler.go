package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/usecases"
)

type ApiResponse struct {
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type UsuarioHandler struct {
	useCase *usecases.UsuarioUseCase
}

func NewUsuarioHandler(useCase *usecases.UsuarioUseCase) *UsuarioHandler {
	return &UsuarioHandler{useCase: useCase}
}

// GetAll obtiene todos los usuarios
func (h *UsuarioHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	usuarios, err := h.useCase.GetAll()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ApiResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ApiResponse{Data: usuarios})
}

// GetByID obtiene un usuario por ID
func (h *UsuarioHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "ID inválido"})
		return
	}

	usuario, err := h.useCase.GetByID(id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ApiResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ApiResponse{Data: usuario})
}

// Create crea un nuevo usuario
func (h *UsuarioHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateUsuarioRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Datos inválidos"})
		return
	}

	usuario := &entities.Usuario{
		Username:       req.Username,
		Password:       req.Password,
		Rol:            entities.Rol(req.Rol),
		NombreCompleto: req.NombreCompleto,
		Email:          req.Email,
	}

	if err := h.useCase.Create(usuario); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ApiResponse{Data: usuario, Message: "Usuario creado exitosamente"})
}

// Update actualiza un usuario
func (h *UsuarioHandler) Update(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "ID inválido"})
		return
	}

	var req UpdateUsuarioRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Datos inválidos"})
		return
	}

	// Obtener el usuario existente
	usuario, err := h.useCase.GetByID(id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Usuario no encontrado"})
		return
	}

	// Actualizar solo los campos proporcionados
	if req.Rol != "" {
		usuario.Rol = entities.Rol(req.Rol)
	}
	if req.NombreCompleto != "" {
		usuario.NombreCompleto = req.NombreCompleto
	}
	if req.Email != "" {
		usuario.Email = req.Email
	}
	if req.Activo != nil {
		usuario.Activo = *req.Activo
	}

	if err := h.useCase.Update(usuario); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ApiResponse{Data: usuario, Message: "Usuario actualizado exitosamente"})
}

// Delete elimina un usuario
func (h *UsuarioHandler) Delete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "ID inválido"})
		return
	}

	if err := h.useCase.Delete(id); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(ApiResponse{Message: "Usuario eliminado exitosamente"})
}

// ChangePassword cambia la contraseña de un usuario
func (h *UsuarioHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Datos inválidos", http.StatusBadRequest)
		return
	}

	if err := h.useCase.ChangePassword(id, req.NewPassword); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"Contraseña actualizada exitosamente"}`))
}

// ToggleActive activa/desactiva un usuario
func (h *UsuarioHandler) ToggleActive(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "ID inválido"})
		return
	}

	if err := h.useCase.ToggleActive(id); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(ApiResponse{Message: "Estado de usuario actualizado"})
}
