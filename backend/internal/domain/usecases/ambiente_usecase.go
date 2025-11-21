package usecases

import (
	"fmt"

	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/repositories"
)

type AmbienteUseCase struct {
	ambienteRepo repositories.AmbienteRepository
}

func NewAmbienteUseCase(ambienteRepo repositories.AmbienteRepository) *AmbienteUseCase {
	return &AmbienteUseCase{ambienteRepo: ambienteRepo}
}

func (uc *AmbienteUseCase) GetAll() ([]*entities.Ambiente, error) {
	return uc.ambienteRepo.FindAll()
}

func (uc *AmbienteUseCase) GetByID(id int) (*entities.Ambiente, error) {
	return uc.ambienteRepo.FindByID(id)
}

func (uc *AmbienteUseCase) GetByCodigo(codigo string) (*entities.Ambiente, error) {
	return uc.ambienteRepo.FindByCodigo(codigo)
}

func (uc *AmbienteUseCase) Create(ambiente *entities.Ambiente) error {
	if ambiente.Codigo == "" {
		return fmt.Errorf("código requerido")
	}

	ambiente.Activo = true
	return uc.ambienteRepo.Create(ambiente)
}

func (uc *AmbienteUseCase) Update(ambiente *entities.Ambiente) error {
	if ambiente.ID <= 0 {
		return fmt.Errorf("ID inválido")
	}
	return uc.ambienteRepo.Update(ambiente)
}

func (uc *AmbienteUseCase) Delete(id int) error {
	return uc.ambienteRepo.Delete(id)
}
