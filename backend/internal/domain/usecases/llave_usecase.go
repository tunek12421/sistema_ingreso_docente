package usecases

import (
	"fmt"

	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/repositories"
)

type LlaveUseCase struct {
	llaveRepo repositories.LlaveRepository
}

func NewLlaveUseCase(llaveRepo repositories.LlaveRepository) *LlaveUseCase {
	return &LlaveUseCase{llaveRepo: llaveRepo}
}

func (uc *LlaveUseCase) GetAll() ([]*entities.Llave, error) {
	return uc.llaveRepo.FindAll()
}

func (uc *LlaveUseCase) GetByID(id int) (*entities.Llave, error) {
	return uc.llaveRepo.FindByID(id)
}

func (uc *LlaveUseCase) GetByCodigo(codigo string) (*entities.Llave, error) {
	return uc.llaveRepo.FindByCodigo(codigo)
}

func (uc *LlaveUseCase) GetByAulaCodigo(aulaCodigo string) ([]*entities.Llave, error) {
	return uc.llaveRepo.FindByAulaCodigo(aulaCodigo)
}

func (uc *LlaveUseCase) Search(query string) ([]*entities.Llave, error) {
	if len(query) < 1 {
		return []*entities.Llave{}, nil
	}
	return uc.llaveRepo.Search(query)
}

func (uc *LlaveUseCase) Create(llave *entities.Llave) error {
	if llave.Codigo == "" {
		return fmt.Errorf("código requerido")
	}
	if llave.AulaCodigo == "" {
		return fmt.Errorf("código de aula requerido")
	}
	if llave.AulaNombre == "" {
		return fmt.Errorf("nombre de aula requerido")
	}

	llave.Estado = entities.EstadoDisponible
	return uc.llaveRepo.Create(llave)
}

func (uc *LlaveUseCase) Update(llave *entities.Llave) error {
	if llave.ID <= 0 {
		return fmt.Errorf("ID inválido")
	}
	return uc.llaveRepo.Update(llave)
}

func (uc *LlaveUseCase) UpdateEstado(id int, estado entities.EstadoLlave) error {
	return uc.llaveRepo.UpdateEstado(id, estado)
}

func (uc *LlaveUseCase) Delete(id int) error {
	return uc.llaveRepo.Delete(id)
}
