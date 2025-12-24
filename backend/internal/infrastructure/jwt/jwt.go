package jwt

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
)

type Claims struct {
	UserID   int          `json:"user_id"`
	Username string       `json:"username"`
	Rol      entities.Rol `json:"rol"`
	jwt.RegisteredClaims
}

var jwtSecret []byte

func init() {
	secret := os.Getenv("JWT_SECRET")

	// En producción, JWT_SECRET es obligatorio
	if secret == "" {
		env := os.Getenv("GO_ENV")
		if env == "production" {
			log.Fatal("FATAL: JWT_SECRET no configurado en producción")
		}
		// Solo en desarrollo generar secreto temporal
		secret = generateRandomSecret()
		log.Printf("ADVERTENCIA: Usando JWT_SECRET temporal para desarrollo. NO usar en producción.")
	}

	// Validar longitud mínima del secreto (256 bits = 32 bytes)
	if len(secret) < 32 {
		env := os.Getenv("GO_ENV")
		if env == "production" {
			log.Fatal("FATAL: JWT_SECRET debe tener al menos 32 caracteres")
		}
		log.Printf("ADVERTENCIA: JWT_SECRET muy corto (%d chars). Usar mínimo 32 caracteres en producción.", len(secret))
	}

	jwtSecret = []byte(secret)
}

// generateRandomSecret genera un secreto aleatorio seguro para desarrollo
func generateRandomSecret() string {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		log.Fatal("Error generando secreto aleatorio:", err)
	}
	return base64.URLEncoding.EncodeToString(bytes)
}

// GetTokenExpiration retorna la duración de expiración del token
func GetTokenExpiration() time.Duration {
	env := os.Getenv("GO_ENV")
	if env == "production" {
		return 2 * time.Hour // 2 horas en producción
	}
	return 24 * time.Hour // 24 horas en desarrollo
}

func GenerateToken(user *entities.Usuario) (string, error) {
	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Rol:      user.Rol,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(GetTokenExpiration())),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "sistema-ingreso-docente",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de firma inválido: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("token inválido")
}
