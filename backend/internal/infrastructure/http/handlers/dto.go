package handlers

// DTOs para requests HTTP

type CreateUsuarioRequest struct {
	Username       string `json:"username"`
	Password       string `json:"password"`
	Rol            string `json:"rol"`
	NombreCompleto string `json:"nombre_completo,omitempty"`
	Email          string `json:"email,omitempty"`
}

type UpdateUsuarioRequest struct {
	Rol            string `json:"rol,omitempty"`
	NombreCompleto string `json:"nombre_completo,omitempty"`
	Email          string `json:"email,omitempty"`
	Activo         *bool  `json:"activo,omitempty"`
}

type ChangePasswordRequest struct {
	NewPassword string `json:"new_password"`
}
