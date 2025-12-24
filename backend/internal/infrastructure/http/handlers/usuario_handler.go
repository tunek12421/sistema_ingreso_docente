package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/usecases"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/http/middleware"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/jwt"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/security"
)

// getUserClaims obtiene los claims del usuario autenticado del contexto
func getUserClaims(r *http.Request) *jwt.Claims {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*jwt.Claims)
	if !ok {
		return nil
	}
	return claims
}

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
		log.Printf("[ERROR] Error obteniendo usuarios: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Error obteniendo usuarios"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ApiResponse{Data: usuarios})
}

// GetByID obtiene un usuario por ID
func (h *UsuarioHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := security.ValidateID(vars["id"])
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
		json.NewEncoder(w).Encode(ApiResponse{Error: "Usuario no encontrado"})
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

	// Validar formato de username
	if err := security.ValidateUsername(req.Username); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: err.Error()})
		return
	}

	// Validar formato de email
	if err := security.ValidateEmail(req.Email); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: err.Error()})
		return
	}

	// Validar longitud de nombre completo
	if err := security.ValidateNombreCompleto(req.NombreCompleto); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: err.Error()})
		return
	}

	// Validar que el rol sea válido
	rol := entities.Rol(req.Rol)
	if !rol.IsValid() {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Rol inválido. Valores permitidos: administrador, jefe_carrera, bibliotecario, becario, docente"})
		return
	}

	// Validar fortaleza de la contraseña
	if err := security.ValidatePasswordStrength(req.Password); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: err.Error()})
		return
	}

	usuario := &entities.Usuario{
		Username:       req.Username,
		Password:       req.Password,
		Rol:            rol,
		NombreCompleto: req.NombreCompleto,
		Email:          req.Email,
	}

	if err := h.useCase.Create(usuario); err != nil {
		log.Printf("[ERROR] Error creando usuario: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Error al crear usuario"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ApiResponse{Data: usuario, Message: "Usuario creado exitosamente"})
}

// Update actualiza un usuario
func (h *UsuarioHandler) Update(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := security.ValidateID(vars["id"])
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "ID inválido"})
		return
	}

	// Obtener claims del usuario autenticado
	claims := getUserClaims(r)
	if claims == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(ApiResponse{Error: "No autorizado"})
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

	// SEGURIDAD: Prevenir que un administrador se desactive a sí mismo
	if claims.UserID == id && req.Activo != nil && !*req.Activo {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(ApiResponse{Error: "No puede desactivar su propia cuenta"})
		return
	}

	// SEGURIDAD: Prevenir que un administrador cambie su propio rol
	if claims.UserID == id && req.Rol != "" && entities.Rol(req.Rol) != claims.Rol {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(ApiResponse{Error: "No puede cambiar su propio rol"})
		return
	}

	// Validar longitud de nombre completo
	if req.NombreCompleto != "" {
		if err := security.ValidateNombreCompleto(req.NombreCompleto); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(ApiResponse{Error: err.Error()})
			return
		}
	}

	// Validar formato de email
	if req.Email != "" {
		if err := security.ValidateEmail(req.Email); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(ApiResponse{Error: err.Error()})
			return
		}
	}

	// Actualizar solo los campos proporcionados
	if req.Rol != "" {
		rol := entities.Rol(req.Rol)
		if !rol.IsValid() {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(ApiResponse{Error: "Rol inválido"})
			return
		}
		usuario.Rol = rol
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
		log.Printf("[ERROR] Error actualizando usuario %d: %v", id, err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Error al actualizar usuario"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ApiResponse{Data: usuario, Message: "Usuario actualizado exitosamente"})
}

// Delete elimina un usuario
func (h *UsuarioHandler) Delete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := security.ValidateID(vars["id"])
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "ID inválido"})
		return
	}

	// Obtener claims del usuario autenticado
	claims := getUserClaims(r)
	if claims == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(ApiResponse{Error: "No autorizado"})
		return
	}

	// SEGURIDAD: Prevenir que un usuario se elimine a sí mismo
	if claims.UserID == id {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(ApiResponse{Error: "No puede eliminar su propia cuenta"})
		return
	}

	if err := h.useCase.Delete(id); err != nil {
		log.Printf("[ERROR] Error eliminando usuario %d: %v", id, err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Error al eliminar usuario"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(ApiResponse{Message: "Usuario eliminado exitosamente"})
}

// ChangePassword cambia la contraseña de un usuario
func (h *UsuarioHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := security.ValidateID(vars["id"])
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "ID inválido"})
		return
	}

	// Obtener claims del usuario autenticado para auditoría
	claims := getUserClaims(r)
	if claims == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(ApiResponse{Error: "No autorizado"})
		return
	}

	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Datos inválidos"})
		return
	}

	// Validar fortaleza de la nueva contraseña
	if err := security.ValidatePasswordStrength(req.NewPassword); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: err.Error()})
		return
	}

	if err := h.useCase.ChangePassword(id, req.NewPassword); err != nil {
		log.Printf("[ERROR] Error cambiando contraseña de usuario %d por usuario %d: %v", id, claims.UserID, err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Error al cambiar contraseña"})
		return
	}

	// Log de auditoría
	log.Printf("[AUDIT] Usuario %d (%s) cambió contraseña de usuario %d", claims.UserID, claims.Username, id)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(ApiResponse{Message: "Contraseña actualizada exitosamente"})
}

// ToggleActive activa/desactiva un usuario
func (h *UsuarioHandler) ToggleActive(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := security.ValidateID(vars["id"])
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "ID inválido"})
		return
	}

	// Obtener claims del usuario autenticado
	claims := getUserClaims(r)
	if claims == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(ApiResponse{Error: "No autorizado"})
		return
	}

	// SEGURIDAD: Prevenir que un usuario se desactive a sí mismo
	if claims.UserID == id {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(ApiResponse{Error: "No puede cambiar el estado de su propia cuenta"})
		return
	}

	if err := h.useCase.ToggleActive(id); err != nil {
		log.Printf("[ERROR] Error cambiando estado de usuario %d: %v", id, err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ApiResponse{Error: "Error al cambiar estado de usuario"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(ApiResponse{Message: "Estado de usuario actualizado"})
}
