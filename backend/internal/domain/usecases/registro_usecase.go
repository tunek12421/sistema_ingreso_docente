package usecases

import (
	"fmt"
	"time"

	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/repositories"
)

type RegistroUseCase struct {
	registroRepo     repositories.RegistroRepository
	turnoRepo        repositories.TurnoRepository
	llaveRepo        repositories.LlaveRepository
	asignacionRepo   repositories.AsignacionRepository
}

func NewRegistroUseCase(
	registroRepo repositories.RegistroRepository,
	turnoRepo repositories.TurnoRepository,
	llaveRepo repositories.LlaveRepository,
	asignacionRepo repositories.AsignacionRepository,
) *RegistroUseCase {
	return &RegistroUseCase{
		registroRepo:   registroRepo,
		turnoRepo:      turnoRepo,
		llaveRepo:      llaveRepo,
		asignacionRepo: asignacionRepo,
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

	// FLUJO HÍBRIDO INTELIGENTE: Verificar si existe asignación activa
	asignaciones, err := uc.asignacionRepo.FindByDocenteYFecha(docenteID, ahora)
	if err != nil {
		// Si hay error al buscar asignaciones, continuar pero marcar como excepcional
		asignaciones = []*entities.Asignacion{}
	}

	// Buscar asignación que coincida con el turno y ambiente actual
	var asignacionEncontrada *entities.Asignacion
	for _, asig := range asignaciones {
		if asig.TurnoID == turnoID && asig.AmbienteID == ambienteID && asig.Activo {
			asignacionEncontrada = asig
			break
		}
	}

	// Determinar si el registro es excepcional
	esExcepcional := asignacionEncontrada == nil

	// Si hay asignación y no se proporcionó llave, usar la de la asignación
	llaveAUsar := llaveID
	if asignacionEncontrada != nil && llaveID == nil && asignacionEncontrada.LlaveID != nil {
		llaveAUsar = asignacionEncontrada.LlaveID
	}

	registro := &entities.Registro{
		DocenteID:      docenteID,
		AmbienteID:     ambienteID,
		TurnoID:        turnoID,
		LlaveID:        llaveAUsar,
		Tipo:           entities.TipoIngreso,
		FechaHora:      ahora,
		MinutosRetraso: minutosRetraso,
		MinutosExtra:   0,
		EsExcepcional:  esExcepcional,
	}

	if err := uc.registroRepo.Create(registro); err != nil {
		return nil, fmt.Errorf("error creando registro: %w", err)
	}

	// Actualizar estado de llave a "en_uso"
	if llaveAUsar != nil {
		_ = uc.llaveRepo.UpdateEstado(*llaveAUsar, entities.EstadoEnUso)
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

	// FLUJO HÍBRIDO INTELIGENTE: Verificar si existe asignación activa
	asignaciones, err := uc.asignacionRepo.FindByDocenteYFecha(docenteID, ahora)
	if err != nil {
		asignaciones = []*entities.Asignacion{}
	}

	// Buscar asignación que coincida con el turno y ambiente actual
	var asignacionEncontrada *entities.Asignacion
	for _, asig := range asignaciones {
		if asig.TurnoID == turnoID && asig.AmbienteID == ambienteID && asig.Activo {
			asignacionEncontrada = asig
			break
		}
	}

	// Determinar si el registro es excepcional
	esExcepcional := asignacionEncontrada == nil

	// Si hay asignación y no se proporcionó llave, usar la de la asignación
	llaveAUsar := llaveID
	if asignacionEncontrada != nil && llaveID == nil && asignacionEncontrada.LlaveID != nil {
		llaveAUsar = asignacionEncontrada.LlaveID
	}

	registro := &entities.Registro{
		DocenteID:      docenteID,
		AmbienteID:     ambienteID,
		TurnoID:        turnoID,
		LlaveID:        llaveAUsar,
		Tipo:           entities.TipoSalida,
		FechaHora:      ahora,
		MinutosRetraso: 0,
		MinutosExtra:   minutosExtra,
		EsExcepcional:  esExcepcional,
	}

	if err := uc.registroRepo.Create(registro); err != nil {
		return nil, fmt.Errorf("error creando registro: %w", err)
	}

	// Actualizar estado de llave a "disponible"
	if llaveAUsar != nil {
		_ = uc.llaveRepo.UpdateEstado(*llaveAUsar, entities.EstadoDisponible)
	}

	return registro, nil
}

func (uc *RegistroUseCase) GetByFecha(fecha time.Time) ([]*entities.Registro, error) {
	return uc.registroRepo.FindByFecha(fecha)
}

func (uc *RegistroUseCase) GetByDocente(docenteID int) ([]*entities.Registro, error) {
	return uc.registroRepo.FindByDocente(docenteID)
}

func (uc *RegistroUseCase) GetRegistrosHoy() ([]*entities.Registro, error) {
	return uc.registroRepo.FindRegistrosHoy()
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
