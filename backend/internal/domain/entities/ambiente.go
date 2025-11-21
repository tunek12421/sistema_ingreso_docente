package entities

import "time"

type Ambiente struct {
	ID           int       `json:"id"`
	Codigo       string    `json:"codigo"`
	Descripcion  *string   `json:"descripcion,omitempty"`
	TipoAmbiente *string   `json:"tipo_ambiente,omitempty"`
	Capacidad    *int      `json:"capacidad,omitempty"`
	Piso         *int      `json:"piso,omitempty"`
	Edificio     *string   `json:"edificio,omitempty"`
	Activo       bool      `json:"activo"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
