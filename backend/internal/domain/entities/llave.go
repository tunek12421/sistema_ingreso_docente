package entities

import "time"

type EstadoLlave string

const (
	EstadoDisponible EstadoLlave = "disponible"
	EstadoEnUso      EstadoLlave = "en_uso"
	EstadoExtraviada EstadoLlave = "extraviada"
	EstadoInactiva   EstadoLlave = "inactiva"
)

type Llave struct {
	ID          int          `json:"id"`
	Codigo      string       `json:"codigo"`
	AmbienteID  int          `json:"ambiente_id"`
	Estado      EstadoLlave  `json:"estado"`
	Descripcion *string      `json:"descripcion,omitempty"`
	Activo      bool         `json:"activo"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}
