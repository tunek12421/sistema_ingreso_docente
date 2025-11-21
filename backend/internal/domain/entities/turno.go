package entities

import "time"

type Turno struct {
	ID          int       `json:"id"`
	Nombre      string    `json:"nombre"`
	HoraInicio  string    `json:"hora_inicio"`
	HoraFin     string    `json:"hora_fin"`
	Descripcion *string   `json:"descripcion,omitempty"`
	Activo      bool      `json:"activo"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
