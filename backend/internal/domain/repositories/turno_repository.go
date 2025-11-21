package repositories

import "github.com/sistema-ingreso-docente/backend/internal/domain/entities"

type TurnoRepository interface {
	FindByID(id int) (*entities.Turno, error)
	FindAll() ([]*entities.Turno, error)
	Create(turno *entities.Turno) error
	Update(turno *entities.Turno) error
	Delete(id int) error
}
