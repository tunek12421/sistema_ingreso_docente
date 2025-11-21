package database

import (
	"database/sql"
	"fmt"

	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
)

type AmbienteRepositoryImpl struct {
	db *sql.DB
}

func NewAmbienteRepository(db *sql.DB) *AmbienteRepositoryImpl {
	return &AmbienteRepositoryImpl{db: db}
}

func (r *AmbienteRepositoryImpl) FindByID(id int) (*entities.Ambiente, error) {
	query := `SELECT id, codigo, descripcion, tipo_ambiente, capacidad, piso, edificio, activo, created_at, updated_at
	          FROM ambientes_academicos WHERE id = $1`

	ambiente := &entities.Ambiente{}
	err := r.db.QueryRow(query, id).Scan(
		&ambiente.ID,
		&ambiente.Codigo,
		&ambiente.Descripcion,
		&ambiente.TipoAmbiente,
		&ambiente.Capacidad,
		&ambiente.Piso,
		&ambiente.Edificio,
		&ambiente.Activo,
		&ambiente.CreatedAt,
		&ambiente.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("ambiente no encontrado")
	}
	if err != nil {
		return nil, err
	}

	return ambiente, nil
}

func (r *AmbienteRepositoryImpl) FindByCodigo(codigo string) (*entities.Ambiente, error) {
	query := `SELECT id, codigo, descripcion, tipo_ambiente, capacidad, piso, edificio, activo, created_at, updated_at
	          FROM ambientes_academicos WHERE codigo = $1`

	ambiente := &entities.Ambiente{}
	err := r.db.QueryRow(query, codigo).Scan(
		&ambiente.ID,
		&ambiente.Codigo,
		&ambiente.Descripcion,
		&ambiente.TipoAmbiente,
		&ambiente.Capacidad,
		&ambiente.Piso,
		&ambiente.Edificio,
		&ambiente.Activo,
		&ambiente.CreatedAt,
		&ambiente.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("ambiente no encontrado")
	}
	if err != nil {
		return nil, err
	}

	return ambiente, nil
}

func (r *AmbienteRepositoryImpl) FindAll() ([]*entities.Ambiente, error) {
	query := `SELECT id, codigo, descripcion, tipo_ambiente, capacidad, piso, edificio, activo, created_at, updated_at
	          FROM ambientes_academicos WHERE activo = TRUE ORDER BY codigo`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ambientes := []*entities.Ambiente{}
	for rows.Next() {
		ambiente := &entities.Ambiente{}
		err := rows.Scan(
			&ambiente.ID,
			&ambiente.Codigo,
			&ambiente.Descripcion,
			&ambiente.TipoAmbiente,
			&ambiente.Capacidad,
			&ambiente.Piso,
			&ambiente.Edificio,
			&ambiente.Activo,
			&ambiente.CreatedAt,
			&ambiente.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		ambientes = append(ambientes, ambiente)
	}

	return ambientes, nil
}

func (r *AmbienteRepositoryImpl) Create(ambiente *entities.Ambiente) error {
	query := `INSERT INTO ambientes_academicos (codigo, descripcion, tipo_ambiente, capacidad, piso, edificio, activo)
	          VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at, updated_at`

	return r.db.QueryRow(
		query,
		ambiente.Codigo,
		ambiente.Descripcion,
		ambiente.TipoAmbiente,
		ambiente.Capacidad,
		ambiente.Piso,
		ambiente.Edificio,
		ambiente.Activo,
	).Scan(&ambiente.ID, &ambiente.CreatedAt, &ambiente.UpdatedAt)
}

func (r *AmbienteRepositoryImpl) Update(ambiente *entities.Ambiente) error {
	query := `UPDATE ambientes_academicos SET codigo = $1, descripcion = $2, tipo_ambiente = $3,
	          capacidad = $4, piso = $5, edificio = $6, activo = $7 WHERE id = $8 RETURNING updated_at`

	return r.db.QueryRow(
		query,
		ambiente.Codigo,
		ambiente.Descripcion,
		ambiente.TipoAmbiente,
		ambiente.Capacidad,
		ambiente.Piso,
		ambiente.Edificio,
		ambiente.Activo,
		ambiente.ID,
	).Scan(&ambiente.UpdatedAt)
}

func (r *AmbienteRepositoryImpl) Delete(id int) error {
	query := `UPDATE ambientes_academicos SET activo = FALSE WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}
