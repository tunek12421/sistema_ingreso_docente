# Guia de Instalacion

Instrucciones detalladas para instalar y configurar el Sistema de Ingreso Docente.

## Requisitos del Sistema

### Software Requerido

| Software | Version Minima | Proposito |
|----------|---------------|-----------|
| Go | 1.21+ | Backend |
| Node.js | 20+ | Frontend |
| npm | 10+ | Gestor de paquetes |
| Docker | 20+ | Base de datos (PostgreSQL) |
| Git | 2.0+ | Control de versiones |
| Air | latest | Hot reload backend |
| Angular CLI | 21+ | Desarrollo frontend |

### Requisitos para Reconocimiento Facial

Para habilitar el reconocimiento facial, necesitas:

- **dlib** - Biblioteca de machine learning
- **Modelos pre-entrenados de dlib**:
  - `dlib_face_recognition_resnet_model_v1.dat`
  - `mmod_human_face_detector.dat`
  - `shape_predictor_5_face_landmarks.dat`

#### Instalacion de dlib en Linux (Ubuntu/Debian)

```bash
# Dependencias del sistema
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    cmake \
    libdlib-dev \
    libblas-dev \
    liblapack-dev \
    libx11-dev

# Instalar dlib
sudo apt-get install -y libdlib-dev
```

#### Descargar modelos de dlib

```bash
cd backend/models

# Descargar modelos (si no estan incluidos)
wget http://dlib.net/files/dlib_face_recognition_resnet_model_v1.dat.bz2
wget http://dlib.net/files/mmod_human_face_detector.dat.bz2
wget http://dlib.net/files/shape_predictor_5_face_landmarks.dat.bz2

# Descomprimir
bunzip2 *.bz2
```

---

## Instalacion Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd sistema_ingreso_docente
```

### 2. Configurar Base de Datos (Docker)

En desarrollo, usamos PostgreSQL dockerizado para facilitar la configuracion.

#### Levantar PostgreSQL con Docker

```bash
# Crear y ejecutar contenedor de PostgreSQL
docker run -d \
  --name sistema_ingreso_db \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin123 \
  -e POSTGRES_DB=sistema_ingreso \
  -p 5432:5432 \
  -v sistema_ingreso_data:/var/lib/postgresql/data \
  postgres:15-alpine

# Verificar que esta corriendo
docker ps
```

#### Comandos utiles de Docker para la BD

```bash
# Iniciar contenedor (si ya existe)
docker start sistema_ingreso_db

# Detener contenedor
docker stop sistema_ingreso_db

# Ver logs
docker logs sistema_ingreso_db

# Conectar a psql dentro del contenedor
docker exec -it sistema_ingreso_db psql -U admin -d sistema_ingreso
```

#### Ejecutar migraciones

```bash
# Ejecutar script de esquema
PGPASSWORD=admin123 psql -h localhost -U admin -d sistema_ingreso -f database/migrations/001_schema.sql
```

#### Opcion alternativa: PostgreSQL instalado localmente

Si prefieres usar PostgreSQL instalado en el sistema:

```bash
# Conectar a PostgreSQL
sudo -u postgres psql

# Crear usuario (si no existe)
CREATE USER admin WITH PASSWORD 'admin123';

# Crear base de datos
CREATE DATABASE sistema_ingreso OWNER admin;

# Dar permisos
GRANT ALL PRIVILEGES ON DATABASE sistema_ingreso TO admin;

# Salir
\q

# Ejecutar migraciones
PGPASSWORD=admin123 psql -U admin -h localhost -d sistema_ingreso -f database/migrations/001_schema.sql
```

### 3. Configurar Backend

#### Crear archivo de variables de entorno

```bash
cd backend
cp .env.example .env
```

#### Editar `.env`

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=sistema_ingreso

# JWT - IMPORTANTE: Cambiar en produccion
JWT_SECRET=tu_clave_secreta_muy_segura_cambiar_en_produccion

# Puerto del servidor
PORT=8080

# Zona horaria
TZ=America/La_Paz
```

#### Instalar dependencias de Go

```bash
cd backend
go mod download
go mod tidy
```

#### Ejecutar con Air (Hot Reload) - Recomendado para desarrollo

```bash
# Instalar Air (una sola vez)
go install github.com/air-verse/air@latest

# Ejecutar con hot reload
air
```

El archivo `.air.toml` ya esta configurado en el proyecto. Cualquier cambio en archivos `.go` reiniciara automaticamente el servidor.

#### Alternativa: Ejecutar sin hot reload

```bash
# Opcion 1: Ejecutar directamente
go run ./cmd/api

# Opcion 2: Compilar primero
go build -o api ./cmd/api
./api
```

El servidor deberia mostrar:
```
Zona horaria configurada a UTC
Servidor iniciado en puerto 8080
```

### 4. Configurar Frontend

#### Instalar dependencias

```bash
cd frontend-angular
npm install
```

#### Instalar Angular CLI (si no lo tienes)

```bash
npm install -g @angular/cli
```

#### Configurar URL del API

Editar `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};
```

#### Ejecutar con ng serve (Hot Reload)

```bash
ng serve
# La aplicacion inicia en http://localhost:4200
```

Cualquier cambio en el codigo recargara automaticamente el navegador.

---

## Flujo de Desarrollo Tipico

Una vez instalado todo, el flujo diario de desarrollo es:

```bash
# Terminal 1: Base de datos
docker start sistema_ingreso_db

# Terminal 2: Backend (desde carpeta backend/)
air

# Terminal 3: Frontend (desde carpeta frontend-angular/)
ng serve
```

Acceder a `http://localhost:4200` para ver la aplicacion.

---

## Verificacion de la Instalacion

### 1. Verificar Backend

```bash
# Health check
curl http://localhost:8080/health

# Deberia responder:
# {"status":"ok"}
```

### 2. Verificar Login

```bash
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Deberia responder con un token JWT
```

### 3. Verificar Frontend

1. Abrir `http://localhost:4200` en el navegador
2. Iniciar sesion con `admin` / `admin123`
3. Deberia redirigir al dashboard de administrador

---

## Desarrollo con Hot Reload

### Backend (usando Air)

```bash
# Instalar Air
go install github.com/air-verse/air@latest

# Ejecutar con hot reload
cd backend
air
```

El archivo `.air.toml` ya esta configurado en el proyecto.

### Frontend

El comando `npm start` ya incluye hot reload automatico.

---

## Configuracion para Produccion

### Backend

1. Compilar binario optimizado:
```bash
CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o api ./cmd/api
```

2. Configurar variables de entorno de produccion:
```env
JWT_SECRET=<clave-muy-segura-y-larga>
DB_PASSWORD=<password-seguro>
```

3. Usar HTTPS con proxy reverso (nginx/caddy)

### Frontend

1. Configurar `environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-dominio.com/api'
};
```

2. Compilar para produccion:
```bash
npm run build
# o
ng build --configuration production
```

3. Los archivos estaran en `dist/frontend-angular/browser/`

4. Servir con nginx, Apache, o cualquier servidor web estatico

---

## Solucion de Problemas

### Error: "connection refused" al conectar a PostgreSQL

```bash
# Verificar que el contenedor Docker esta corriendo
docker ps

# Si no aparece, iniciarlo
docker start sistema_ingreso_db

# Si no existe el contenedor, crearlo (ver seccion 2)
```

### Error: "go-face" no compila

```bash
# Instalar dependencias de dlib
sudo apt-get install -y libdlib-dev libblas-dev liblapack-dev

# Verificar que los modelos existen
ls -la backend/models/
```

### Error: CORS en frontend

Verificar que el backend tiene CORS habilitado para el origen del frontend.

### Error: "token expired"

El token JWT expira en 24 horas. Volver a iniciar sesion.

### Puerto 8080 en uso

```bash
# Encontrar proceso usando el puerto
lsof -i :8080

# Cambiar puerto en .env
PORT=8081
```

---

## Estructura de Archivos de Configuracion

```
sistema_ingreso_docente/
├── backend/
│   ├── .env                    # Variables de entorno (crear)
│   ├── .env.example            # Plantilla de variables
│   └── .air.toml               # Config hot reload
├── frontend-angular/
│   ├── angular.json            # Config Angular CLI
│   ├── tailwind.config.js      # Config Tailwind CSS
│   └── src/environments/
│       ├── environment.ts      # Config desarrollo
│       └── environment.prod.ts # Config produccion
└── database/
    └── migrations/
        └── 001_schema.sql      # Esquema de BD
```

---

## Comandos Utiles

### Backend

```bash
# Ejecutar
go run ./cmd/api

# Compilar
go build -o api ./cmd/api

# Tests
go test ./...

# Limpiar cache
go clean -cache
```

### Frontend

```bash
# Desarrollo
npm start

# Build produccion
npm run build

# Tests
npm test

# Linting
npm run lint
```

### Base de Datos (Docker)

```bash
# Iniciar contenedor
docker start sistema_ingreso_db

# Detener contenedor
docker stop sistema_ingreso_db

# Conectar a la BD
docker exec -it sistema_ingreso_db psql -U admin -d sistema_ingreso

# Backup
docker exec sistema_ingreso_db pg_dump -U admin sistema_ingreso > backup.sql

# Restaurar
docker exec -i sistema_ingreso_db psql -U admin -d sistema_ingreso < backup.sql

# Ver logs del contenedor
docker logs -f sistema_ingreso_db
```
