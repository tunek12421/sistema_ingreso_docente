package repositories

import (
	"time"
	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
)

type AsignacionRepository interface {
	FindByID(id int) (*entities.Asignacion, error)
	FindAll() ([]*entities.Asignacion, error)
	FindByDocente(docenteID int) ([]*entities.Asignacion, error)
	FindByDocenteYFecha(docenteID int, fecha time.Time) ([]*entities.Asignacion, error)
	Create(asignacion *entities.Asignacion) error
	Update(asignacion *entities.Asignacion) error
	Delete(id int) error
}
