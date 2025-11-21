package entities

import "time"

type Asignacion struct {
	ID          int       `json:"id"`
	DocenteID   int       `json:"docente_id"`
	TurnoID     int       `json:"turno_id"`
	AmbienteID  int       `json:"ambiente_id"`
	LlaveID     *int      `json:"llave_id,omitempty"`
	FechaInicio time.Time `json:"fecha_inicio"`
	FechaFin    *time.Time `json:"fecha_fin,omitempty"`
	Activo      bool      `json:"activo"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
