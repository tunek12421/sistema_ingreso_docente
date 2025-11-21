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

func (uc *AuthUseCase) Login(username, password string) (string, *entities.Usuario, error) {
	usuario, err := uc.usuarioRepo.FindByUsername(username)
	if err != nil {
		return "", nil, fmt.Errorf("credenciales inválidas")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(usuario.Password), []byte(password)); err != nil {
		return "", nil, fmt.Errorf("credenciales inválidas")
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
