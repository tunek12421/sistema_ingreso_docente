package database

import (
	"database/sql"
	"fmt"

	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
)

type DocenteRepositoryImpl struct {
	db *sql.DB
}

func NewDocenteRepository(db *sql.DB) *DocenteRepositoryImpl {
	return &DocenteRepositoryImpl{db: db}
}

func (r *DocenteRepositoryImpl) FindByID(id int) (*entities.Docente, error) {
	query := `SELECT id, usuario_id, documento_identidad, nombre_completo, correo, telefono, activo, created_at, updated_at
	          FROM docentes WHERE id = $1`

	docente := &entities.Docente{}
	err := r.db.QueryRow(query, id).Scan(
		&docente.ID,
		&docente.UsuarioID,
		&docente.DocumentoIdentidad,
		&docente.NombreCompleto,
		&docente.Correo,
		&docente.Telefono,
		&docente.Activo,
		&docente.CreatedAt,
		&docente.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("docente no encontrado")
	}
	if err != nil {
		return nil, err
	}

	return docente, nil
}

func (r *DocenteRepositoryImpl) FindByCI(ci int64) (*entities.Docente, error) {
	query := `SELECT id, usuario_id, documento_identidad, nombre_completo, correo, telefono, activo, created_at, updated_at
	          FROM docentes WHERE documento_identidad = $1`

	docente := &entities.Docente{}
	err := r.db.QueryRow(query, ci).Scan(
		&docente.ID,
		&docente.UsuarioID,
		&docente.DocumentoIdentidad,
		&docente.NombreCompleto,
		&docente.Correo,
		&docente.Telefono,
		&docente.Activo,
		&docente.CreatedAt,
		&docente.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("docente no encontrado")
	}
	if err != nil {
		return nil, err
	}

	return docente, nil
}

func (r *DocenteRepositoryImpl) FindAll() ([]*entities.Docente, error) {
	query := `SELECT id, usuario_id, documento_identidad, nombre_completo, correo, telefono, activo, created_at, updated_at
	          FROM docentes WHERE activo = TRUE ORDER BY nombre_completo`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	docentes := []*entities.Docente{}
	for rows.Next() {
		docente := &entities.Docente{}
		err := rows.Scan(
			&docente.ID,
			&docente.UsuarioID,
			&docente.DocumentoIdentidad,
			&docente.NombreCompleto,
			&docente.Correo,
			&docente.Telefono,
			&docente.Activo,
			&docente.CreatedAt,
			&docente.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		docentes = append(docentes, docente)
	}

	return docentes, nil
}

func (r *DocenteRepositoryImpl) Create(docente *entities.Docente) error {
	query := `INSERT INTO docentes (usuario_id, documento_identidad, nombre_completo, correo, telefono, activo)
	          VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at, updated_at`

	return r.db.QueryRow(
		query,
		docente.UsuarioID,
		docente.DocumentoIdentidad,
		docente.NombreCompleto,
		docente.Correo,
		docente.Telefono,
		docente.Activo,
	).Scan(&docente.ID, &docente.CreatedAt, &docente.UpdatedAt)
}

func (r *DocenteRepositoryImpl) Update(docente *entities.Docente) error {
	query := `UPDATE docentes SET usuario_id = $1, documento_identidad = $2, nombre_completo = $3,
	          correo = $4, telefono = $5, activo = $6 WHERE id = $7 RETURNING updated_at`

	return r.db.QueryRow(
		query,
		docente.UsuarioID,
		docente.DocumentoIdentidad,
		docente.NombreCompleto,
		docente.Correo,
		docente.Telefono,
		docente.Activo,
		docente.ID,
	).Scan(&docente.UpdatedAt)
}

func (r *DocenteRepositoryImpl) Delete(id int) error {
	query := `UPDATE docentes SET activo = FALSE WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}
