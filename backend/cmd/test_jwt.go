package main

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
	Rol      string `json:"rol"`
	jwt.RegisteredClaims
}

func main() {
	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	if len(jwtSecret) == 0 {
		jwtSecret = []byte("tu_clave_secreta_muy_segura_cambiar_en_produccion")
	}

	tokenString := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sIjoiamVmZV9jYXJyZXJhIiwiZXhwIjoxNzY0NjkxNTY0LCJpYXQiOjE3NjQ2MDUxNjR9.Azoh_9sp2dftbtA8iy2bqBmthcQZqlZoAhETFrTaiNk"

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de firma inválido")
		}
		return jwtSecret, nil
	})

	fmt.Printf("JWT Secret: %s\n", string(jwtSecret))
	fmt.Printf("Current time: %v\n", time.Now().Unix())

	if err != nil {
		fmt.Printf("Error parsing token: %v\n", err)
		return
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		fmt.Printf("Token válido!\n")
		fmt.Printf("UserID: %d\n", claims.UserID)
		fmt.Printf("Username: %s\n", claims.Username)
		fmt.Printf("Rol: %s\n", claims.Rol)
	} else {
		fmt.Printf("Token inválido\n")
	}
}
