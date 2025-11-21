package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/sistema-ingreso-docente/backend/internal/application/dto"
	"github.com/sistema-ingreso-docente/backend/internal/domain/usecases"
)

type AuthHandler struct {
	authUseCase *usecases.AuthUseCase
}

func NewAuthHandler(authUseCase *usecases.AuthUseCase) *AuthHandler {
	return &AuthHandler{authUseCase: authUseCase}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req dto.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Datos inválidos"}`, http.StatusBadRequest)
		return
	}

	token, usuario, err := h.authUseCase.Login(req.Username, req.Password)
	if err != nil {
		http.Error(w, `{"error":"Credenciales inválidas"}`, http.StatusUnauthorized)
		return
	}

	response := dto.LoginResponse{
		Token: token,
		User: dto.UserProfile{
			ID:       usuario.ID,
			Username: usuario.Username,
			Rol:      string(usuario.Rol),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
