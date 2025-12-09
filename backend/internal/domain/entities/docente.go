package entities

import "time"

type Docente struct {
	ID                  int       `json:"id"`
	UsuarioID           *int      `json:"usuario_id,omitempty"`
	DocumentoIdentidad  int64     `json:"documento_identidad"`
	NombreCompleto      string    `json:"nombre_completo"`
	Correo              string    `json:"correo"`
	Telefono            *int64    `json:"telefono,omitempty"`
	Activo              bool      `json:"activo"`
	FaceDescriptors     *string   `json:"face_descriptors,omitempty"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}
