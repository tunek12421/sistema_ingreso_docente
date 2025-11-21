# Sistema de Ingreso Docente

Sistema de registro de ingreso y recojo de llaves para docentes, construido con arquitectura de microservicios, arquitectura hexagonal y clean architecture.

## Tecnologías

- **Backend**: Go 1.21 (Arquitectura Hexagonal + Clean Architecture)
- **Frontend**: React 18
- **Base de Datos**: PostgreSQL 15
- **Proxy**: Nginx
- **Contenedores**: Docker & Docker Compose

## Estructura del Proyecto

```
sistema_ingreso_docente/
├── backend/                 # Backend en Go
│   ├── cmd/api/            # Punto de entrada
│   ├── internal/
│   │   ├── domain/         # Capa de dominio
│   │   │   ├── entities/   # Entidades
│   │   │   ├── repositories/ # Interfaces de repositorios
│   │   │   └── usecases/   # Casos de uso
│   │   ├── infrastructure/ # Infraestructura
│   │   │   ├── database/   # Implementaciones PostgreSQL
│   │   │   ├── http/       # Handlers, middleware, rutas
│   │   │   └── jwt/        # Autenticación JWT
│   │   └── application/    # DTOs
│   └── Dockerfile
├── frontend/               # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── context/       # Context API (Auth)
│   │   └── services/      # API services
│   └── Dockerfile
├── database/
│   └── migrations/        # Scripts SQL
├── nginx/                 # Configuración Nginx
└── docker-compose.yml
```

## Roles del Sistema

1. **Jefe de Carrera**: Gestiona docentes, turnos, aulas y llaves
2. **Bibliotecario**: Registra ingresos y salidas de docentes
3. **Docente**: Usuario básico del sistema

## Inicio Rápido

### Prerrequisitos

- Docker
- Docker Compose

### Instalación

1. Clonar el repositorio:
```bash
cd sistema_ingreso_docente
```

2. Levantar los servicios:
```bash
docker-compose up -d
```

3. El sistema estará disponible en:
- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **PostgreSQL**: localhost:5432

### Credenciales por Defecto

**Jefe de Carrera:**
- Usuario: `admin`
- Contraseña: `admin123`

## API Endpoints

### Autenticación
- `POST /login` - Iniciar sesión

### Docentes (requiere rol: jefe_carrera)
- `GET /docentes` - Listar todos
- `POST /docentes` - Crear docente
- `GET /docentes/{id}` - Obtener por ID
- `GET /docentes/ci/{ci}` - Obtener por CI
- `PUT /docentes/{id}` - Actualizar
- `DELETE /docentes/{id}` - Eliminar (soft delete)

### Registros (requiere rol: bibliotecario o jefe_carrera)
- `POST /registros/ingreso` - Registrar ingreso
- `POST /registros/salida` - Registrar salida
- `GET /registros?fecha=2024-01-01` - Obtener registros por fecha

## Desarrollo

### Backend (Go)

```bash
cd backend
go mod download
go run cmd/api/main.go
```

### Frontend (React)

```bash
cd frontend
npm install
npm start
```

### Base de Datos

Para conectarse directamente a PostgreSQL:
```bash
docker exec -it sistema_ingreso_db psql -U admin -d sistema_ingreso
```

## Deployment en Producción

### 1. Configurar Variables de Entorno

Editar `docker-compose.yml` y cambiar:
- `JWT_SECRET` (backend)
- Credenciales de PostgreSQL
- `REACT_APP_API_URL` (frontend)

### 2. En el VPS

```bash
# Copiar archivos al servidor
scp -r . user@tu-servidor:/ruta/destino

# SSH al servidor
ssh user@tu-servidor

# Levantar servicios
cd /ruta/destino
docker-compose up -d
```

### 3. Nginx del VPS

Configurar proxy reverso en el Nginx del VPS:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Características Técnicas

### Backend
- **Arquitectura Hexagonal**: Separación clara entre dominio, aplicación e infraestructura
- **Clean Architecture**: Independencia de frameworks y bases de datos
- **JWT**: Autenticación segura con tokens
- **CORS**: Configurado para desarrollo y producción
- **Validaciones**: En capa de casos de uso

### Frontend
- **Context API**: Manejo de estado de autenticación
- **Protected Routes**: Rutas protegidas por autenticación
- **Axios Interceptors**: Manejo automático de tokens y errores
- **Responsive Design**: Interfaz adaptable

### Base de Datos
- **Normalización 3NF**: Base de datos normalizada
- **Triggers**: Actualización automática de timestamps
- **Índices**: Optimización de consultas
- **Constraints**: Integridad referencial

## Próximas Características

- [ ] Gestión completa de turnos (CRUD)
- [ ] Gestión de aulas/ambientes
- [ ] Gestión de llaves
- [ ] Asignaciones docente-turno-aula-llave
- [ ] Reportes y estadísticas
- [ ] Notificaciones de retrasos
- [ ] Exportación de datos (PDF, Excel)

## Licencia

MIT
# sistema_ingreso_docente
