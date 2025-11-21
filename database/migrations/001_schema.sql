-- ============================================
-- SISTEMA DE INGRESO - BASE DE DATOS COMPLETA
-- ============================================
SET client_encoding = 'UTF8';

-- ============================================
-- Funciones de Utilidad
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- Tabla: usuarios (autenticación)
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('jefe_carrera', 'bibliotecario', 'docente')),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_usuarios_modtime
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_activo ON usuarios(activo) WHERE activo = TRUE;

-- ============================================
-- Tabla: docentes
-- ============================================
CREATE TABLE IF NOT EXISTS docentes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    documento_identidad BIGINT UNIQUE NOT NULL CHECK (documento_identidad > 0),
    nombre_completo VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL CHECK (correo ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    telefono BIGINT CHECK (telefono > 0),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_docentes_modtime
    BEFORE UPDATE ON docentes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_docentes_usuario ON docentes(usuario_id);
CREATE INDEX idx_docentes_nombre ON docentes USING gin(to_tsvector('spanish', nombre_completo));
CREATE INDEX idx_docentes_activo ON docentes(activo) WHERE activo = TRUE;

-- ============================================
-- Tabla: turnos
-- ============================================
CREATE TABLE IF NOT EXISTS turnos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_turnos_modtime
    BEFORE UPDATE ON turnos
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_turnos_activo ON turnos(activo) WHERE activo = TRUE;

-- ============================================
-- Tabla: ambientes_academicos
-- ============================================
CREATE TABLE IF NOT EXISTS ambientes_academicos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(255),
    tipo_ambiente VARCHAR(50),
    capacidad INTEGER CHECK (capacidad > 0),
    piso INTEGER,
    edificio VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_ambientes_modtime
    BEFORE UPDATE ON ambientes_academicos
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_ambientes_tipo ON ambientes_academicos(tipo_ambiente);
CREATE INDEX idx_ambientes_activo ON ambientes_academicos(activo) WHERE activo = TRUE;
CREATE INDEX idx_ambientes_edificio ON ambientes_academicos(edificio);

-- ============================================
-- Tabla: llaves (asignadas a aulas)
-- ============================================
CREATE TABLE IF NOT EXISTS llaves (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    ambiente_id INTEGER NOT NULL REFERENCES ambientes_academicos(id) ON DELETE RESTRICT,
    estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'en_uso', 'extraviada', 'inactiva')),
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_llaves_modtime
    BEFORE UPDATE ON llaves
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_llaves_ambiente ON llaves(ambiente_id);
CREATE INDEX idx_llaves_estado ON llaves(estado);
CREATE INDEX idx_llaves_activo ON llaves(activo) WHERE activo = TRUE;

-- ============================================
-- Tabla: asignaciones_docente
-- ============================================
CREATE TABLE IF NOT EXISTS asignaciones_docente (
    id SERIAL PRIMARY KEY,
    docente_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    turno_id INTEGER NOT NULL REFERENCES turnos(id) ON DELETE RESTRICT,
    ambiente_id INTEGER NOT NULL REFERENCES ambientes_academicos(id) ON DELETE RESTRICT,
    llave_id INTEGER REFERENCES llaves(id) ON DELETE SET NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_asignacion_unica UNIQUE (docente_id, turno_id, ambiente_id, fecha_inicio)
);

CREATE TRIGGER update_asignaciones_modtime
    BEFORE UPDATE ON asignaciones_docente
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_asignaciones_docente ON asignaciones_docente(docente_id);
CREATE INDEX idx_asignaciones_turno ON asignaciones_docente(turno_id);
CREATE INDEX idx_asignaciones_ambiente ON asignaciones_docente(ambiente_id);
CREATE INDEX idx_asignaciones_llave ON asignaciones_docente(llave_id);
CREATE INDEX idx_asignaciones_fecha ON asignaciones_docente(fecha_inicio, fecha_fin);
CREATE INDEX idx_asignaciones_activo ON asignaciones_docente(activo) WHERE activo = TRUE;

-- ============================================
-- Tabla: registros
-- ============================================
CREATE TABLE IF NOT EXISTS registros (
    id SERIAL PRIMARY KEY,
    docente_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE RESTRICT,
    ambiente_id INTEGER NOT NULL REFERENCES ambientes_academicos(id) ON DELETE RESTRICT,
    turno_id INTEGER NOT NULL REFERENCES turnos(id) ON DELETE RESTRICT,
    llave_id INTEGER REFERENCES llaves(id) ON DELETE SET NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ingreso', 'salida')),
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    minutos_retraso INTEGER DEFAULT 0 CHECK (minutos_retraso >= 0),
    minutos_extra INTEGER DEFAULT 0 CHECK (minutos_extra >= 0),
    es_excepcional BOOLEAN DEFAULT FALSE,
    observaciones TEXT,
    editado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_registro_unico UNIQUE (docente_id, fecha_hora, tipo)
);

CREATE TRIGGER update_registros_modtime
    BEFORE UPDATE ON registros
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_registros_docente ON registros(docente_id);
CREATE INDEX idx_registros_ambiente ON registros(ambiente_id);
CREATE INDEX idx_registros_turno ON registros(turno_id);
CREATE INDEX idx_registros_llave ON registros(llave_id);
CREATE INDEX idx_registros_fecha ON registros(fecha_hora DESC);
CREATE INDEX idx_registros_tipo ON registros(tipo);
CREATE INDEX idx_registros_fecha_docente ON registros(fecha_hora DESC, docente_id);
CREATE INDEX idx_registros_ambiente_fecha ON registros(ambiente_id, fecha_hora DESC);
CREATE INDEX idx_registros_editados ON registros(editado_por) WHERE editado_por IS NOT NULL;
CREATE INDEX idx_registros_excepcionales ON registros(es_excepcional) WHERE es_excepcional = TRUE;

-- ============================================
-- DATOS INICIALES DE PRUEBA
-- ============================================

-- Turnos iniciales
INSERT INTO turnos (nombre, hora_inicio, hora_fin, descripcion) VALUES
('Mañana', '07:15:00', '10:15:00', 'Turno matutino 07:15 - 10:15'),
('Mediodía', '10:30:00', '13:30:00', 'Turno de mediodía 10:30 - 13:30'),
('Tarde', '15:00:00', '18:00:00', 'Turno vespertino 15:00 - 18:00'),
('Noche', '19:00:00', '22:00:00', 'Turno nocturno 19:00 - 22:00')
ON CONFLICT (nombre) DO NOTHING;

-- Usuarios de prueba (password para todos: password123)
-- Hash bcrypt de "password123": $2b$10$iOFYa3PvpQ9Vy280vvowMOaeZ4s9UqFa2W.2UWLqtrf6GtgZiUYtq
INSERT INTO usuarios (username, password, rol) VALUES
('admin', '$2b$10$iOFYa3PvpQ9Vy280vvowMOaeZ4s9UqFa2W.2UWLqtrf6GtgZiUYtq', 'jefe_carrera'),
('bibliotecario', '$2b$10$iOFYa3PvpQ9Vy280vvowMOaeZ4s9UqFa2W.2UWLqtrf6GtgZiUYtq', 'bibliotecario'),
('docente1', '$2b$10$iOFYa3PvpQ9Vy280vvowMOaeZ4s9UqFa2W.2UWLqtrf6GtgZiUYtq', 'docente')
ON CONFLICT (username) DO NOTHING;

-- Docente de prueba
INSERT INTO docentes (usuario_id, documento_identidad, nombre_completo, correo, telefono) VALUES
((SELECT id FROM usuarios WHERE username = 'docente1'), 12345678, 'Juan Pérez García', 'juan.perez@universidad.edu', 71234567)
ON CONFLICT (documento_identidad) DO NOTHING;

-- Ambientes de ejemplo
INSERT INTO ambientes_academicos (codigo, descripcion, tipo_ambiente, capacidad, piso, edificio) VALUES
('B-16', 'Aula Bloque B-16', 'Aula', 30, 1, 'Bloque B'),
('L-01', 'Laboratorio de Computación 01', 'Laboratorio', 25, 2, 'Edificio Principal'),
('L-02', 'Laboratorio de Computación 02', 'Laboratorio', 25, 2, 'Edificio Principal'),
('P-06', 'Aula Pabellón 06', 'Aula', 40, 0, 'Pabellón P'),
('204', 'Aula 204', 'Aula', 35, 2, 'Edificio Principal'),
('205', 'Aula 205', 'Aula', 35, 2, 'Edificio Principal')
ON CONFLICT (codigo) DO NOTHING;

-- Llaves para los ambientes
INSERT INTO llaves (codigo, ambiente_id, estado, descripcion) VALUES
('L-B16', (SELECT id FROM ambientes_academicos WHERE codigo = 'B-16'), 'disponible', 'Llave principal Bloque B-16'),
('L-L01', (SELECT id FROM ambientes_academicos WHERE codigo = 'L-01'), 'disponible', 'Llave Laboratorio 01'),
('L-L02', (SELECT id FROM ambientes_academicos WHERE codigo = 'L-02'), 'disponible', 'Llave Laboratorio 02'),
('L-P06', (SELECT id FROM ambientes_academicos WHERE codigo = 'P-06'), 'disponible', 'Llave Pabellón 06'),
('L-204', (SELECT id FROM ambientes_academicos WHERE codigo = '204'), 'disponible', 'Llave Aula 204'),
('L-205', (SELECT id FROM ambientes_academicos WHERE codigo = '205'), 'disponible', 'Llave Aula 205')
ON CONFLICT (codigo) DO NOTHING;

-- Asignación de ejemplo (docente Juan Pérez en turno Mañana, aula B-16)
INSERT INTO asignaciones_docente (docente_id, turno_id, ambiente_id, llave_id, fecha_inicio, fecha_fin) VALUES
(
    (SELECT id FROM docentes WHERE documento_identidad = 12345678),
    (SELECT id FROM turnos WHERE nombre = 'Mañana'),
    (SELECT id FROM ambientes_academicos WHERE codigo = 'B-16'),
    (SELECT id FROM llaves WHERE codigo = 'L-B16'),
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '6 months'
)
ON CONFLICT (docente_id, turno_id, ambiente_id, fecha_inicio) DO NOTHING;

-- ============================================
-- VISTAS
-- ============================================
CREATE OR REPLACE VIEW v_registros_completos AS
SELECT
    r.id,
    r.fecha_hora,
    r.tipo,
    d.documento_identidad,
    d.nombre_completo AS docente,
    d.correo,
    a.codigo AS ambiente_codigo,
    a.descripcion AS ambiente_descripcion,
    t.nombre AS turno_nombre,
    l.codigo AS llave_codigo,
    r.minutos_retraso,
    r.minutos_extra,
    r.observaciones
FROM registros r
INNER JOIN docentes d ON r.docente_id = d.id
INNER JOIN ambientes_academicos a ON r.ambiente_id = a.id
INNER JOIN turnos t ON r.turno_id = t.id
LEFT JOIN llaves l ON r.llave_id = l.id
ORDER BY r.fecha_hora DESC;
