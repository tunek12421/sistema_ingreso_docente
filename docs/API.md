# Documentacion de API

API REST del Sistema de Ingreso Docente.

**Base URL**: `http://localhost:8080`

## Autenticacion

La API usa JWT (JSON Web Tokens) para autenticacion. Incluir el token en el header:

```
Authorization: Bearer <token>
```

---

## Endpoints Publicos

### POST /login

Iniciar sesion y obtener token JWT.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "rol": "administrador",
    "nombre_completo": "Administrador del Sistema"
  }
}
```

**Errores:**
- `401` - Credenciales invalidas
- `400` - Datos faltantes

### GET /health

Verificar estado del servidor.

**Response (200):**
```json
{
  "status": "ok"
}
```

---

## Usuarios

> Requiere rol: `administrador`

### GET /usuarios

Listar todos los usuarios.

**Response (200):**
```json
[
  {
    "id": 1,
    "username": "admin",
    "rol": "administrador",
    "nombre_completo": "Administrador del Sistema",
    "email": "admin@sistema.com",
    "activo": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

### GET /usuarios/{id}

Obtener usuario por ID.

**Response (200):**
```json
{
  "id": 1,
  "username": "admin",
  "rol": "administrador",
  "nombre_completo": "Administrador del Sistema",
  "email": "admin@sistema.com",
  "activo": true
}
```

### POST /usuarios

Crear nuevo usuario.

**Request:**
```json
{
  "username": "nuevo_usuario",
  "password": "password123",
  "rol": "bibliotecario",
  "nombre_completo": "Juan Perez",
  "email": "juan@sistema.com"
}
```

**Response (201):**
```json
{
  "id": 5,
  "username": "nuevo_usuario",
  "rol": "bibliotecario",
  "nombre_completo": "Juan Perez",
  "email": "juan@sistema.com",
  "activo": true
}
```

**Roles validos:** `administrador`, `jefe_carrera`, `bibliotecario`, `docente`

### PUT /usuarios/{id}

Actualizar usuario existente.

**Request:**
```json
{
  "nombre_completo": "Juan Perez Garcia",
  "email": "juan.perez@sistema.com",
  "rol": "jefe_carrera"
}
```

### DELETE /usuarios/{id}

Eliminar usuario.

**Response (204):** Sin contenido

### PATCH /usuarios/{id}/password

Cambiar contraseña.

**Request:**
```json
{
  "new_password": "nuevaPassword123"
}
```

### PATCH /usuarios/{id}/toggle

Activar/desactivar usuario.

**Response (200):**
```json
{
  "id": 5,
  "activo": false
}
```

---

## Docentes

> Requiere rol: `administrador`, `jefe_carrera`, `bibliotecario` (solo lectura)

### GET /docentes

Listar todos los docentes.

**Response (200):**
```json
[
  {
    "id": 1,
    "documento_identidad": "12345678",
    "nombre_completo": "Maria Garcia Lopez",
    "correo": "maria@universidad.edu",
    "telefono": "70012345",
    "activo": true,
    "usuario_id": 4,
    "tiene_rostro_registrado": true
  }
]
```

### GET /docentes/search?ci={ci}

Buscar docente por CI (parcial).

**Ejemplo:** `GET /docentes/search?ci=1234`

### GET /docentes/{id}

Obtener docente por ID.

### GET /docentes/ci/{ci}

Obtener docente por numero de CI exacto.

**Ejemplo:** `GET /docentes/ci/12345678`

### POST /docentes

Crear nuevo docente.

> Requiere rol: `administrador`, `jefe_carrera`

**Request:**
```json
{
  "documento_identidad": "87654321",
  "nombre_completo": "Pedro Sanchez",
  "correo": "pedro@universidad.edu",
  "telefono": "70098765",
  "usuario_id": null
}
```

### PUT /docentes/{id}

Actualizar docente.

> Requiere rol: `administrador`, `jefe_carrera`

### DELETE /docentes/{id}

Eliminar docente.

> Requiere rol: `administrador`, `jefe_carrera`

---

## Turnos

> Requiere rol: `administrador` (CRUD), `bibliotecario` (solo lectura)

### GET /turnos

Listar todos los turnos.

**Response (200):**
```json
[
  {
    "id": 1,
    "nombre": "Mañana",
    "hora_inicio": "07:15:00",
    "hora_fin": "10:15:00",
    "descripcion": "Turno de la mañana",
    "activo": true
  },
  {
    "id": 2,
    "nombre": "Mediodia",
    "hora_inicio": "10:30:00",
    "hora_fin": "13:30:00",
    "descripcion": "Turno del mediodia",
    "activo": true
  }
]
```

### GET /turnos/actual

Obtener turno actual segun la hora.

**Response (200):**
```json
{
  "id": 1,
  "nombre": "Mañana",
  "hora_inicio": "07:15:00",
  "hora_fin": "10:15:00"
}
```

**Response (404):** Si no hay turno activo actualmente.

### GET /turnos/{id}

Obtener turno por ID.

### POST /turnos

Crear nuevo turno.

> Requiere rol: `administrador`

**Request:**
```json
{
  "nombre": "Especial",
  "hora_inicio": "14:00",
  "hora_fin": "17:00",
  "descripcion": "Turno especial"
}
```

### PUT /turnos/{id}

Actualizar turno.

> Requiere rol: `administrador`

### DELETE /turnos/{id}

Eliminar turno.

> Requiere rol: `administrador`

---

## Llaves

> Requiere rol: `administrador` (CRUD), `bibliotecario` (solo lectura)

### GET /llaves

Listar todas las llaves.

**Query params opcionales:**
- `estado`: Filtrar por estado
- `disponible`: `true` para solo disponibles

**Response (200):**
```json
[
  {
    "id": 1,
    "codigo": "L-B16",
    "aula_codigo": "B16",
    "aula_nombre": "Laboratorio de Informatica",
    "estado": "disponible",
    "descripcion": "Llave principal",
    "docente_actual": null
  },
  {
    "id": 2,
    "codigo": "L-L01",
    "aula_codigo": "L01",
    "aula_nombre": "Aula L01",
    "estado": "en_uso",
    "docente_actual": {
      "id": 1,
      "nombre_completo": "Maria Garcia"
    }
  }
]
```

### GET /llaves/search

Buscar llaves.

**Query params:**
- `codigo`: Buscar por codigo
- `aula`: Buscar por aula
- `estado`: Filtrar por estado

**Ejemplo:** `GET /llaves/search?aula=B16&estado=disponible`

### GET /llaves/{id}

Obtener llave por ID.

### GET /llaves/codigo/{codigo}

Obtener llave por codigo.

**Ejemplo:** `GET /llaves/codigo/L-B16`

### GET /llaves/aula/{aula_codigo}

Obtener llave por codigo de aula.

### POST /llaves

Crear nueva llave.

> Requiere rol: `administrador`

**Request:**
```json
{
  "codigo": "L-301",
  "aula_codigo": "301",
  "aula_nombre": "Aula 301",
  "descripcion": "Tercer piso"
}
```

### PUT /llaves/{id}

Actualizar llave.

> Requiere rol: `administrador`

### DELETE /llaves/{id}

Eliminar llave.

> Requiere rol: `administrador`

### PATCH /llaves/{id}/estado

Cambiar estado de llave.

> Requiere rol: `administrador`

**Request:**
```json
{
  "estado": "extraviada"
}
```

**Estados validos:** `disponible`, `en_uso`, `extraviada`, `inactiva`

---

## Registros

### POST /registros/ingreso

Registrar ingreso de docente.

> Requiere rol: `bibliotecario`

**Request:**
```json
{
  "docente_id": 1,
  "turno_id": 1,
  "llave_id": 1,
  "observaciones": "Opcional"
}
```

**Response (201):**
```json
{
  "id": 10,
  "docente": {
    "id": 1,
    "nombre_completo": "Maria Garcia"
  },
  "turno": {
    "id": 1,
    "nombre": "Mañana"
  },
  "llave": {
    "id": 1,
    "codigo": "L-B16"
  },
  "tipo": "ingreso",
  "fecha_hora": "2025-12-16T08:30:00Z",
  "minutos_retraso": 15
}
```

### POST /registros/salida

Registrar salida de docente.

> Requiere rol: `bibliotecario`

**Request:**
```json
{
  "llave_id": 1,
  "observaciones": "Opcional"
}
```

**Response (201):**
```json
{
  "id": 11,
  "docente": {
    "id": 1,
    "nombre_completo": "Maria Garcia"
  },
  "tipo": "salida",
  "fecha_hora": "2025-12-16T10:00:00Z",
  "minutos_extra": 0
}
```

### GET /registros/hoy

Obtener registros del dia actual.

> Requiere rol: `administrador`, `jefe_carrera`, `bibliotecario`

**Response (200):**
```json
[
  {
    "id": 10,
    "docente": {
      "id": 1,
      "nombre_completo": "Maria Garcia",
      "documento_identidad": "12345678"
    },
    "turno": {
      "id": 1,
      "nombre": "Mañana"
    },
    "llave": {
      "id": 1,
      "codigo": "L-B16",
      "aula_nombre": "Laboratorio"
    },
    "tipo": "ingreso",
    "fecha_hora": "2025-12-16T08:30:00Z",
    "minutos_retraso": 15,
    "observaciones": null
  }
]
```

### GET /registros/llave-actual

Obtener quien tiene cada llave actualmente.

> Requiere rol: `administrador`, `jefe_carrera`, `bibliotecario`

**Query params opcionales:**
- `docente_id`: Filtrar por docente
- `llave_id`: Filtrar por llave

**Response (200):**
```json
[
  {
    "llave": {
      "id": 1,
      "codigo": "L-B16",
      "aula_nombre": "Laboratorio"
    },
    "docente": {
      "id": 1,
      "nombre_completo": "Maria Garcia"
    },
    "registro_ingreso": {
      "id": 10,
      "fecha_hora": "2025-12-16T08:30:00Z"
    }
  }
]
```

### GET /registros

Obtener registros con filtros.

> Requiere rol: `administrador`, `jefe_carrera`, `bibliotecario`

**Query params:**
- `fecha`: Fecha especifica (YYYY-MM-DD)
- `fecha_inicio`: Rango inicio
- `fecha_fin`: Rango fin
- `docente_id`: Filtrar por docente

**Ejemplo:** `GET /registros?fecha=2025-12-16`

### PUT /registros/{id}

Editar registro.

> Requiere rol: `jefe_carrera`

**Request:**
```json
{
  "fecha_hora": "2025-12-16T08:15:00Z",
  "observaciones": "Hora corregida",
  "minutos_retraso": 0
}
```

---

## Reconocimiento Facial

### POST /reconocimiento/detectar

Detectar rostros en una imagen.

> Requiere rol: `administrador`, `bibliotecario`

**Request:**
```json
{
  "imagen": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Response (200):**
```json
{
  "rostros_detectados": 1,
  "rostros": [
    {
      "bounds": {
        "x": 100,
        "y": 50,
        "width": 200,
        "height": 200
      },
      "descriptor": [0.123, -0.456, ...]
    }
  ]
}
```

### POST /reconocimiento/identificar

Identificar docente por imagen facial.

> Requiere rol: `administrador`, `bibliotecario`

**Request:**
```json
{
  "imagen": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Response (200) - Identificado:**
```json
{
  "identificado": true,
  "docente": {
    "id": 1,
    "nombre_completo": "Maria Garcia",
    "documento_identidad": "12345678"
  },
  "confianza": 0.92
}
```

**Response (200) - No identificado:**
```json
{
  "identificado": false,
  "mensaje": "No se encontro coincidencia"
}
```

### POST /docentes/{id}/rostro

Registrar rostro de docente.

> Requiere rol: `administrador`

**Request:**
```json
{
  "imagen": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Response (200):**
```json
{
  "mensaje": "Rostro registrado exitosamente",
  "total_descriptores": 3
}
```

### GET /docentes/{id}/rostro

Obtener informacion de rostros registrados.

> Requiere rol: `administrador`

**Response (200):**
```json
{
  "docente_id": 1,
  "total_descriptores": 3,
  "tiene_rostro": true
}
```

### DELETE /docentes/{id}/rostro/{index}

Eliminar un descriptor facial especifico.

> Requiere rol: `administrador`

### DELETE /docentes/{id}/rostro

Eliminar todos los descriptores faciales.

> Requiere rol: `administrador`

---

## Codigos de Error

| Codigo | Descripcion |
|--------|-------------|
| 400 | Bad Request - Datos invalidos o faltantes |
| 401 | Unauthorized - Token invalido o expirado |
| 403 | Forbidden - Sin permisos para esta accion |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: CI duplicado) |
| 500 | Internal Server Error - Error del servidor |

## Formato de Errores

```json
{
  "error": "Descripcion del error",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Notas

- Todas las fechas estan en formato ISO 8601 (UTC)
- El token JWT expira en 24 horas
- Los descriptores faciales son arrays de 128 valores float64
- La tolerancia de reconocimiento facial es 0.25 (menor = mas estricto)
