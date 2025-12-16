# Documentacion de Base de Datos

Esquema y estructura de la base de datos PostgreSQL del Sistema de Ingreso Docente.

## Diagrama Entidad-Relacion

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  USUARIOS   │       │  DOCENTES   │       │   TURNOS    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ username    │       │ usuario_id  │──────▶│ nombre      │
│ password    │◀──────│ documento   │       │ hora_inicio │
│ rol         │       │ nombre      │       │ hora_fin    │
│ nombre      │       │ correo      │       │ descripcion │
│ email       │       │ telefono    │       │ activo      │
│ activo      │       │ activo      │       └─────────────┘
└─────────────┘       │ face_desc   │
       │              └──────┬──────┘
       │                     │
       │              ┌──────┴──────┐
       │              │             │
       │              ▼             │
       │       ┌─────────────┐      │
       │       │  REGISTROS  │      │
       │       ├─────────────┤      │
       │       │ id (PK)     │      │
       │       │ docente_id  │◀─────┘
       │       │ turno_id    │──────────────┐
       │       │ llave_id    │──────┐       │
       │       │ tipo        │      │       │
       │       │ fecha_hora  │      │       │
       │       │ min_retraso │      │       │
       │       │ min_extra   │      │       │
       │       │ excepcional │      │       │
       │       │ observacion │      │       │
       └──────▶│ editado_por │      │       │
               └─────────────┘      │       │
                                    │       │
               ┌─────────────┐      │       │
               │   LLAVES    │◀─────┘       │
               ├─────────────┤              │
               │ id (PK)     │              │
               │ codigo      │              │
               │ aula_codigo │              │
               │ aula_nombre │              │
               │ estado      │              │
               │ descripcion │              │
               │ id_docente  │──────────────┘
               │ id_uso      │
               └─────────────┘
```

---

## Tablas

### usuarios

Almacena los usuarios del sistema con sus credenciales y roles.

```sql
CREATE TABLE usuarios (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50) UNIQUE NOT NULL,
    password        VARCHAR(255) NOT NULL,
    rol             VARCHAR(20) NOT NULL CHECK (rol IN (
                        'administrador',
                        'jefe_carrera',
                        'bibliotecario',
                        'docente'
                    )),
    nombre_completo VARCHAR(100) NOT NULL,
    email           VARCHAR(100) UNIQUE,
    activo          BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | SERIAL | Identificador unico |
| username | VARCHAR(50) | Nombre de usuario (unico) |
| password | VARCHAR(255) | Hash bcrypt de la contraseña |
| rol | VARCHAR(20) | Rol del usuario |
| nombre_completo | VARCHAR(100) | Nombre completo |
| email | VARCHAR(100) | Correo electronico (unico) |
| activo | BOOLEAN | Estado activo/inactivo |
| created_at | TIMESTAMP | Fecha de creacion |
| updated_at | TIMESTAMP | Fecha de actualizacion |

**Roles validos:**
- `administrador` - Acceso total
- `jefe_carrera` - Gestion de docentes y registros
- `bibliotecario` - Registro de ingreso/salida
- `docente` - Solo consulta de registros propios

---

### docentes

Almacena informacion de los docentes incluyendo descriptores faciales.

```sql
CREATE TABLE docentes (
    id                   SERIAL PRIMARY KEY,
    usuario_id           INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    documento_identidad  VARCHAR(20) UNIQUE NOT NULL,
    nombre_completo      VARCHAR(100) NOT NULL,
    correo               VARCHAR(100) UNIQUE,
    telefono             VARCHAR(20),
    activo               BOOLEAN DEFAULT true,
    face_descriptors     JSONB DEFAULT '[]'::jsonb,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | SERIAL | Identificador unico |
| usuario_id | INTEGER | FK a usuarios (opcional) |
| documento_identidad | VARCHAR(20) | Carnet de identidad (unico) |
| nombre_completo | VARCHAR(100) | Nombre completo |
| correo | VARCHAR(100) | Correo electronico |
| telefono | VARCHAR(20) | Numero de telefono |
| activo | BOOLEAN | Estado activo/inactivo |
| face_descriptors | JSONB | Array de descriptores faciales |
| created_at | TIMESTAMP | Fecha de creacion |
| updated_at | TIMESTAMP | Fecha de actualizacion |

**Nota sobre face_descriptors:**
Es un array JSONB que contiene arrays de 128 valores float64. Cada array representa un descriptor facial unico del docente.

```json
[
  [0.123, -0.456, 0.789, ...],  // Descriptor 1
  [0.111, -0.222, 0.333, ...]   // Descriptor 2
]
```

---

### turnos

Define los turnos de trabajo con sus horarios.

```sql
CREATE TABLE turnos (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(50) UNIQUE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin    TIME NOT NULL,
    descripcion TEXT,
    activo      BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | SERIAL | Identificador unico |
| nombre | VARCHAR(50) | Nombre del turno (unico) |
| hora_inicio | TIME | Hora de inicio del turno |
| hora_fin | TIME | Hora de fin del turno |
| descripcion | TEXT | Descripcion opcional |
| activo | BOOLEAN | Estado activo/inactivo |
| created_at | TIMESTAMP | Fecha de creacion |
| updated_at | TIMESTAMP | Fecha de actualizacion |

**Turnos por defecto:**

| Nombre | Hora Inicio | Hora Fin |
|--------|-------------|----------|
| Mañana | 07:15 | 10:15 |
| Mediodia | 10:30 | 13:30 |
| Tarde | 15:00 | 18:00 |
| Noche | 19:00 | 22:00 |

---

### llaves

Almacena las llaves de aulas y su estado actual.

```sql
CREATE TABLE llaves (
    id          SERIAL PRIMARY KEY,
    codigo      VARCHAR(20) UNIQUE NOT NULL,
    aula_codigo VARCHAR(20) NOT NULL,
    aula_nombre VARCHAR(100),
    estado      VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN (
                    'disponible',
                    'en_uso',
                    'extraviada',
                    'inactiva'
                )),
    descripcion TEXT,
    id_docente  INTEGER REFERENCES docentes(id) ON DELETE SET NULL,
    id_uso      INTEGER,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | SERIAL | Identificador unico |
| codigo | VARCHAR(20) | Codigo de la llave (unico) |
| aula_codigo | VARCHAR(20) | Codigo del aula |
| aula_nombre | VARCHAR(100) | Nombre descriptivo del aula |
| estado | VARCHAR(20) | Estado actual de la llave |
| descripcion | TEXT | Descripcion opcional |
| id_docente | INTEGER | FK al docente que tiene la llave |
| id_uso | INTEGER | ID del registro de uso actual |
| created_at | TIMESTAMP | Fecha de creacion |
| updated_at | TIMESTAMP | Fecha de actualizacion |

**Estados de llave:**

| Estado | Descripcion |
|--------|-------------|
| disponible | Llave disponible para prestamo |
| en_uso | Llave actualmente prestada a un docente |
| extraviada | Llave reportada como perdida |
| inactiva | Llave fuera de servicio |

---

### registros

Registra los ingresos y salidas de docentes.

```sql
CREATE TABLE registros (
    id              SERIAL PRIMARY KEY,
    docente_id      INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    turno_id        INTEGER NOT NULL REFERENCES turnos(id) ON DELETE RESTRICT,
    llave_id        INTEGER REFERENCES llaves(id) ON DELETE SET NULL,
    tipo            VARCHAR(10) NOT NULL CHECK (tipo IN ('ingreso', 'salida')),
    fecha_hora      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    minutos_retraso INTEGER DEFAULT 0,
    minutos_extra   INTEGER DEFAULT 0,
    es_excepcional  BOOLEAN DEFAULT false,
    observaciones   TEXT,
    editado_por     INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | SERIAL | Identificador unico |
| docente_id | INTEGER | FK al docente (obligatorio) |
| turno_id | INTEGER | FK al turno (obligatorio) |
| llave_id | INTEGER | FK a la llave (opcional) |
| tipo | VARCHAR(10) | Tipo: 'ingreso' o 'salida' |
| fecha_hora | TIMESTAMP | Fecha y hora del registro (UTC) |
| minutos_retraso | INTEGER | Minutos de retraso (ingreso) |
| minutos_extra | INTEGER | Minutos extra (salida) |
| es_excepcional | BOOLEAN | Registro fuera del turno normal |
| observaciones | TEXT | Observaciones opcionales |
| editado_por | INTEGER | FK al usuario que edito |
| created_at | TIMESTAMP | Fecha de creacion |
| updated_at | TIMESTAMP | Fecha de actualizacion |

---

## Indices

```sql
-- Busqueda de docentes por CI
CREATE INDEX idx_docentes_documento ON docentes(documento_identidad);

-- Busqueda de registros por fecha
CREATE INDEX idx_registros_fecha ON registros(fecha_hora);

-- Busqueda de registros por docente
CREATE INDEX idx_registros_docente ON registros(docente_id);

-- Busqueda de llaves por codigo
CREATE INDEX idx_llaves_codigo ON llaves(codigo);

-- Busqueda de llaves por estado
CREATE INDEX idx_llaves_estado ON llaves(estado);
```

---

## Vistas

### v_registros_completos

Vista que une registros con informacion de docente, turno y llave.

```sql
CREATE OR REPLACE VIEW v_registros_completos AS
SELECT
    r.id,
    r.tipo,
    r.fecha_hora,
    r.minutos_retraso,
    r.minutos_extra,
    r.es_excepcional,
    r.observaciones,
    r.created_at,
    r.updated_at,
    d.id as docente_id,
    d.documento_identidad,
    d.nombre_completo as docente_nombre,
    t.id as turno_id,
    t.nombre as turno_nombre,
    t.hora_inicio as turno_hora_inicio,
    t.hora_fin as turno_hora_fin,
    l.id as llave_id,
    l.codigo as llave_codigo,
    l.aula_codigo,
    l.aula_nombre,
    u.id as editado_por_id,
    u.nombre_completo as editado_por_nombre
FROM registros r
JOIN docentes d ON r.docente_id = d.id
JOIN turnos t ON r.turno_id = t.id
LEFT JOIN llaves l ON r.llave_id = l.id
LEFT JOIN usuarios u ON r.editado_por = u.id
ORDER BY r.fecha_hora DESC;
```

---

## Triggers

### Actualizacion automatica de updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar a todas las tablas
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_docentes_updated_at
    BEFORE UPDATE ON docentes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_turnos_updated_at
    BEFORE UPDATE ON turnos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_llaves_updated_at
    BEFORE UPDATE ON llaves
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registros_updated_at
    BEFORE UPDATE ON registros
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Datos Iniciales

### Usuarios de prueba

```sql
INSERT INTO usuarios (username, password, rol, nombre_completo, email) VALUES
('admin', '$2a$10$...', 'administrador', 'Administrador del Sistema', 'admin@sistema.com'),
('jefe', '$2a$10$...', 'jefe_carrera', 'Jefe de Carrera', 'jefe@sistema.com'),
('bibliotecario', '$2a$10$...', 'bibliotecario', 'Bibliotecario', 'biblio@sistema.com'),
('docente1', '$2a$10$...', 'docente', 'Docente Uno', 'docente1@sistema.com');
```

### Turnos por defecto

```sql
INSERT INTO turnos (nombre, hora_inicio, hora_fin, descripcion) VALUES
('Mañana', '07:15:00', '10:15:00', 'Turno de la mañana'),
('Mediodia', '10:30:00', '13:30:00', 'Turno del mediodia'),
('Tarde', '15:00:00', '18:00:00', 'Turno de la tarde'),
('Noche', '19:00:00', '22:00:00', 'Turno de la noche');
```

### Llaves de ejemplo

```sql
INSERT INTO llaves (codigo, aula_codigo, aula_nombre, descripcion) VALUES
('L-B16', 'B16', 'Laboratorio de Informatica', 'Llave principal'),
('L-L01', 'L01', 'Aula L01', 'Primer piso'),
('L-L02', 'L02', 'Aula L02', 'Primer piso'),
('L-P06', 'P06', 'Aula P06', 'Planta baja'),
('L-204', '204', 'Aula 204', 'Segundo piso'),
('L-205', '205', 'Aula 205', 'Segundo piso');
```

---

## Consultas Comunes

### Obtener registros del dia actual

```sql
SELECT * FROM v_registros_completos
WHERE DATE(fecha_hora) = CURRENT_DATE
ORDER BY fecha_hora DESC;
```

### Obtener llaves en uso

```sql
SELECT l.*, d.nombre_completo as docente_nombre
FROM llaves l
LEFT JOIN docentes d ON l.id_docente = d.id
WHERE l.estado = 'en_uso';
```

### Obtener turno actual

```sql
SELECT * FROM turnos
WHERE activo = true
  AND hora_inicio <= CURRENT_TIME
  AND hora_fin >= CURRENT_TIME;
```

### Buscar docente por CI

```sql
SELECT * FROM docentes
WHERE documento_identidad LIKE '%12345%'
  AND activo = true;
```

### Registros de un docente en rango de fechas

```sql
SELECT * FROM v_registros_completos
WHERE docente_id = 1
  AND fecha_hora BETWEEN '2025-12-01' AND '2025-12-31'
ORDER BY fecha_hora DESC;
```

---

## Backup y Restauracion

### Backup

```bash
# Backup completo
pg_dump -U admin -h localhost sistema_ingreso > backup_$(date +%Y%m%d).sql

# Backup solo estructura
pg_dump -U admin -h localhost --schema-only sistema_ingreso > schema.sql

# Backup solo datos
pg_dump -U admin -h localhost --data-only sistema_ingreso > data.sql
```

### Restauracion

```bash
# Restaurar backup completo
psql -U admin -h localhost -d sistema_ingreso < backup.sql

# Crear BD desde cero y restaurar
createdb -U admin sistema_ingreso
psql -U admin -d sistema_ingreso < backup.sql
```

---

## Consideraciones

1. **Zona Horaria**: Todas las fechas se almacenan en UTC
2. **Passwords**: Hasheados con bcrypt (costo 10)
3. **Soft Delete**: Se usa campo `activo` en lugar de eliminar registros
4. **JSONB**: Para descriptores faciales, permite flexibilidad y busqueda
5. **Indices**: Optimizados para las consultas mas frecuentes
