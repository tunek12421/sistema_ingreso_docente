package jwt

import (
	"fmt"
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

var jwtSecret = []byte(getEnv("JWT_SECRET", "tu_clave_secreta_muy_segura_cambiar_en_produccion"))

func GenerateToken(user *entities.Usuario) (string, error) {
	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Rol:      user.Rol,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de firma inválido")
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

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
