package dto

type RegistroIngresoRequest struct {
	CI            int64   `json:"ci"`
	AmbienteID    *int    `json:"ambiente_id,omitempty"`
	TurnoID       *int    `json:"turno_id,omitempty"`
	LlaveID       *int    `json:"llave_id,omitempty"`
	Observaciones *string `json:"observaciones,omitempty"`
}

type RegistroSalidaRequest struct {
	CI            int64   `json:"ci"`
	AmbienteID    *int    `json:"ambiente_id,omitempty"`
	TurnoID       *int    `json:"turno_id,omitempty"`
	LlaveID       *int    `json:"llave_id,omitempty"`
	Observaciones *string `json:"observaciones,omitempty"`
}

// RegistroUpdateRequest para edición de registros por bibliotecario/jefe de carrera
type RegistroUpdateRequest struct {
	DocenteID     *int    `json:"docente_id,omitempty"`
	FechaHora     *string `json:"fecha_hora,omitempty"`
	LlaveID       *int    `json:"llave_id,omitempty"`
	TurnoID       *int    `json:"turno_id,omitempty"`
	Tipo          *string `json:"tipo,omitempty"`
	Observaciones *string `json:"observaciones,omitempty"`
	EditadoPor    *int    `json:"editado_por,omitempty"`
}
