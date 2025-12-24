package usecases

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/repositories"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/jwt"
)

type AuthUseCase struct {
	usuarioRepo repositories.UsuarioRepository
}

func NewAuthUseCase(usuarioRepo repositories.UsuarioRepository) *AuthUseCase {
	return &AuthUseCase{usuarioRepo: usuarioRepo}
}

// dummyHash es un hash bcrypt pre-calculado usado para prevenir timing attacks
// cuando el usuario no existe, aún ejecutamos bcrypt.CompareHashAndPassword
// para que el tiempo de respuesta sea consistente
var dummyHash = []byte("$2a$10$dummyhashfortimingatttackprevention1234567890")

func (uc *AuthUseCase) Login(username, password string) (string, *entities.Usuario, error) {
	usuario, err := uc.usuarioRepo.FindByUsername(username)

	// Siempre ejecutar bcrypt.CompareHashAndPassword para prevenir timing attacks
	// Si el usuario no existe, usamos un hash dummy para que el tiempo sea consistente
	var hashToCompare []byte
	if err != nil || usuario == nil {
		hashToCompare = dummyHash
	} else {
		hashToCompare = []byte(usuario.Password)
	}

	// Ejecutar comparación siempre (incluso si usuario no existe)
	bcryptErr := bcrypt.CompareHashAndPassword(hashToCompare, []byte(password))

	// Ahora verificamos los errores después de la comparación
	if err != nil || usuario == nil {
		return "", nil, fmt.Errorf("credenciales inválidas")
	}

	if bcryptErr != nil {
		return "", nil, fmt.Errorf("credenciales inválidas")
	}

	// Verificar que el usuario esté activo
	if !usuario.Activo {
		return "", nil, fmt.Errorf("usuario desactivado")
	}

	token, err := jwt.GenerateToken(usuario)
	if err != nil {
		return "", nil, fmt.Errorf("error generando token: %w", err)
	}

	return token, usuario, nil
}

func (uc *AuthUseCase) Register(username, password string, rol entities.Rol) (*entities.Usuario, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("error hasheando contraseña: %w", err)
	}

	usuario := &entities.Usuario{
		Username: username,
		Password: string(hashedPassword),
		Rol:      rol,
		Activo:   true,
	}

	if err := uc.usuarioRepo.Create(usuario); err != nil {
		return nil, fmt.Errorf("error creando usuario: %w", err)
	}

	return usuario, nil
}
