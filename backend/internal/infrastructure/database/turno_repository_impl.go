package database

import (
	"database/sql"
	"fmt"

	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
)

type TurnoRepositoryImpl struct {
	db *sql.DB
}

func NewTurnoRepository(db *sql.DB) *TurnoRepositoryImpl {
	return &TurnoRepositoryImpl{db: db}
}

func (r *TurnoRepositoryImpl) FindByID(id int) (*entities.Turno, error) {
	query := `SELECT id, nombre, hora_inicio, hora_fin, descripcion, activo, created_at, updated_at
	          FROM turnos WHERE id = $1`

	turno := &entities.Turno{}
	err := r.db.QueryRow(query, id).Scan(
		&turno.ID,
		&turno.Nombre,
		&turno.HoraInicio,
		&turno.HoraFin,
		&turno.Descripcion,
		&turno.Activo,
		&turno.CreatedAt,
		&turno.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("turno no encontrado")
	}
	if err != nil {
		return nil, err
	}

	return turno, nil
}

func (r *TurnoRepositoryImpl) FindAll() ([]*entities.Turno, error) {
	query := `SELECT id, nombre, hora_inicio, hora_fin, descripcion, activo, created_at, updated_at
	          FROM turnos WHERE activo = TRUE ORDER BY hora_inicio`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	turnos := []*entities.Turno{}
	for rows.Next() {
		turno := &entities.Turno{}
		err := rows.Scan(
			&turno.ID,
			&turno.Nombre,
			&turno.HoraInicio,
			&turno.HoraFin,
			&turno.Descripcion,
			&turno.Activo,
			&turno.CreatedAt,
			&turno.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		turnos = append(turnos, turno)
	}

	return turnos, nil
}

func (r *TurnoRepositoryImpl) Create(turno *entities.Turno) error {
	query := `INSERT INTO turnos (nombre, hora_inicio, hora_fin, descripcion, activo)
	          VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at, updated_at`

	return r.db.QueryRow(
		query,
		turno.Nombre,
		turno.HoraInicio,
		turno.HoraFin,
		turno.Descripcion,
		turno.Activo,
	).Scan(&turno.ID, &turno.CreatedAt, &turno.UpdatedAt)
}

func (r *TurnoRepositoryImpl) Update(turno *entities.Turno) error {
	query := `UPDATE turnos SET nombre = $1, hora_inicio = $2, hora_fin = $3,
	          descripcion = $4, activo = $5 WHERE id = $6 RETURNING updated_at`

	return r.db.QueryRow(
		query,
		turno.Nombre,
		turno.HoraInicio,
		turno.HoraFin,
		turno.Descripcion,
		turno.Activo,
		turno.ID,
	).Scan(&turno.UpdatedAt)
}

func (r *TurnoRepositoryImpl) Delete(id int) error {
	query := `UPDATE turnos SET activo = FALSE WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}
