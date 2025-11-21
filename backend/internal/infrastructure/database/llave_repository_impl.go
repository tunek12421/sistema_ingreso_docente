package database

import (
	"database/sql"
	"fmt"

	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
)

type LlaveRepositoryImpl struct {
	db *sql.DB
}

func NewLlaveRepository(db *sql.DB) *LlaveRepositoryImpl {
	return &LlaveRepositoryImpl{db: db}
}

func (r *LlaveRepositoryImpl) FindByID(id int) (*entities.Llave, error) {
	query := `SELECT id, codigo, ambiente_id, estado, descripcion, activo, created_at, updated_at
	          FROM llaves WHERE id = $1`

	llave := &entities.Llave{}
	err := r.db.QueryRow(query, id).Scan(
		&llave.ID,
		&llave.Codigo,
		&llave.AmbienteID,
		&llave.Estado,
		&llave.Descripcion,
		&llave.Activo,
		&llave.CreatedAt,
		&llave.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("llave no encontrada")
	}
	if err != nil {
		return nil, err
	}

	return llave, nil
}

func (r *LlaveRepositoryImpl) FindByCodigo(codigo string) (*entities.Llave, error) {
	query := `SELECT id, codigo, ambiente_id, estado, descripcion, activo, created_at, updated_at
	          FROM llaves WHERE codigo = $1`

	llave := &entities.Llave{}
	err := r.db.QueryRow(query, codigo).Scan(
		&llave.ID,
		&llave.Codigo,
		&llave.AmbienteID,
		&llave.Estado,
		&llave.Descripcion,
		&llave.Activo,
		&llave.CreatedAt,
		&llave.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("llave no encontrada")
	}
	if err != nil {
		return nil, err
	}

	return llave, nil
}

func (r *LlaveRepositoryImpl) FindByAmbiente(ambienteID int) ([]*entities.Llave, error) {
	query := `SELECT id, codigo, ambiente_id, estado, descripcion, activo, created_at, updated_at
	          FROM llaves WHERE ambiente_id = $1 AND activo = TRUE ORDER BY codigo`

	rows, err := r.db.Query(query, ambienteID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	llaves := []*entities.Llave{}
	for rows.Next() {
		llave := &entities.Llave{}
		err := rows.Scan(
			&llave.ID,
			&llave.Codigo,
			&llave.AmbienteID,
			&llave.Estado,
			&llave.Descripcion,
			&llave.Activo,
			&llave.CreatedAt,
			&llave.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		llaves = append(llaves, llave)
	}

	return llaves, nil
}

func (r *LlaveRepositoryImpl) FindAll() ([]*entities.Llave, error) {
	query := `SELECT id, codigo, ambiente_id, estado, descripcion, activo, created_at, updated_at
	          FROM llaves WHERE activo = TRUE ORDER BY codigo`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	llaves := []*entities.Llave{}
	for rows.Next() {
		llave := &entities.Llave{}
		err := rows.Scan(
			&llave.ID,
			&llave.Codigo,
			&llave.AmbienteID,
			&llave.Estado,
			&llave.Descripcion,
			&llave.Activo,
			&llave.CreatedAt,
			&llave.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		llaves = append(llaves, llave)
	}

	return llaves, nil
}

func (r *LlaveRepositoryImpl) Create(llave *entities.Llave) error {
	query := `INSERT INTO llaves (codigo, ambiente_id, estado, descripcion, activo)
	          VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at, updated_at`

	return r.db.QueryRow(
		query,
		llave.Codigo,
		llave.AmbienteID,
		llave.Estado,
		llave.Descripcion,
		llave.Activo,
	).Scan(&llave.ID, &llave.CreatedAt, &llave.UpdatedAt)
}

func (r *LlaveRepositoryImpl) Update(llave *entities.Llave) error {
	query := `UPDATE llaves SET codigo = $1, ambiente_id = $2, estado = $3,
	          descripcion = $4, activo = $5 WHERE id = $6 RETURNING updated_at`

	return r.db.QueryRow(
		query,
		llave.Codigo,
		llave.AmbienteID,
		llave.Estado,
		llave.Descripcion,
		llave.Activo,
		llave.ID,
	).Scan(&llave.UpdatedAt)
}

func (r *LlaveRepositoryImpl) UpdateEstado(id int, estado entities.EstadoLlave) error {
	query := `UPDATE llaves SET estado = $1 WHERE id = $2`
	_, err := r.db.Exec(query, estado, id)
	return err
}

func (r *LlaveRepositoryImpl) Delete(id int) error {
	query := `UPDATE llaves SET activo = FALSE WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}
