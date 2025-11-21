package usecases

import (
	"fmt"

	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/repositories"
)

type DocenteUseCase struct {
	docenteRepo repositories.DocenteRepository
}

func NewDocenteUseCase(docenteRepo repositories.DocenteRepository) *DocenteUseCase {
	return &DocenteUseCase{docenteRepo: docenteRepo}
}

func (uc *DocenteUseCase) GetAll() ([]*entities.Docente, error) {
	return uc.docenteRepo.FindAll()
}

func (uc *DocenteUseCase) GetByID(id int) (*entities.Docente, error) {
	return uc.docenteRepo.FindByID(id)
}

func (uc *DocenteUseCase) GetByCI(ci int64) (*entities.Docente, error) {
	return uc.docenteRepo.FindByCI(ci)
}

func (uc *DocenteUseCase) Create(docente *entities.Docente) error {
	if docente.DocumentoIdentidad <= 0 {
		return fmt.Errorf("documento de identidad inválido")
	}
	if docente.NombreCompleto == "" {
		return fmt.Errorf("nombre completo requerido")
	}
	if docente.Correo == "" {
		return fmt.Errorf("correo requerido")
	}

	docente.Activo = true
	return uc.docenteRepo.Create(docente)
}

func (uc *DocenteUseCase) Update(docente *entities.Docente) error {
	if docente.ID <= 0 {
		return fmt.Errorf("ID inválido")
	}
	return uc.docenteRepo.Update(docente)
}

func (uc *DocenteUseCase) Delete(id int) error {
	return uc.docenteRepo.Delete(id)
}
