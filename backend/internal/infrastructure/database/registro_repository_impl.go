package database

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
)

type RegistroRepositoryImpl struct {
	db *sql.DB
}

func NewRegistroRepository(db *sql.DB) *RegistroRepositoryImpl {
	return &RegistroRepositoryImpl{db: db}
}

func (r *RegistroRepositoryImpl) FindByID(id int) (*entities.Registro, error) {
	query := `SELECT id, docente_id, turno_id, llave_id, tipo, fecha_hora,
	          minutos_retraso, minutos_extra, es_excepcional, observaciones, editado_por, created_at, updated_at
	          FROM registros WHERE id = $1`

	registro := &entities.Registro{}
	err := r.db.QueryRow(query, id).Scan(
		&registro.ID,
		&registro.DocenteID,
		&registro.TurnoID,
		&registro.LlaveID,
		&registro.Tipo,
		&registro.FechaHora,
		&registro.MinutosRetraso,
		&registro.MinutosExtra,
		&registro.EsExcepcional,
		&registro.Observaciones,
		&registro.EditadoPor,
		&registro.CreatedAt,
		&registro.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("registro no encontrado")
	}
	if err != nil {
		return nil, err
	}

	return registro, nil
}

func (r *RegistroRepositoryImpl) FindAll() ([]*entities.Registro, error) {
	query := `SELECT id, docente_id, turno_id, llave_id, tipo, fecha_hora,
	          minutos_retraso, minutos_extra, es_excepcional, observaciones, editado_por, created_at, updated_at
	          FROM registros ORDER BY fecha_hora DESC LIMIT 100`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanRegistros(rows)
}

func (r *RegistroRepositoryImpl) FindByDocente(docenteID int) ([]*entities.Registro, error) {
	query := `SELECT id, docente_id, turno_id, llave_id, tipo, fecha_hora,
	          minutos_retraso, minutos_extra, es_excepcional, observaciones, editado_por, created_at, updated_at
	          FROM registros WHERE docente_id = $1 ORDER BY fecha_hora DESC`

	rows, err := r.db.Query(query, docenteID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanRegistros(rows)
}

func (r *RegistroRepositoryImpl) FindByFecha(fecha time.Time) ([]*entities.Registro, error) {
	inicio := time.Date(fecha.Year(), fecha.Month(), fecha.Day(), 0, 0, 0, 0, fecha.Location())
	fin := inicio.Add(24 * time.Hour)

	query := `SELECT id, docente_id, turno_id, llave_id, tipo, fecha_hora,
	          minutos_retraso, minutos_extra, es_excepcional, observaciones, editado_por, created_at, updated_at
	          FROM registros WHERE fecha_hora >= $1 AND fecha_hora < $2 ORDER BY fecha_hora DESC`

	rows, err := r.db.Query(query, inicio, fin)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanRegistros(rows)
}

func (r *RegistroRepositoryImpl) FindByDocenteYFecha(docenteID int, fecha time.Time) ([]*entities.Registro, error) {
	inicio := time.Date(fecha.Year(), fecha.Month(), fecha.Day(), 0, 0, 0, 0, fecha.Location())
	fin := inicio.Add(24 * time.Hour)

	query := `SELECT id, docente_id, turno_id, llave_id, tipo, fecha_hora,
	          minutos_retraso, minutos_extra, es_excepcional, observaciones, editado_por, created_at, updated_at
	          FROM registros WHERE docente_id = $1 AND fecha_hora >= $2 AND fecha_hora < $3 ORDER BY fecha_hora DESC`

	rows, err := r.db.Query(query, docenteID, inicio, fin)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanRegistros(rows)
}

func (r *RegistroRepositoryImpl) FindRegistrosHoy() ([]*entities.Registro, error) {
	ahora := time.Now()
	inicio := time.Date(ahora.Year(), ahora.Month(), ahora.Day(), 0, 0, 0, 0, ahora.Location())
	fin := inicio.Add(24 * time.Hour)

	query := `SELECT id, docente_id, turno_id, llave_id, tipo, fecha_hora,
	          minutos_retraso, minutos_extra, es_excepcional, observaciones, editado_por, created_at, updated_at
	          FROM registros WHERE fecha_hora >= $1 AND fecha_hora < $2 ORDER BY fecha_hora DESC`

	rows, err := r.db.Query(query, inicio, fin)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanRegistros(rows)
}

func (r *RegistroRepositoryImpl) FindUltimoIngresoConLlave(docenteID int) (*entities.Registro, error) {
	// Buscar el último ingreso con llave que NO tenga una salida posterior
	query := `
		SELECT ing.id, ing.docente_id, ing.turno_id, ing.llave_id,
		       ing.tipo, ing.fecha_hora, ing.minutos_retraso, ing.minutos_extra,
		       ing.es_excepcional, ing.observaciones, ing.editado_por, ing.created_at, ing.updated_at
		FROM registros ing
		WHERE ing.docente_id = $1
		  AND ing.tipo = 'ingreso'
		  AND ing.llave_id IS NOT NULL
		  AND DATE(ing.fecha_hora) = CURRENT_DATE
		  AND NOT EXISTS (
		      SELECT 1 FROM registros sal
		      WHERE sal.docente_id = ing.docente_id
		        AND sal.llave_id = ing.llave_id
		        AND sal.tipo = 'salida'
		        AND sal.fecha_hora > ing.fecha_hora
		        AND DATE(sal.fecha_hora) = CURRENT_DATE
		  )
		ORDER BY ing.fecha_hora DESC
		LIMIT 1`

	registro := &entities.Registro{}
	err := r.db.QueryRow(query, docenteID).Scan(
		&registro.ID,
		&registro.DocenteID,
		&registro.TurnoID,
		&registro.LlaveID,
		&registro.Tipo,
		&registro.FechaHora,
		&registro.MinutosRetraso,
		&registro.MinutosExtra,
		&registro.EsExcepcional,
		&registro.Observaciones,
		&registro.EditadoPor,
		&registro.CreatedAt,
		&registro.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("no se encontró ingreso con llave sin salida para hoy")
	}
	if err != nil {
		return nil, err
	}

	return registro, nil
}

func (r *RegistroRepositoryImpl) Create(registro *entities.Registro) error {
	query := `INSERT INTO registros (docente_id, turno_id, llave_id, tipo, fecha_hora,
	          minutos_retraso, minutos_extra, es_excepcional, observaciones, editado_por)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, created_at, updated_at`

	return r.db.QueryRow(
		query,
		registro.DocenteID,
		registro.TurnoID,
		registro.LlaveID,
		registro.Tipo,
		registro.FechaHora,
		registro.MinutosRetraso,
		registro.MinutosExtra,
		registro.EsExcepcional,
		registro.Observaciones,
		registro.EditadoPor,
	).Scan(&registro.ID, &registro.CreatedAt, &registro.UpdatedAt)
}

func (r *RegistroRepositoryImpl) Update(registro *entities.Registro) error {
	query := `UPDATE registros SET docente_id = $1, turno_id = $2,
	          llave_id = $3, tipo = $4, fecha_hora = $5, minutos_retraso = $6, minutos_extra = $7,
	          es_excepcional = $8, observaciones = $9, editado_por = $10 WHERE id = $11 RETURNING updated_at`

	return r.db.QueryRow(
		query,
		registro.DocenteID,
		registro.TurnoID,
		registro.LlaveID,
		registro.Tipo,
		registro.FechaHora,
		registro.MinutosRetraso,
		registro.MinutosExtra,
		registro.EsExcepcional,
		registro.Observaciones,
		registro.EditadoPor,
		registro.ID,
	).Scan(&registro.UpdatedAt)
}

func (r *RegistroRepositoryImpl) Delete(id int) error {
	query := `DELETE FROM registros WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

// DocenteTieneLlave verifica si un docente tiene una llave específica (ingreso sin salida correspondiente)
func (r *RegistroRepositoryImpl) DocenteTieneLlave(docenteID int, llaveID int) (bool, error) {
	query := `
		SELECT EXISTS (
			SELECT 1 FROM registros ing
			WHERE ing.docente_id = $1
			  AND ing.llave_id = $2
			  AND ing.tipo = 'ingreso'
			  AND DATE(ing.fecha_hora) = CURRENT_DATE
			  AND NOT EXISTS (
				  SELECT 1 FROM registros sal
				  WHERE sal.docente_id = ing.docente_id
					AND sal.llave_id = ing.llave_id
					AND sal.tipo = 'salida'
					AND sal.fecha_hora > ing.fecha_hora
					AND DATE(sal.fecha_hora) = CURRENT_DATE
			  )
		)`

	var existe bool
	err := r.db.QueryRow(query, docenteID, llaveID).Scan(&existe)
	if err != nil {
		return false, err
	}
	return existe, nil
}

func (r *RegistroRepositoryImpl) scanRegistros(rows *sql.Rows) ([]*entities.Registro, error) {
	registros := []*entities.Registro{}
	for rows.Next() {
		registro := &entities.Registro{}
		err := rows.Scan(
			&registro.ID,
			&registro.DocenteID,
			&registro.TurnoID,
			&registro.LlaveID,
			&registro.Tipo,
			&registro.FechaHora,
			&registro.MinutosRetraso,
			&registro.MinutosExtra,
			&registro.EsExcepcional,
			&registro.Observaciones,
			&registro.EditadoPor,
			&registro.CreatedAt,
			&registro.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		registros = append(registros, registro)
	}
	return registros, nil
}
