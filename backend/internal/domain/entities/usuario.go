package entities

import "time"

type Rol string

const (
	RolAdministrador Rol = "administrador"
	RolJefeCarrera   Rol = "jefe_carrera"
	RolBibliotecario Rol = "bibliotecario"
	RolBecario       Rol = "becario"
	RolDocente       Rol = "docente"
)

// RolesValidos contiene todos los roles válidos del sistema
var RolesValidos = map[Rol]bool{
	RolAdministrador: true,
	RolJefeCarrera:   true,
	RolBibliotecario: true,
	RolBecario:       true,
	RolDocente:       true,
}

// IsValid verifica si el rol es válido
func (r Rol) IsValid() bool {
	return RolesValidos[r]
}

type Usuario struct {
	ID             int       `json:"id"`
	Username       string    `json:"username"`
	Password       string    `json:"-"`
	Rol            Rol       `json:"rol"`
	NombreCompleto string    `json:"nombre_completo,omitempty"`
	Email          string    `json:"email,omitempty"`
	Activo         bool      `json:"activo"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
