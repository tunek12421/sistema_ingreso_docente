package security

import (
	"fmt"
	"net/mail"
	"regexp"
	"strconv"
)

// Constantes de validación
const (
	MaxUsernameLength       = 50
	MinUsernameLength       = 3
	MaxNombreCompletoLength = 200
	MaxEmailLength          = 255
	MaxDescripcionLength    = 500
	MaxCodigoLength         = 50
	MinCIValue              = 100000
	MaxCIValue              = 99999999
	MaxIDValue              = 2147483647 // INT_MAX para PostgreSQL
)

// usernameRegex solo permite letras, números, puntos, guiones y guion bajo
var usernameRegex = regexp.MustCompile(`^[a-zA-Z0-9._-]+$`)

// ValidateID valida que un ID sea un entero positivo dentro del rango válido
func ValidateID(idStr string) (int, error) {
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 0, fmt.Errorf("ID debe ser numérico")
	}
	if id <= 0 {
		return 0, fmt.Errorf("ID debe ser positivo")
	}
	if id > MaxIDValue {
		return 0, fmt.Errorf("ID fuera de rango")
	}
	return id, nil
}

// ValidateUsername valida el formato del username
func ValidateUsername(username string) error {
	if len(username) < MinUsernameLength {
		return fmt.Errorf("username debe tener al menos %d caracteres", MinUsernameLength)
	}
	if len(username) > MaxUsernameLength {
		return fmt.Errorf("username demasiado largo (máx %d caracteres)", MaxUsernameLength)
	}
	if !usernameRegex.MatchString(username) {
		return fmt.Errorf("username solo puede contener letras, números, puntos, guiones y guion bajo")
	}
	return nil
}

// ValidateEmail valida el formato del email (opcional - vacío es válido)
func ValidateEmail(email string) error {
	if email == "" {
		return nil // Email es opcional
	}
	if len(email) > MaxEmailLength {
		return fmt.Errorf("email demasiado largo (máx %d caracteres)", MaxEmailLength)
	}
	_, err := mail.ParseAddress(email)
	if err != nil {
		return fmt.Errorf("formato de email inválido")
	}
	return nil
}

// ValidateNombreCompleto valida la longitud del nombre completo
func ValidateNombreCompleto(nombre string) error {
	if len(nombre) > MaxNombreCompletoLength {
		return fmt.Errorf("nombre completo demasiado largo (máx %d caracteres)", MaxNombreCompletoLength)
	}
	return nil
}

// ValidateDescripcion valida la longitud de una descripción
func ValidateDescripcion(descripcion string) error {
	if len(descripcion) > MaxDescripcionLength {
		return fmt.Errorf("descripción demasiado larga (máx %d caracteres)", MaxDescripcionLength)
	}
	return nil
}

// ValidateCodigo valida la longitud de un código
func ValidateCodigo(codigo string) error {
	if codigo == "" {
		return fmt.Errorf("código es requerido")
	}
	if len(codigo) > MaxCodigoLength {
		return fmt.Errorf("código demasiado largo (máx %d caracteres)", MaxCodigoLength)
	}
	return nil
}

// ValidateCI valida el formato y rango del documento de identidad
func ValidateCI(ci int64) error {
	if ci <= 0 {
		return fmt.Errorf("CI debe ser positivo")
	}
	if ci < MinCIValue || ci > MaxCIValue {
		return fmt.Errorf("CI fuera de rango válido (%d-%d)", MinCIValue, MaxCIValue)
	}
	return nil
}

// ValidateCIString valida y parsea un CI desde string
func ValidateCIString(ciStr string) (int64, error) {
	ci, err := strconv.ParseInt(ciStr, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("CI debe ser numérico")
	}
	if err := ValidateCI(ci); err != nil {
		return 0, err
	}
	return ci, nil
}
