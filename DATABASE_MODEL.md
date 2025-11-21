# Modelo Físico de Base de Datos - Sistema de Ingreso Docente

## Resumen General

- **Motor:** PostgreSQL 15 Alpine
- **Charset:** UTF8
- **Timezone:** America/La_Paz
- **Total de Tablas:** 7
- **Total de Índices:** 30+

---

## Tablas del Sistema

### 1. **usuarios**
Almacena credenciales y roles del sistema.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identificador único |
| username | VARCHAR(100) | NOT NULL, UNIQUE | Nombre de usuario |
| password | VARCHAR(255) | NOT NULL | Hash bcrypt (costo 10) |
| rol | VARCHAR(50) | NOT NULL, CHECK | jefe_carrera, bibliotecario, docente |
| activo | BOOLEAN | NOT NULL, DEFAULT TRUE | Estado del usuario |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha de actualización |

**Índices:**
- `idx_usuarios_username` (username)
- `idx_usuarios_rol` (rol)

---

### 2. **docentes**
Perfil docente vinculado a usuario (relación 1:1).

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identificador único |
| usuario_id | INTEGER | NOT NULL, UNIQUE, FK → usuarios(id) ON DELETE CASCADE | Usuario asociado |
| documento_identidad | BIGINT | NOT NULL, UNIQUE, CHECK > 0 | Cédula de identidad |
| nombre_completo | VARCHAR(255) | NOT NULL | Nombre completo |
| correo | VARCHAR(255) | UNIQUE | Email institucional |
| telefono | BIGINT | CHECK > 0 | Teléfono de contacto |
| activo | BOOLEAN | NOT NULL, DEFAULT TRUE | Estado del docente |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha de actualización |

**Índices:**
- `idx_docentes_usuario_id` (usuario_id)
- `idx_docentes_documento_identidad` (documento_identidad)
- `idx_docentes_correo` (correo)

---

### 3. **turnos**
Define franjas horarias del día (mañana, tarde, noche).

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identificador único |
| nombre | VARCHAR(100) | NOT NULL, UNIQUE | Nombre del turno |
| hora_inicio | TIME | NOT NULL | Hora de inicio |
| hora_fin | TIME | NOT NULL, CHECK > hora_inicio | Hora de fin |
| descripcion | TEXT | - | Descripción adicional |
| activo | BOOLEAN | NOT NULL, DEFAULT TRUE | Estado del turno |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha de actualización |

**Índices:**
- `idx_turnos_nombre` (nombre)
- `idx_turnos_horario` (hora_inicio, hora_fin)

**Ejemplo:**
- Mañana: 06:45 - 12:45
- Tarde: 12:45 - 18:45

---

### 4. **ambientes_academicos**
Aulas, laboratorios, bibliotecas y otros espacios.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identificador único |
| codigo | VARCHAR(50) | NOT NULL, UNIQUE | Código del ambiente (B-16, L-01) |
| nombre | VARCHAR(255) | NOT NULL | Nombre descriptivo |
| descripcion | VARCHAR(255) | - | Descripción adicional |
| tipo_ambiente | VARCHAR(50) | - | Tipo: aula, laboratorio, biblioteca |
| capacidad | INTEGER | CHECK > 0 | Capacidad de personas |
| piso | INTEGER | - | Número de piso |
| edificio | VARCHAR(50) | - | Nombre del edificio |
| activo | BOOLEAN | NOT NULL, DEFAULT TRUE | Estado del ambiente |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha de actualización |

**Índices:**
- `idx_ambientes_codigo` (codigo)
- `idx_ambientes_tipo` (tipo_ambiente)
- `idx_ambientes_edificio_piso` (edificio, piso)

---

### 5. **llaves**
Control de llaves por ambiente académico.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identificador único |
| codigo | VARCHAR(50) | NOT NULL, UNIQUE | Código de la llave |
| ambiente_id | INTEGER | NOT NULL, FK → ambientes_academicos(id) ON DELETE CASCADE | Ambiente asociado |
| estado | VARCHAR(20) | NOT NULL, DEFAULT 'disponible', CHECK | disponible, en_uso, extraviada, inactiva |
| descripcion | TEXT | - | Descripción adicional |
| activo | BOOLEAN | NOT NULL, DEFAULT TRUE | Estado de la llave |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha de actualización |

**Índices:**
- `idx_llaves_codigo` (codigo)
- `idx_llaves_ambiente_id` (ambiente_id)
- `idx_llaves_estado` (estado)
- `idx_llaves_ambiente_estado` (ambiente_id, estado)

**Estados:**
- `disponible`: Lista para asignar
- `en_uso`: Actualmente asignada a docente
- `extraviada`: Reportada como perdida
- `inactiva`: Fuera de servicio

---

### 6. **asignaciones_docente**
Asignación de docente a turno, ambiente y llave.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identificador único |
| docente_id | INTEGER | NOT NULL, FK → docentes(id) ON DELETE CASCADE | Docente asignado |
| turno_id | INTEGER | NOT NULL, FK → turnos(id) ON DELETE CASCADE | Turno asignado |
| ambiente_id | INTEGER | NOT NULL, FK → ambientes_academicos(id) ON DELETE CASCADE | Ambiente asignado |
| llave_id | INTEGER | FK → llaves(id) ON DELETE SET NULL | Llave asignada (opcional) |
| fecha_inicio | DATE | NOT NULL | Fecha de inicio de vigencia |
| fecha_fin | DATE | CHECK >= fecha_inicio | Fecha de fin (NULL = indefinida) |
| activo | BOOLEAN | NOT NULL, DEFAULT TRUE | Estado de la asignación |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha de actualización |

**Constraints Únicos:**
- UNIQUE (docente_id, turno_id, ambiente_id, fecha_inicio)

**Índices:**
- `idx_asignaciones_docente_id` (docente_id)
- `idx_asignaciones_turno_id` (turno_id)
- `idx_asignaciones_ambiente_id` (ambiente_id)
- `idx_asignaciones_llave_id` (llave_id)
- `idx_asignaciones_fecha_inicio` (fecha_inicio)
- `idx_asignaciones_docente_fecha` (docente_id, fecha_inicio)

---

### 7. **registros**
Registro de ingresos y salidas diarias de docentes.

| Campo | Tipo | Constraints | Descripción |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identificador único |
| docente_id | INTEGER | NOT NULL, FK → docentes(id) ON DELETE CASCADE | Docente que registra |
| ambiente_id | INTEGER | NOT NULL, FK → ambientes_academicos(id) ON DELETE CASCADE | Ambiente donde registra |
| turno_id | INTEGER | NOT NULL, FK → turnos(id) ON DELETE CASCADE | Turno correspondiente |
| llave_id | INTEGER | FK → llaves(id) ON DELETE SET NULL | Llave utilizada |
| tipo | VARCHAR(10) | NOT NULL, CHECK | ingreso o salida |
| fecha_hora | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha y hora del registro |
| minutos_retraso | INTEGER | DEFAULT 0, CHECK >= 0 | Minutos de retraso (calculado) |
| minutos_extra | INTEGER | DEFAULT 0, CHECK >= 0 | Minutos extra (calculado) |
| observaciones | TEXT | - | Observaciones adicionales |
| editado_por | INTEGER | FK → usuarios(id) ON DELETE SET NULL | Usuario que editó |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha de actualización |

**Índices:**
- `idx_registros_docente_id` (docente_id)
- `idx_registros_ambiente_id` (ambiente_id)
- `idx_registros_turno_id` (turno_id)
- `idx_registros_tipo` (tipo)
- `idx_registros_fecha_hora` (fecha_hora)
- `idx_registros_docente_fecha` (docente_id, fecha_hora)

**Tipos de Registro:**
- `ingreso`: Entrada del docente al ambiente
- `salida`: Salida del docente del ambiente

---

## Relaciones entre Tablas

### Relaciones 1:1
- **usuarios → docentes**: Un usuario puede tener un perfil de docente

### Relaciones 1:N
- **usuarios → registros**: Un usuario puede editar múltiples registros (editado_por)
- **docentes → asignaciones_docente**: Un docente puede tener múltiples asignaciones
- **docentes → registros**: Un docente puede tener múltiples registros
- **turnos → asignaciones_docente**: Un turno puede tener múltiples asignaciones
- **turnos → registros**: Un turno puede tener múltiples registros
- **ambientes_academicos → llaves**: Un ambiente puede tener múltiples llaves
- **ambientes_academicos → asignaciones_docente**: Un ambiente puede tener múltiples asignaciones
- **ambientes_academicos → registros**: Un ambiente puede tener múltiples registros
- **llaves → asignaciones_docente**: Una llave puede estar asignada a múltiples docentes (en diferentes períodos)
- **llaves → registros**: Una llave puede ser usada en múltiples registros

---

## Políticas de Eliminación (ON DELETE)

### CASCADE (Eliminar en cascada)
- Al eliminar **usuario** → se elimina **docente** asociado
- Al eliminar **docente** → se eliminan **asignaciones** y **registros**
- Al eliminar **turno** → se eliminan **asignaciones** y **registros**
- Al eliminar **ambiente** → se eliminan **llaves**, **asignaciones** y **registros**

### SET NULL (Establecer en NULL)
- Al eliminar **llave** → en **asignaciones_docente** y **registros** se establece llave_id = NULL
- Al eliminar **usuario** (editado_por) → en **registros** se establece editado_por = NULL

---

## Índices y Optimización

### Índices Compuestos (Búsquedas frecuentes)
- `idx_turnos_horario` (hora_inicio, hora_fin) - Para validaciones de horarios
- `idx_ambientes_edificio_piso` (edificio, piso) - Para búsquedas por ubicación
- `idx_llaves_ambiente_estado` (ambiente_id, estado) - Para listar llaves disponibles por ambiente
- `idx_asignaciones_docente_fecha` (docente_id, fecha_inicio) - Para horarios de docente
- `idx_registros_docente_fecha` (docente_id, fecha_hora) - Para historial de registros

### Índices Simples (Búsquedas y Foreign Keys)
- Todos los campos UNIQUE tienen índice automático
- Todas las Foreign Keys tienen índice para mejorar JOINs
- Campos frecuentes en WHERE: estado, tipo, rol, fecha_hora

---

## Triggers y Funciones (Implementación futura)

### Trigger: updated_at_trigger
Actualiza automáticamente el campo `updated_at` en todas las tablas al modificar un registro.

### Función: calcular_minutos_retraso()
Calcula automáticamente `minutos_retraso` al insertar un registro de tipo 'ingreso'.

### Función: calcular_minutos_extra()
Calcula automáticamente `minutos_extra` al insertar un registro de tipo 'salida'.

---

## Notas Técnicas

1. **Tipo SERIAL**: En PostgreSQL, SERIAL es equivalente a INTEGER con secuencia auto-incremental.

2. **Timestamps con zona horaria**: Se usa `TIMESTAMP` sin zona horaria, asumiendo siempre America/La_Paz.

3. **Soft Delete**: El campo `activo` permite eliminación lógica en lugar de física.

4. **Auditoría**: Todos los registros tienen `created_at` y `updated_at` para trazabilidad.

5. **Constraint UNIQUE compuesto**: En `asignaciones_docente` evita duplicados de la misma asignación.

6. **Password Security**: Se almacena hash bcrypt con costo 10 (2^10 = 1024 iteraciones).

---

## Datos de Prueba

Ver archivo: [USUARIOS_PRUEBA.md](./USUARIOS_PRUEBA.md)

- 3 usuarios (admin, bibliotecario, docente1)
- 1 docente (Juan Pérez García)
- 4 turnos (Mañana, Tarde, Noche, Especial)
- 6 ambientes (B-16, L-01, L-02, P-06, 204, 205)
- 6 llaves (una por ambiente)
- 1 asignación de ejemplo

Password para todos: `password123`

---

## Diagrama PlantUML

El modelo visual completo está disponible en: [database_diagram.puml](./database_diagram.puml)

Para generar el diagrama:
```bash
plantuml database_diagram.puml
```

Esto generará `database_diagram.png` con el modelo físico completo.
