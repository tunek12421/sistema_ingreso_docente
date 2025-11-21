package database

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
)

type AsignacionRepositoryImpl struct {
	db *sql.DB
}

func NewAsignacionRepository(db *sql.DB) *AsignacionRepositoryImpl {
	return &AsignacionRepositoryImpl{db: db}
}

func (r *AsignacionRepositoryImpl) FindByID(id int) (*entities.Asignacion, error) {
	query := `SELECT id, docente_id, turno_id, ambiente_id, llave_id,
	          fecha_inicio, fecha_fin, activo, created_at, updated_at
	          FROM asignaciones_docente WHERE id = $1`

	asignacion := &entities.Asignacion{}
	err := r.db.QueryRow(query, id).Scan(
		&asignacion.ID,
		&asignacion.DocenteID,
		&asignacion.TurnoID,
		&asignacion.AmbienteID,
		&asignacion.LlaveID,
		&asignacion.FechaInicio,
		&asignacion.FechaFin,
		&asignacion.Activo,
		&asignacion.CreatedAt,
		&asignacion.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("asignacion no encontrada")
	}
	if err != nil {
		return nil, err
	}

	return asignacion, nil
}

func (r *AsignacionRepositoryImpl) FindAll() ([]*entities.Asignacion, error) {
	query := `SELECT id, docente_id, turno_id, ambiente_id, llave_id,
	          fecha_inicio, fecha_fin, activo, created_at, updated_at
	          FROM asignaciones_docente WHERE activo = TRUE
	          ORDER BY fecha_inicio DESC, created_at DESC`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	asignaciones := []*entities.Asignacion{}
	for rows.Next() {
		asignacion := &entities.Asignacion{}
		err := rows.Scan(
			&asignacion.ID,
			&asignacion.DocenteID,
			&asignacion.TurnoID,
			&asignacion.AmbienteID,
			&asignacion.LlaveID,
			&asignacion.FechaInicio,
			&asignacion.FechaFin,
			&asignacion.Activo,
			&asignacion.CreatedAt,
			&asignacion.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		asignaciones = append(asignaciones, asignacion)
	}

	return asignaciones, nil
}

func (r *AsignacionRepositoryImpl) FindByDocente(docenteID int) ([]*entities.Asignacion, error) {
	query := `SELECT id, docente_id, turno_id, ambiente_id, llave_id,
	          fecha_inicio, fecha_fin, activo, created_at, updated_at
	          FROM asignaciones_docente
	          WHERE docente_id = $1 AND activo = TRUE
	          ORDER BY fecha_inicio DESC`

	rows, err := r.db.Query(query, docenteID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	asignaciones := []*entities.Asignacion{}
	for rows.Next() {
		asignacion := &entities.Asignacion{}
		err := rows.Scan(
			&asignacion.ID,
			&asignacion.DocenteID,
			&asignacion.TurnoID,
			&asignacion.AmbienteID,
			&asignacion.LlaveID,
			&asignacion.FechaInicio,
			&asignacion.FechaFin,
			&asignacion.Activo,
			&asignacion.CreatedAt,
			&asignacion.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		asignaciones = append(asignaciones, asignacion)
	}

	return asignaciones, nil
}

func (r *AsignacionRepositoryImpl) FindByDocenteYFecha(docenteID int, fecha time.Time) ([]*entities.Asignacion, error) {
	query := `SELECT id, docente_id, turno_id, ambiente_id, llave_id,
	          fecha_inicio, fecha_fin, activo, created_at, updated_at
	          FROM asignaciones_docente
	          WHERE docente_id = $1
	          AND DATE(fecha_inicio) <= DATE($2)
	          AND (fecha_fin IS NULL OR DATE(fecha_fin) >= DATE($2))
	          AND activo = TRUE
	          ORDER BY fecha_inicio DESC`

	rows, err := r.db.Query(query, docenteID, fecha)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	asignaciones := []*entities.Asignacion{}
	for rows.Next() {
		asignacion := &entities.Asignacion{}
		err := rows.Scan(
			&asignacion.ID,
			&asignacion.DocenteID,
			&asignacion.TurnoID,
			&asignacion.AmbienteID,
			&asignacion.LlaveID,
			&asignacion.FechaInicio,
			&asignacion.FechaFin,
			&asignacion.Activo,
			&asignacion.CreatedAt,
			&asignacion.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		asignaciones = append(asignaciones, asignacion)
	}

	return asignaciones, nil
}

func (r *AsignacionRepositoryImpl) Create(asignacion *entities.Asignacion) error {
	query := `INSERT INTO asignaciones_docente
	          (docente_id, turno_id, ambiente_id, llave_id, fecha_inicio, fecha_fin, activo)
	          VALUES ($1, $2, $3, $4, $5, $6, $7)
	          RETURNING id, created_at, updated_at`

	return r.db.QueryRow(
		query,
		asignacion.DocenteID,
		asignacion.TurnoID,
		asignacion.AmbienteID,
		asignacion.LlaveID,
		asignacion.FechaInicio,
		asignacion.FechaFin,
		asignacion.Activo,
	).Scan(&asignacion.ID, &asignacion.CreatedAt, &asignacion.UpdatedAt)
}

func (r *AsignacionRepositoryImpl) Update(asignacion *entities.Asignacion) error {
	query := `UPDATE asignaciones_docente
	          SET docente_id = $1, turno_id = $2, ambiente_id = $3, llave_id = $4,
	          fecha_inicio = $5, fecha_fin = $6, activo = $7
	          WHERE id = $8 RETURNING updated_at`

	return r.db.QueryRow(
		query,
		asignacion.DocenteID,
		asignacion.TurnoID,
		asignacion.AmbienteID,
		asignacion.LlaveID,
		asignacion.FechaInicio,
		asignacion.FechaFin,
		asignacion.Activo,
		asignacion.ID,
	).Scan(&asignacion.UpdatedAt)
}

func (r *AsignacionRepositoryImpl) Delete(id int) error {
	query := `UPDATE asignaciones_docente SET activo = FALSE WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}
