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

func (uc *RegistroUseCase) RegistrarIngreso(docenteID, turnoID int, llaveID *int, observaciones *string) (*entities.Registro, error) {
	// Obtener turno para calcular retraso
	turno, err := uc.turnoRepo.FindByID(turnoID)
	if err != nil {
		return nil, fmt.Errorf("turno no encontrado: %w", err)
	}

	ahora := time.Now()
	minutosRetraso := uc.calcularRetraso(ahora, turno.HoraInicio)

	registro := &entities.Registro{
		DocenteID:      docenteID,
		TurnoID:        turnoID,
		LlaveID:        llaveID,
		Tipo:           entities.TipoIngreso,
		FechaHora:      ahora,
		MinutosRetraso: minutosRetraso,
		MinutosExtra:   0,
		EsExcepcional:  false,
		Observaciones:  observaciones,
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

func (uc *RegistroUseCase) RegistrarSalida(docenteID, turnoID int, llaveID *int, observaciones *string) (*entities.Registro, error) {
	// Obtener turno para calcular minutos extra
	turno, err := uc.turnoRepo.FindByID(turnoID)
	if err != nil {
		return nil, fmt.Errorf("turno no encontrado: %w", err)
	}

	ahora := time.Now()
	minutosExtra := uc.calcularMinutosExtra(ahora, turno.HoraFin)

	registro := &entities.Registro{
		DocenteID:      docenteID,
		TurnoID:        turnoID,
		LlaveID:        llaveID,
		Tipo:           entities.TipoSalida,
		FechaHora:      ahora,
		MinutosRetraso: 0,
		MinutosExtra:   minutosExtra,
		EsExcepcional:  false,
		Observaciones:  observaciones,
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

func (uc *RegistroUseCase) GetRegistrosHoy() ([]*entities.Registro, error) {
	return uc.registroRepo.FindRegistrosHoy()
}

func (uc *RegistroUseCase) GetLlaveActualDocente(docenteID int) (*int, error) {
	registro, err := uc.registroRepo.FindUltimoIngresoConLlave(docenteID)
	if err != nil {
		return nil, err
	}
	return registro.LlaveID, nil
}

func (uc *RegistroUseCase) GetByID(id int) (*entities.Registro, error) {
	return uc.registroRepo.FindByID(id)
}

func (uc *RegistroUseCase) Update(registro *entities.Registro) error {
	if registro.ID <= 0 {
		return fmt.Errorf("ID de registro inválido")
	}
	return uc.registroRepo.Update(registro)
}

func (uc *RegistroUseCase) calcularRetraso(ahora time.Time, horaInicio string) int {
	// Parsear hora de inicio del turno (puede venir como "15:04:05" o "0000-01-01T15:00:00Z")
	var inicio time.Time
	var err error

	// Intentar parsear como timestamp ISO primero
	inicio, err = time.Parse(time.RFC3339, horaInicio)
	if err != nil {
		// Si falla, intentar como hora simple
		inicio, err = time.Parse("15:04:05", horaInicio)
		if err != nil {
			return 0
		}
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
	// Parsear hora de fin del turno (puede venir como "18:00:00" o "0000-01-01T18:00:00Z")
	var fin time.Time
	var err error

	// Intentar parsear como timestamp ISO primero
	fin, err = time.Parse(time.RFC3339, horaFin)
	if err != nil {
		// Si falla, intentar como hora simple
		fin, err = time.Parse("15:04:05", horaFin)
		if err != nil {
			return 0
		}
	}

	horaFinTurno := time.Date(ahora.Year(), ahora.Month(), ahora.Day(),
		fin.Hour(), fin.Minute(), fin.Second(), 0, ahora.Location())

	// Si salió después de la hora de fin, calcular minutos extra
	if ahora.After(horaFinTurno) {
		return int(ahora.Sub(horaFinTurno).Minutes())
	}

	return 0
}
