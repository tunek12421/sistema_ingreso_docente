package usecases

import (
	"fmt"
	"time"

	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/repositories"
)

type RegistroUseCase struct {
	registroRepo repositories.RegistroRepository
	turnoRepo    repositories.TurnoRepository
	llaveRepo    repositories.LlaveRepository
}

func NewRegistroUseCase(
	registroRepo repositories.RegistroRepository,
	turnoRepo repositories.TurnoRepository,
	llaveRepo repositories.LlaveRepository,
) *RegistroUseCase {
	return &RegistroUseCase{
		registroRepo: registroRepo,
		turnoRepo:    turnoRepo,
		llaveRepo:    llaveRepo,
	}
}

func (uc *RegistroUseCase) RegistrarIngreso(docenteID, ambienteID, turnoID int, llaveID *int) (*entities.Registro, error) {
	// Obtener turno para calcular retraso
	turno, err := uc.turnoRepo.FindByID(turnoID)
	if err != nil {
		return nil, fmt.Errorf("turno no encontrado: %w", err)
	}

	ahora := time.Now()
	minutosRetraso := uc.calcularRetraso(ahora, turno.HoraInicio)

	registro := &entities.Registro{
		DocenteID:      docenteID,
		AmbienteID:     ambienteID,
		TurnoID:        turnoID,
		LlaveID:        llaveID,
		Tipo:           entities.TipoIngreso,
		FechaHora:      ahora,
		MinutosRetraso: minutosRetraso,
		MinutosExtra:   0,
	}

	if err := uc.registroRepo.Create(registro); err != nil {
		return nil, fmt.Errorf("error creando registro: %w", err)
	}

	// Actualizar estado de llave a "en_uso"
	if llaveID != nil {
		_ = uc.llaveRepo.UpdateEstado(*llaveID, entities.EstadoEnUso)
	}

	return registro, nil
}

func (uc *RegistroUseCase) RegistrarSalida(docenteID, ambienteID, turnoID int, llaveID *int) (*entities.Registro, error) {
	// Obtener turno para calcular minutos extra
	turno, err := uc.turnoRepo.FindByID(turnoID)
	if err != nil {
		return nil, fmt.Errorf("turno no encontrado: %w", err)
	}

	ahora := time.Now()
	minutosExtra := uc.calcularMinutosExtra(ahora, turno.HoraFin)

	registro := &entities.Registro{
		DocenteID:      docenteID,
		AmbienteID:     ambienteID,
		TurnoID:        turnoID,
		LlaveID:        llaveID,
		Tipo:           entities.TipoSalida,
		FechaHora:      ahora,
		MinutosRetraso: 0,
		MinutosExtra:   minutosExtra,
	}

	if err := uc.registroRepo.Create(registro); err != nil {
		return nil, fmt.Errorf("error creando registro: %w", err)
	}

	// Actualizar estado de llave a "disponible"
	if llaveID != nil {
		_ = uc.llaveRepo.UpdateEstado(*llaveID, entities.EstadoDisponible)
	}

	return registro, nil
}

func (uc *RegistroUseCase) GetByFecha(fecha time.Time) ([]*entities.Registro, error) {
	return uc.registroRepo.FindByFecha(fecha)
}

func (uc *RegistroUseCase) GetByDocente(docenteID int) ([]*entities.Registro, error) {
	return uc.registroRepo.FindByDocente(docenteID)
}

func (uc *RegistroUseCase) calcularRetraso(ahora time.Time, horaInicio string) int {
	// Parsear hora de inicio del turno
	layout := "15:04:05"
	inicio, err := time.Parse(layout, horaInicio)
	if err != nil {
		return 0
	}

	// Combinar fecha actual con hora de inicio del turno
	horaInicioTurno := time.Date(ahora.Year(), ahora.Month(), ahora.Day(),
		inicio.Hour(), inicio.Minute(), inicio.Second(), 0, ahora.Location())

	// Si llegó después de la hora de inicio, calcular retraso
	if ahora.After(horaInicioTurno) {
		return int(ahora.Sub(horaInicioTurno).Minutes())
	}

	return 0
}

func (uc *RegistroUseCase) calcularMinutosExtra(ahora time.Time, horaFin string) int {
	layout := "15:04:05"
	fin, err := time.Parse(layout, horaFin)
	if err != nil {
		return 0
	}

	horaFinTurno := time.Date(ahora.Year(), ahora.Month(), ahora.Day(),
		fin.Hour(), fin.Minute(), fin.Second(), 0, ahora.Location())

	// Si salió después de la hora de fin, calcular minutos extra
	if ahora.After(horaFinTurno) {
		return int(ahora.Sub(horaFinTurno).Minutes())
	}

	return 0
}
