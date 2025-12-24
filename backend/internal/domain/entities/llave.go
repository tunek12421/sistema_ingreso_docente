package entities

import "time"

type EstadoLlave string

const (
	EstadoDisponible EstadoLlave = "disponible"
	EstadoEnUso      EstadoLlave = "en_uso"
	EstadoExtraviada EstadoLlave = "extraviada"
	EstadoInactiva   EstadoLlave = "inactiva"
)

// EstadosLlaveValidos contiene todos los estados válidos
var EstadosLlaveValidos = map[EstadoLlave]bool{
	EstadoDisponible: true,
	EstadoEnUso:      true,
	EstadoExtraviada: true,
	EstadoInactiva:   true,
}

// IsValid verifica si el estado es válido
func (e EstadoLlave) IsValid() bool {
	return EstadosLlaveValidos[e]
}

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
