package usecases

import (
	"fmt"

	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/repositories"
)

type TurnoUseCase struct {
	turnoRepo repositories.TurnoRepository
}

func NewTurnoUseCase(turnoRepo repositories.TurnoRepository) *TurnoUseCase {
	return &TurnoUseCase{turnoRepo: turnoRepo}
}

func (uc *TurnoUseCase) GetAll() ([]*entities.Turno, error) {
	return uc.turnoRepo.FindAll()
}

func (uc *TurnoUseCase) GetByID(id int) (*entities.Turno, error) {
	return uc.turnoRepo.FindByID(id)
}

func (uc *TurnoUseCase) Create(turno *entities.Turno) error {
	if turno.Nombre == "" {
		return fmt.Errorf("nombre requerido")
	}
	if turno.HoraInicio == "" || turno.HoraFin == "" {
		return fmt.Errorf("horarios requeridos")
	}

	turno.Activo = true
	return uc.turnoRepo.Create(turno)
}

func (uc *TurnoUseCase) Update(turno *entities.Turno) error {
	if turno.ID <= 0 {
		return fmt.Errorf("ID inválido")
	}
	return uc.turnoRepo.Update(turno)
}

func (uc *TurnoUseCase) Delete(id int) error {
	return uc.turnoRepo.Delete(id)
}
