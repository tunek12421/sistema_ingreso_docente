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
	Codigo      string       `json:"codigo"`        // Código de la llave (ej: "L-B16")
	AulaCodigo  string       `json:"aula_codigo"`   // Código del aula (ej: "B-16")
	AulaNombre  string       `json:"aula_nombre"`   // Nombre del aula (ej: "Aula Bloque B-16")
	Estado      EstadoLlave  `json:"estado"`
	Descripcion *string      `json:"descripcion,omitempty"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}
