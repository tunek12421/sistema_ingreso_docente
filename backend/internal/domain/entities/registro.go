package entities

import "time"

type TipoRegistro string

const (
	TipoIngreso TipoRegistro = "ingreso"
	TipoSalida  TipoRegistro = "salida"
)

// TiposRegistroValidos contiene los tipos válidos
var TiposRegistroValidos = map[TipoRegistro]bool{
	TipoIngreso: true,
	TipoSalida:  true,
}

// IsValid verifica si el tipo de registro es válido
func (t TipoRegistro) IsValid() bool {
	return TiposRegistroValidos[t]
}

type Registro struct {
	ID             int          `json:"id"`
	DocenteID      int          `json:"docente_id"`
	TurnoID        int          `json:"turno_id"`
	LlaveID        *int         `json:"llave_id,omitempty"`
	Tipo           TipoRegistro `json:"tipo"`
	FechaHora      time.Time    `json:"fecha_hora"`
	MinutosRetraso int          `json:"minutos_retraso"`
	MinutosExtra   int          `json:"minutos_extra"`
	EsExcepcional  bool         `json:"es_excepcional"`
	Observaciones  *string      `json:"observaciones,omitempty"`
	EditadoPor     *int         `json:"editado_por,omitempty"`
	CreatedAt      time.Time    `json:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at"`
}
