package entities

import "time"

type Rol string

const (
	RolJefeCarrera  Rol = "jefe_carrera"
	RolBibliotecario Rol = "bibliotecario"
	RolDocente      Rol = "docente"
)

type Usuario struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Password  string    `json:"-"`
	Rol       Rol       `json:"rol"`
	Activo    bool      `json:"activo"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
