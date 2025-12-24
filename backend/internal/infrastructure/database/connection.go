package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

func NewConnection() (*sql.DB, error) {
	config, err := loadConfig()
	if err != nil {
		return nil, err
	}

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		config.Host, config.Port, config.User, config.Password, config.DBName, config.SSLMode,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("error abriendo conexión: %w", err)
	}

	// Configurar pool de conexiones
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("error conectando a la base de datos: %w", err)
	}

	log.Println("Conexión a PostgreSQL exitosa")
	return db, nil
}

func loadConfig() (*Config, error) {
	env := os.Getenv("GO_ENV")
	isProduction := env == "production"

	// En producción, las credenciales son obligatorias
	password := os.Getenv("DB_PASSWORD")
	if password == "" {
		if isProduction {
			return nil, fmt.Errorf("DB_PASSWORD es obligatorio en producción")
		}
		// Solo en desarrollo usar default
		password = "admin123"
		log.Println("ADVERTENCIA: Usando DB_PASSWORD por defecto. NO usar en producción.")
	}

	user := os.Getenv("DB_USER")
	if user == "" {
		if isProduction {
			return nil, fmt.Errorf("DB_USER es obligatorio en producción")
		}
		user = "admin"
	}

	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}

	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "sistema_ingreso"
	}

	// SSL mode: require en producción, disable en desarrollo
	sslMode := os.Getenv("DB_SSLMODE")
	if sslMode == "" {
		if isProduction {
			sslMode = "require"
		} else {
			sslMode = "disable"
		}
	}

	return &Config{
		Host:     host,
		Port:     port,
		User:     user,
		Password: password,
		DBName:   dbName,
		SSLMode:  sslMode,
	}, nil
}
