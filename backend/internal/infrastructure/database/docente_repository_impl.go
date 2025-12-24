package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
)

// escapeLikePattern escapa caracteres especiales de LIKE/ILIKE para prevenir inyección
func escapeLikePattern(pattern string) string {
	// Escapar caracteres especiales de LIKE: %, _, \
	pattern = strings.ReplaceAll(pattern, "\\", "\\\\")
	pattern = strings.ReplaceAll(pattern, "%", "\\%")
	pattern = strings.ReplaceAll(pattern, "_", "\\_")
	return pattern
}

type DocenteRepositoryImpl struct {
	db *sql.DB
}

func NewDocenteRepository(db *sql.DB) *DocenteRepositoryImpl {
	return &DocenteRepositoryImpl{db: db}
}

func (r *DocenteRepositoryImpl) FindByID(id int) (*entities.Docente, error) {
	query := `SELECT id, usuario_id, documento_identidad, nombre_completo, correo, telefono, activo, face_descriptors, created_at, updated_at
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
		&docente.FaceDescriptors,
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
	query := `SELECT id, usuario_id, documento_identidad, nombre_completo, correo, telefono, activo, face_descriptors, created_at, updated_at
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
		&docente.FaceDescriptors,
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

func (r *DocenteRepositoryImpl) SearchByCI(ciPartial string) ([]*entities.Docente, error) {
	query := `SELECT id, usuario_id, documento_identidad, nombre_completo, correo, telefono, activo, face_descriptors, created_at, updated_at
	          FROM docentes
	          WHERE CAST(documento_identidad AS TEXT) LIKE $1 AND activo = TRUE
	          ORDER BY documento_identidad
	          LIMIT 10`

	// Escapar caracteres especiales de LIKE para prevenir inyección
	safePattern := escapeLikePattern(ciPartial) + "%"
	rows, err := r.db.Query(query, safePattern)
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
			&docente.FaceDescriptors,
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

func (r *DocenteRepositoryImpl) FindAll() ([]*entities.Docente, error) {
	query := `SELECT id, usuario_id, documento_identidad, nombre_completo, correo, telefono, activo, face_descriptors, created_at, updated_at
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
			&docente.FaceDescriptors,
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

func (r *DocenteRepositoryImpl) AddFaceDescriptor(id int, descriptorJSON string) error {
	query := `UPDATE docentes
	          SET face_descriptors = COALESCE(face_descriptors, '[]'::jsonb) || $1::jsonb,
	              updated_at = CURRENT_TIMESTAMP
	          WHERE id = $2`
	_, err := r.db.Exec(query, descriptorJSON, id)
	return err
}

func (r *DocenteRepositoryImpl) GetFaceDescriptors(id int) ([]string, error) {
	query := `SELECT COALESCE(face_descriptors::text, '[]') FROM docentes WHERE id = $1`

	var descriptorsJSON string
	err := r.db.QueryRow(query, id).Scan(&descriptorsJSON)
	if err == sql.ErrNoRows {
		return []string{}, nil
	}
	if err != nil {
		return nil, err
	}

	// Si es un array vacío o nulo, retornar array vacío
	if descriptorsJSON == "" || descriptorsJSON == "[]" || descriptorsJSON == "null" {
		return []string{}, nil
	}

	// Los descriptores están guardados como un array de objetos JSON
	// Necesitamos retornar cada objeto completo como string
	var rawDescriptors []json.RawMessage
	err = json.Unmarshal([]byte(descriptorsJSON), &rawDescriptors)
	if err != nil {
		return []string{}, nil
	}

	// Convertir cada RawMessage a string
	descriptors := make([]string, len(rawDescriptors))
	for i, raw := range rawDescriptors {
		descriptors[i] = string(raw)
	}

	return descriptors, nil
}

func (r *DocenteRepositoryImpl) RemoveFaceDescriptor(id int, index int) error {
	// Usar jsonb_set con NULL para eliminar un elemento específico del array
	query := `UPDATE docentes
	          SET face_descriptors = (
	              SELECT jsonb_agg(value)
	              FROM jsonb_array_elements(COALESCE(face_descriptors, '[]'::jsonb)) WITH ORDINALITY arr(value, idx)
	              WHERE idx != $2 + 1
	          ),
	          updated_at = CURRENT_TIMESTAMP
	          WHERE id = $1`
	_, err := r.db.Exec(query, id, index)
	return err
}

func (r *DocenteRepositoryImpl) ClearFaceDescriptors(id int) error {
	query := `UPDATE docentes
	          SET face_descriptors = '[]'::jsonb,
	              updated_at = CURRENT_TIMESTAMP
	          WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}
