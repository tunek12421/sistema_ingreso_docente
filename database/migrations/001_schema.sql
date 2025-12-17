-- ============================================
-- SISTEMA DE INGRESO - BASE DE DATOS SIMPLIFICADA
-- Solo maneja: Usuarios, Docentes, Turnos, Llaves, Asignaciones, Registros
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
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('administrador', 'jefe_carrera', 'bibliotecario', 'becario', 'docente')),
    nombre_completo VARCHAR(255),
    email VARCHAR(255),
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
    face_descriptors JSONB,
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
-- Tabla: llaves (incluye información del aula)
-- ============================================
CREATE TABLE IF NOT EXISTS llaves (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    aula_codigo VARCHAR(50) NOT NULL,
    aula_nombre VARCHAR(255) NOT NULL,
    estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'en_uso', 'extraviada', 'inactiva')),
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    id_docente INTEGER REFERENCES docentes(id) ON DELETE SET NULL,
    id_uso INTEGER NULL
);

CREATE TRIGGER update_llaves_modtime
    BEFORE UPDATE ON llaves
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_llaves_estado ON llaves(estado);
CREATE INDEX idx_llaves_aula_codigo ON llaves(aula_codigo);
CREATE INDEX idx_llaves_aula_nombre ON llaves USING gin(to_tsvector('spanish', aula_nombre));

-- ============================================
-- Tabla: registros
-- ============================================
CREATE TABLE IF NOT EXISTS registros (
    id SERIAL PRIMARY KEY,
    docente_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE RESTRICT,
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
    CONSTRAINT uk_registro_unico UNIQUE (docente_id, fecha_hora, tipo, llave_id),

    id_uso INTEGER
);

CREATE TRIGGER update_registros_modtime
    BEFORE UPDATE ON registros
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_registros_docente ON registros(docente_id);
CREATE INDEX idx_registros_turno ON registros(turno_id);
CREATE INDEX idx_registros_llave ON registros(llave_id);
CREATE INDEX idx_registros_fecha ON registros(fecha_hora DESC);
CREATE INDEX idx_registros_tipo ON registros(tipo);
CREATE INDEX idx_registros_fecha_docente ON registros(fecha_hora DESC, docente_id);
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

-- Usuarios de prueba (password para todos: admin123)
-- Hash bcrypt de "admin123": $2a$10$C3aeDMEplzVnp40izb2E8uAwOp5ZwANcLMutamZg1FTibPZOrdEdu
INSERT INTO usuarios (username, password, rol, nombre_completo, email) VALUES
('admin', '$2a$10$C3aeDMEplzVnp40izb2E8uAwOp5ZwANcLMutamZg1FTibPZOrdEdu', 'administrador', 'Administrador del Sistema', 'admin@universidad.edu'),
('jefe', '$2a$10$C3aeDMEplzVnp40izb2E8uAwOp5ZwANcLMutamZg1FTibPZOrdEdu', 'jefe_carrera', 'Jefe de Carrera', 'jefe@universidad.edu'),
('bibliotecario', '$2a$10$C3aeDMEplzVnp40izb2E8uAwOp5ZwANcLMutamZg1FTibPZOrdEdu', 'bibliotecario', 'Bibliotecario Principal', 'biblioteca@universidad.edu'),
('becario', '$2a$10$C3aeDMEplzVnp40izb2E8uAwOp5ZwANcLMutamZg1FTibPZOrdEdu', 'becario', 'Becario de Biblioteca', 'becario@universidad.edu'),
('docente1', '$2a$10$C3aeDMEplzVnp40izb2E8uAwOp5ZwANcLMutamZg1FTibPZOrdEdu', 'docente', 'Juan Pérez García', 'juan.perez@universidad.edu')
ON CONFLICT (username) DO NOTHING;

-- Docente de prueba
INSERT INTO docentes (usuario_id, documento_identidad, nombre_completo, correo, telefono) VALUES
((SELECT id FROM usuarios WHERE username = 'docente1'), 12345678, 'Juan Pérez García', 'juan.perez@universidad.edu', 71234567)
ON CONFLICT (documento_identidad) DO NOTHING;

-- Llaves con información de aula integrada
INSERT INTO llaves (codigo, aula_codigo, aula_nombre, estado, descripcion) VALUES
('L-B16', 'B-16', 'Aula Bloque B-16', 'disponible', 'Llave principal Bloque B-16'),
('L-L01', 'L-01', 'Laboratorio de Computación 01', 'disponible', 'Llave Laboratorio 01'),
('L-L02', 'L-02', 'Laboratorio de Computación 02', 'disponible', 'Llave Laboratorio 02'),
('L-P06', 'P-06', 'Aula Pabellón 06', 'disponible', 'Llave Pabellón 06'),
('L-204', '204', 'Aula 204', 'disponible', 'Llave Aula 204'),
('L-205', '205', 'Aula 205', 'disponible', 'Llave Aula 205')
ON CONFLICT (codigo) DO NOTHING;


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
    l.aula_codigo,
    l.aula_nombre,
    t.nombre AS turno_nombre,
    l.codigo AS llave_codigo,
    r.minutos_retraso,
    r.minutos_extra,
    r.observaciones
FROM registros r
INNER JOIN docentes d ON r.docente_id = d.id
INNER JOIN turnos t ON r.turno_id = t.id
LEFT JOIN llaves l ON r.llave_id = l.id
ORDER BY r.fecha_hora DESC;

