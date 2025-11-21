package repositories

import "github.com/sistema-ingreso-docente/backend/internal/domain/entities"

type DocenteRepository interface {
	FindByID(id int) (*entities.Docente, error)
	FindByCI(ci int64) (*entities.Docente, error)
	FindAll() ([]*entities.Docente, error)
	Create(docente *entities.Docente) error
	Update(docente *entities.Docente) error
	Delete(id int) error
}
