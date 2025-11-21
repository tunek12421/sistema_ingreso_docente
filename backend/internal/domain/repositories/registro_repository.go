package repositories

import (
	"time"
	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
)

type RegistroRepository interface {
	FindByID(id int) (*entities.Registro, error)
	FindAll() ([]*entities.Registro, error)
	FindByDocente(docenteID int) ([]*entities.Registro, error)
	FindByFecha(fecha time.Time) ([]*entities.Registro, error)
	FindByDocenteYFecha(docenteID int, fecha time.Time) ([]*entities.Registro, error)
	FindRegistrosHoy() ([]*entities.Registro, error)
	Create(registro *entities.Registro) error
	Update(registro *entities.Registro) error
	Delete(id int) error
}
