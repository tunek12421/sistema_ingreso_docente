package usecases

import (
	"fmt"
	"time"

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

// GetTurnoActual obtiene el turno que corresponde a la hora actual de Bolivia (UTC-4)
// Incluye un margen de tolerancia de 10 minutos después del fin del turno
func (uc *TurnoUseCase) GetTurnoActual() (*entities.Turno, error) {
	// Obtener hora UTC actual
	nowUTC := time.Now().UTC()

	// Convertir a hora de Bolivia (UTC-4)
	boliviaLocation, err := time.LoadLocation("America/La_Paz")
	if err != nil {
		return nil, fmt.Errorf("error cargando timezone de Bolivia: %v", err)
	}

	nowBolivia := nowUTC.In(boliviaLocation)

	// Obtener todos los turnos activos
	turnos, err := uc.turnoRepo.FindAll()
	if err != nil {
		return nil, err
	}

	// Margen de tolerancia: 10 minutos después del fin del turno
	margenTolerancia := 10 * time.Minute

	// Buscar el turno que corresponde a la hora actual
	for _, turno := range turnos {
		if !turno.Activo {
			continue
		}

		// Parsear hora_inicio y hora_fin
		horaInicio, err := time.Parse("15:04:05", turno.HoraInicio)
		if err != nil {
			continue
		}

		horaFin, err := time.Parse("15:04:05", turno.HoraFin)
		if err != nil {
			continue
		}

		// Construir tiempos completos para hoy con las horas del turno
		inicioTurno := time.Date(nowBolivia.Year(), nowBolivia.Month(), nowBolivia.Day(),
			horaInicio.Hour(), horaInicio.Minute(), horaInicio.Second(), 0, boliviaLocation)

		finTurno := time.Date(nowBolivia.Year(), nowBolivia.Month(), nowBolivia.Day(),
			horaFin.Hour(), horaFin.Minute(), horaFin.Second(), 0, boliviaLocation)

		// Añadir margen de tolerancia al fin del turno
		finTurnoConMargen := finTurno.Add(margenTolerancia)

		// Verificar si la hora actual está dentro del rango (incluyendo margen)
		if nowBolivia.After(inicioTurno) && nowBolivia.Before(finTurnoConMargen) {
			return turno, nil
		}
	}

	// Si no se encuentra turno exacto, devolver nil sin error
	return nil, nil
}
