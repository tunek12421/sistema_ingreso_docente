# Sistema de Ingreso Docente

Sistema de gestión de acceso y control de llaves para docentes en instituciones educativas, con soporte para reconocimiento facial.

## Descripcion

Este sistema permite:
- Registro de ingreso y salida de docentes
- Control de prestamo de llaves de aulas
- Reconocimiento facial para identificacion de docentes
- Gestion de turnos de trabajo
- Reportes y estadisticas de asistencia

## Tecnologias

### Backend
- **Go 1.21** - Lenguaje principal
- **PostgreSQL** - Base de datos
- **Gorilla Mux** - Router HTTP
- **JWT** - Autenticacion
- **dlib (go-face)** - Reconocimiento facial

### Frontend
- **Angular 21** - Framework
- **TypeScript** - Lenguaje
- **Tailwind CSS 3** - Estilos
- **RxJS** - Programacion reactiva

## Estructura del Proyecto

```
sistema_ingreso_docente/
├── backend/                 # API REST en Go
│   ├── cmd/api/            # Punto de entrada
│   ├── internal/
│   │   ├── application/    # DTOs
│   │   ├── domain/         # Entidades, repositorios, casos de uso
│   │   └── infrastructure/ # Implementaciones (DB, HTTP, JWT)
│   └── models/             # Modelos dlib para reconocimiento facial
├── frontend-angular/        # Aplicacion Angular
│   └── src/app/
│       ├── core/           # Servicios, guards, interceptors
│       ├── shared/         # Componentes y modelos compartidos
│       └── features/       # Modulos por rol (admin, bibliotecario, etc.)
├── database/               # Migraciones SQL
└── docs/                   # Documentacion adicional
```

## Inicio Rapido (Desarrollo)

### Prerequisitos

- Go 1.21+
- Node.js 20+
- Docker (para PostgreSQL)
- Air (hot reload para Go)
- Angular CLI
- Modelos dlib (para reconocimiento facial)

### 1. Base de Datos (Docker)

```bash
# Levantar PostgreSQL con Docker
docker run -d \
  --name sistema_ingreso_db \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin123 \
  -e POSTGRES_DB=sistema_ingreso \
  -p 5432:5432 \
  -v sistema_ingreso_data:/var/lib/postgresql/data \
  postgres:15-alpine

# Ejecutar migraciones
PGPASSWORD=admin123 psql -h localhost -U admin -d sistema_ingreso -f database/migrations/001_schema.sql
```

### 2. Backend (con Air - Hot Reload)

```bash
cd backend

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Instalar Air (si no lo tienes)
go install github.com/air-verse/air@latest

# Ejecutar con hot reload
air
# El servidor inicia en http://localhost:8080
```

### 3. Frontend (con ng serve)

```bash
cd frontend-angular

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo con hot reload
ng serve
# La aplicacion inicia en http://localhost:4200
```

### Resumen de Servicios en Desarrollo

| Servicio | Comando | Puerto | Hot Reload |
|----------|---------|--------|------------|
| PostgreSQL | `docker start sistema_ingreso_db` | 5432 | - |
| Backend | `air` | 8080 | Si |
| Frontend | `ng serve` | 4200 | Si |

## Usuarios de Prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Administrador |
| jefe | admin123 | Jefe de Carrera |
| bibliotecario | admin123 | Bibliotecario |
| docente1 | admin123 | Docente |

## Roles y Permisos

| Recurso | Admin | Jefe Carrera | Bibliotecario | Docente |
|---------|:-----:|:------------:|:-------------:|:-------:|
| Usuarios | CRUD | - | - | - |
| Docentes | CRUD | CRU | R | - |
| Turnos | CRUD | - | R | - |
| Llaves | CRUD | - | R | - |
| Registros | R | RU | RW | R* |
| Reconocimiento | CRUD | - | R | - |

*Solo registros propios

## Documentacion

- [Guia de Instalacion](docs/INSTALACION.md) - Instrucciones detalladas de instalacion
- [Documentacion de API](docs/API.md) - Endpoints y ejemplos
- [Arquitectura](docs/ARQUITECTURA.md) - Diseño del sistema
- [Base de Datos](docs/DATABASE.md) - Esquema y relaciones

## Funcionalidades Principales

### Registro de Ingreso/Salida
El bibliotecario puede registrar cuando un docente ingresa o sale, asociando una llave de aula.

### Reconocimiento Facial
Sistema de identificacion biometrica usando dlib para detectar e identificar docentes por su rostro.

### Gestion de Llaves
Control del estado de las llaves (disponible, en uso, extraviada, inactiva) y quien las tiene actualmente.

### Reportes
Consultas de registros por fecha, docente, y generacion de estadisticas.

## Variables de Entorno

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=sistema_ingreso

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura

# Servidor
PORT=8080

# Zona horaria
TZ=America/La_Paz
```

## Licencia

Este proyecto es parte del curso de Desarrollo de Software - Universidad.

## Contacto

Para preguntas o soporte, contactar al equipo de desarrollo.
