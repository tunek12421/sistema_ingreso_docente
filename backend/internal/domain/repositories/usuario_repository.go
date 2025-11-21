package repositories

import "github.com/sistema-ingreso-docente/backend/internal/domain/entities"

type UsuarioRepository interface {
	FindByUsername(username string) (*entities.Usuario, error)
	FindByID(id int) (*entities.Usuario, error)
	Create(usuario *entities.Usuario) error
	Update(usuario *entities.Usuario) error
	Delete(id int) error
	FindAll() ([]*entities.Usuario, error)
}
