package repositories

import "github.com/sistema-ingreso-docente/backend/internal/domain/entities"

type LlaveRepository interface {
	FindByID(id int) (*entities.Llave, error)
	FindByCodigo(codigo string) (*entities.Llave, error)
	FindByAulaCodigo(aulaCodigo string) ([]*entities.Llave, error)
	FindAll() ([]*entities.Llave, error)
	Create(llave *entities.Llave) error
	Update(llave *entities.Llave) error
	UpdateEstado(id int, estado entities.EstadoLlave) error
	Delete(id int) error
}
