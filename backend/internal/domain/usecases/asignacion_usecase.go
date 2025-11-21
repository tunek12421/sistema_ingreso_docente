package usecases

import (
	"fmt"
	"time"

	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/repositories"
)

type AsignacionUseCase struct {
	asignacionRepo repositories.AsignacionRepository
}

func NewAsignacionUseCase(asignacionRepo repositories.AsignacionRepository) *AsignacionUseCase {
	return &AsignacionUseCase{asignacionRepo: asignacionRepo}
}

func (uc *AsignacionUseCase) GetAll() ([]*entities.Asignacion, error) {
	return uc.asignacionRepo.FindAll()
}

func (uc *AsignacionUseCase) GetByID(id int) (*entities.Asignacion, error) {
	return uc.asignacionRepo.FindByID(id)
}

func (uc *AsignacionUseCase) GetByDocente(docenteID int) ([]*entities.Asignacion, error) {
	return uc.asignacionRepo.FindByDocente(docenteID)
}

func (uc *AsignacionUseCase) GetByDocenteYFecha(docenteID int, fecha time.Time) ([]*entities.Asignacion, error) {
	return uc.asignacionRepo.FindByDocenteYFecha(docenteID, fecha)
}

func (uc *AsignacionUseCase) Create(asignacion *entities.Asignacion) error {
	if asignacion.DocenteID <= 0 {
		return fmt.Errorf("docente_id requerido")
	}
	if asignacion.TurnoID <= 0 {
		return fmt.Errorf("turno_id requerido")
	}
	if asignacion.AmbienteID <= 0 {
		return fmt.Errorf("ambiente_id requerido")
	}
	if asignacion.FechaInicio.IsZero() {
		return fmt.Errorf("fecha_inicio requerida")
	}

	asignacion.Activo = true
	return uc.asignacionRepo.Create(asignacion)
}

func (uc *AsignacionUseCase) Update(asignacion *entities.Asignacion) error {
	if asignacion.ID <= 0 {
		return fmt.Errorf("ID invalido")
	}
	return uc.asignacionRepo.Update(asignacion)
}

func (uc *AsignacionUseCase) Delete(id int) error {
	return uc.asignacionRepo.Delete(id)
}
