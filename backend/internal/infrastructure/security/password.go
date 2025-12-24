package security

import (
	"crypto/rand"
	"errors"
	"math/big"
	"strings"
	"unicode"
)

const (
	// Caracteres para generar contraseñas
	lowerChars   = "abcdefghijklmnopqrstuvwxyz"
	upperChars   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	digitChars   = "0123456789"
	specialChars = "!@#$%&*"
	allChars     = lowerChars + upperChars + digitChars + specialChars

	// Requisitos mínimos de contraseña
	MinPasswordLength = 8
	MaxPasswordLength = 128
)

// GenerateSecurePassword genera una contraseña aleatoria segura
func GenerateSecurePassword(length int) (string, error) {
	if length < MinPasswordLength {
		length = MinPasswordLength
	}

	// Garantizar al menos un carácter de cada tipo
	password := make([]byte, 0, length)

	// Agregar un carácter de cada tipo obligatorio
	lower, _ := randomChar(lowerChars)
	upper, _ := randomChar(upperChars)
	digit, _ := randomChar(digitChars)
	special, _ := randomChar(specialChars)

	password = append(password, lower, upper, digit, special)

	// Rellenar el resto con caracteres aleatorios
	for len(password) < length {
		char, err := randomChar(allChars)
		if err != nil {
			return "", err
		}
		password = append(password, char)
	}

	// Mezclar la contraseña para que los caracteres obligatorios no estén al inicio
	shuffled, err := shuffleBytes(password)
	if err != nil {
		return "", err
	}

	return string(shuffled), nil
}

// ValidatePasswordStrength valida que una contraseña cumpla requisitos mínimos
func ValidatePasswordStrength(password string) error {
	if len(password) < MinPasswordLength {
		return errors.New("la contraseña debe tener al menos 8 caracteres")
	}

	if len(password) > MaxPasswordLength {
		return errors.New("la contraseña es demasiado larga")
	}

	var hasLower, hasUpper, hasDigit bool

	for _, char := range password {
		switch {
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsDigit(char):
			hasDigit = true
		}
	}

	if !hasLower {
		return errors.New("la contraseña debe contener al menos una letra minúscula")
	}
	if !hasUpper {
		return errors.New("la contraseña debe contener al menos una letra mayúscula")
	}
	if !hasDigit {
		return errors.New("la contraseña debe contener al menos un número")
	}

	// Verificar contraseñas comunes
	if isCommonPassword(password) {
		return errors.New("la contraseña es muy común, elija otra más segura")
	}

	return nil
}

// randomChar selecciona un carácter aleatorio del charset
func randomChar(charset string) (byte, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
	if err != nil {
		return 0, err
	}
	return charset[n.Int64()], nil
}

// shuffleBytes mezcla aleatoriamente un slice de bytes
func shuffleBytes(data []byte) ([]byte, error) {
	result := make([]byte, len(data))
	copy(result, data)

	for i := len(result) - 1; i > 0; i-- {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(i+1)))
		if err != nil {
			return nil, err
		}
		j := n.Int64()
		result[i], result[j] = result[j], result[i]
	}

	return result, nil
}

// isCommonPassword verifica si la contraseña está en lista de contraseñas comunes
func isCommonPassword(password string) bool {
	commonPasswords := []string{
		"password", "123456", "12345678", "qwerty", "abc123",
		"monkey", "1234567", "letmein", "trustno1", "dragon",
		"baseball", "iloveyou", "master", "sunshine", "ashley",
		"bailey", "passw0rd", "shadow", "123123", "654321",
		"superman", "qazwsx", "michael", "football", "password1",
		"password123", "welcome", "welcome1", "admin", "login",
	}

	lowerPassword := strings.ToLower(password)
	for _, common := range commonPasswords {
		if lowerPassword == common {
			return true
		}
	}

	return false
}
