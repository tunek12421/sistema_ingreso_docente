package repositories

import "github.com/sistema-ingreso-docente/backend/internal/domain/entities"

type AmbienteRepository interface {
	FindByID(id int) (*entities.Ambiente, error)
	FindByCodigo(codigo string) (*entities.Ambiente, error)
	FindAll() ([]*entities.Ambiente, error)
	Create(ambiente *entities.Ambiente) error
	Update(ambiente *entities.Ambiente) error
	Delete(id int) error
}
