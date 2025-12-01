package dto

import "time"

type RegistroHoyResponse struct {
	ID             int       `json:"id"`
	DocenteID      int       `json:"docente_id"`
	DocenteNombre  string    `json:"docente_nombre"`
	DocenteCI      int64     `json:"docente_ci"`
	TurnoID        int       `json:"turno_id"`
	TurnoNombre    string    `json:"turno_nombre"`
	LlaveID        *int      `json:"llave_id,omitempty"`
	LlaveCodigo    *string   `json:"llave_codigo,omitempty"`
	AulaCodigo     *string   `json:"aula_codigo,omitempty"`
	AulaNombre     *string   `json:"aula_nombre,omitempty"`
	Tipo           string    `json:"tipo"`
	FechaHora      time.Time `json:"fecha_hora"`
	MinutosRetraso int       `json:"minutos_retraso"`
	MinutosExtra   int       `json:"minutos_extra"`
	EsExcepcional  bool      `json:"es_excepcional"`
}
