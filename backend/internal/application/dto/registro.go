package dto

type RegistroIngresoRequest struct {
	CI          int64  `json:"ci"`
	AmbienteID  *int   `json:"ambiente_id,omitempty"`
	TurnoID     *int   `json:"turno_id,omitempty"`
	LlaveID     *int   `json:"llave_id,omitempty"`
}

type RegistroSalidaRequest struct {
	CI          int64 `json:"ci"`
	AmbienteID  *int  `json:"ambiente_id,omitempty"`
	TurnoID     *int  `json:"turno_id,omitempty"`
	LlaveID     *int  `json:"llave_id,omitempty"`
}
