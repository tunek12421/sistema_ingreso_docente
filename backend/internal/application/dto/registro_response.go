package dto

import "time"

type RegistroHoyResponse struct {
	ID              int       `json:"id"`
	DocenteID       int       `json:"docente_id"`
	DocenteNombre   string    `json:"docente_nombre"`
	DocenteCI       int64     `json:"docente_ci"`
	AmbienteID      int       `json:"ambiente_id"`
	AmbienteCodigo  string    `json:"ambiente_codigo"`
	TurnoID         int       `json:"turno_id"`
	TurnoNombre     string    `json:"turno_nombre"`
	LlaveID         *int      `json:"llave_id,omitempty"`
	LlaveCodigo     *string   `json:"llave_codigo,omitempty"`
	Tipo            string    `json:"tipo"`
	FechaHora       time.Time `json:"fecha_hora"`
	MinutosRetraso  int       `json:"minutos_retraso"`
	MinutosExtra    int       `json:"minutos_extra"`
	EsExcepcional   bool      `json:"es_excepcional"`
}
