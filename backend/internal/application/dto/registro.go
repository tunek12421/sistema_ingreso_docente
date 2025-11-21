package dto

type RegistroIngresoRequest struct {
	CI       int64  `json:"ci"`
	LlaveID  *int   `json:"llave_id,omitempty"`
}

type RegistroSalidaRequest struct {
	CI      int64 `json:"ci"`
	LlaveID *int  `json:"llave_id,omitempty"`
}
