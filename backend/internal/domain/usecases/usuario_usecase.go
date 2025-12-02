package usecases

import (
	"errors"

	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/repositories"
	"golang.org/x/crypto/bcrypt"
)

type UsuarioUseCase struct {
	repo repositories.UsuarioRepository
}

func NewUsuarioUseCase(repo repositories.UsuarioRepository) *UsuarioUseCase {
	return &UsuarioUseCase{repo: repo}
}

func (uc *UsuarioUseCase) GetAll() ([]*entities.Usuario, error) {
	return uc.repo.FindAll()
}

func (uc *UsuarioUseCase) GetByID(id int) (*entities.Usuario, error) {
	return uc.repo.FindByID(id)
}

func (uc *UsuarioUseCase) Create(usuario *entities.Usuario) error {
	// Validar que el rol sea válido
	if usuario.Rol != entities.RolAdministrador &&
		usuario.Rol != entities.RolJefeCarrera &&
		usuario.Rol != entities.RolBibliotecario &&
		usuario.Rol != entities.RolDocente {
		return errors.New("rol inválido")
	}

	// Validar que el username no esté vacío
	if usuario.Username == "" {
		return errors.New("el username es requerido")
	}

	// Validar que el password no esté vacío
	if usuario.Password == "" {
		return errors.New("la contraseña es requerida")
	}

	// Verificar que el username no exista
	existing, _ := uc.repo.FindByUsername(usuario.Username)
	if existing != nil {
		return errors.New("el username ya existe")
	}

	// Hashear la contraseña
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(usuario.Password), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("error al hashear la contraseña")
	}
	usuario.Password = string(hashedPassword)

	// Por defecto, el usuario está activo
	usuario.Activo = true

	return uc.repo.Create(usuario)
}

func (uc *UsuarioUseCase) Update(usuario *entities.Usuario) error {
	// Verificar que el usuario existe
	existing, err := uc.repo.FindByID(usuario.ID)
	if err != nil {
		return errors.New("usuario no encontrado")
	}

	// No permitir cambiar el username
	usuario.Username = existing.Username

	// No actualizar la contraseña aquí (usar ChangePassword)
	usuario.Password = existing.Password

	return uc.repo.Update(usuario)
}

func (uc *UsuarioUseCase) Delete(id int) error {
	// Verificar que el usuario existe
	_, err := uc.repo.FindByID(id)
	if err != nil {
		return errors.New("usuario no encontrado")
	}

	return uc.repo.Delete(id)
}

func (uc *UsuarioUseCase) ChangePassword(id int, newPassword string) error {
	if newPassword == "" {
		return errors.New("la contraseña no puede estar vacía")
	}

	// Verificar que el usuario existe
	usuario, err := uc.repo.FindByID(id)
	if err != nil {
		return errors.New("usuario no encontrado")
	}

	// Hashear la nueva contraseña
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("error al hashear la contraseña")
	}

	usuario.Password = string(hashedPassword)
	return uc.repo.Update(usuario)
}

func (uc *UsuarioUseCase) ToggleActive(id int) error {
	// Verificar que el usuario existe
	usuario, err := uc.repo.FindByID(id)
	if err != nil {
		return errors.New("usuario no encontrado")
	}

	// Cambiar el estado
	usuario.Activo = !usuario.Activo

	return uc.repo.Update(usuario)
}

// UsernameExists verifica si un username ya está en uso
func (uc *UsuarioUseCase) UsernameExists(username string) bool {
	existing, _ := uc.repo.FindByUsername(username)
	return existing != nil
}
