package database

import (
	"database/sql"
	"fmt"

	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
)

type UsuarioRepositoryImpl struct {
	db *sql.DB
}

func NewUsuarioRepository(db *sql.DB) *UsuarioRepositoryImpl {
	return &UsuarioRepositoryImpl{db: db}
}

func (r *UsuarioRepositoryImpl) FindByUsername(username string) (*entities.Usuario, error) {
	query := `SELECT id, username, password, rol, nombre_completo, email, activo, created_at, updated_at
	          FROM usuarios WHERE username = $1 AND activo = TRUE`

	usuario := &entities.Usuario{}
	err := r.db.QueryRow(query, username).Scan(
		&usuario.ID,
		&usuario.Username,
		&usuario.Password,
		&usuario.Rol,
		&usuario.NombreCompleto,
		&usuario.Email,
		&usuario.Activo,
		&usuario.CreatedAt,
		&usuario.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("usuario no encontrado")
	}
	if err != nil {
		return nil, err
	}

	return usuario, nil
}

func (r *UsuarioRepositoryImpl) FindByID(id int) (*entities.Usuario, error) {
	query := `SELECT id, username, password, rol, nombre_completo, email, activo, created_at, updated_at
	          FROM usuarios WHERE id = $1`

	usuario := &entities.Usuario{}
	err := r.db.QueryRow(query, id).Scan(
		&usuario.ID,
		&usuario.Username,
		&usuario.Password,
		&usuario.Rol,
		&usuario.NombreCompleto,
		&usuario.Email,
		&usuario.Activo,
		&usuario.CreatedAt,
		&usuario.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("usuario no encontrado")
	}
	if err != nil {
		return nil, err
	}

	return usuario, nil
}

func (r *UsuarioRepositoryImpl) Create(usuario *entities.Usuario) error {
	query := `INSERT INTO usuarios (username, password, rol, nombre_completo, email, activo)
	          VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at, updated_at`

	return r.db.QueryRow(
		query,
		usuario.Username,
		usuario.Password,
		usuario.Rol,
		usuario.NombreCompleto,
		usuario.Email,
		usuario.Activo,
	).Scan(&usuario.ID, &usuario.CreatedAt, &usuario.UpdatedAt)
}

func (r *UsuarioRepositoryImpl) Update(usuario *entities.Usuario) error {
	query := `UPDATE usuarios SET username = $1, password = $2, rol = $3, nombre_completo = $4, email = $5, activo = $6
	          WHERE id = $7 RETURNING updated_at`

	return r.db.QueryRow(
		query,
		usuario.Username,
		usuario.Password,
		usuario.Rol,
		usuario.NombreCompleto,
		usuario.Email,
		usuario.Activo,
		usuario.ID,
	).Scan(&usuario.UpdatedAt)
}

func (r *UsuarioRepositoryImpl) Delete(id int) error {
	query := `DELETE FROM usuarios WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *UsuarioRepositoryImpl) FindAll() ([]*entities.Usuario, error) {
	query := `SELECT id, username, password, rol, nombre_completo, email, activo, created_at, updated_at
	          FROM usuarios ORDER BY id`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	usuarios := []*entities.Usuario{}
	for rows.Next() {
		usuario := &entities.Usuario{}
		err := rows.Scan(
			&usuario.ID,
			&usuario.Username,
			&usuario.Password,
			&usuario.Rol,
			&usuario.NombreCompleto,
			&usuario.Email,
			&usuario.Activo,
			&usuario.CreatedAt,
			&usuario.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		usuarios = append(usuarios, usuario)
	}

	return usuarios, nil
}
