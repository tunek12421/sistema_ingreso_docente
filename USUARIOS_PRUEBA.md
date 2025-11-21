# Usuarios de Prueba

La base de datos incluye los siguientes usuarios de prueba con datos precargados:

## Credenciales de Acceso

Todos los usuarios tienen la misma contraseña: **`password123`**

| Usuario | Contraseña | Rol | Descripción |
|---------|-----------|-----|-------------|
| `admin` | `password123` | Jefe de Carrera | Acceso completo al sistema |
| `bibliotecario` | `password123` | Bibliotecario | Registro de ingresos/salidas |
| `docente1` | `password123` | Docente | Ver registros propios y horario |

## Datos Precargados

### Turnos (4)
- **Madrugada**: 00:00 - 06:00
- **Mañana**: 06:00 - 12:00
- **Tarde**: 12:00 - 18:00
- **Noche**: 18:00 - 23:59

### Docentes (1)
- **Juan Pérez García**
  - CI: 12345678
  - Usuario: `docente1`
  - Email: juan.perez@universidad.edu
  - Teléfono: 71234567

### Ambientes/Aulas (6)
- B-16 - Aula Bloque B-16 (30 personas)
- L-01 - Laboratorio de Computación 01 (25 personas)
- L-02 - Laboratorio de Computación 02 (25 personas)
- P-06 - Aula Pabellón 06 (40 personas)
- 204 - Aula 204 (35 personas)
- 205 - Aula 205 (35 personas)

### Llaves (6)
- L-B16 - Llave principal Bloque B-16
- L-L01 - Llave Laboratorio 01
- L-L02 - Llave Laboratorio 02
- L-P06 - Llave Pabellón 06
- L-204 - Llave Aula 204
- L-205 - Llave Aula 205

### Asignaciones (1)
- **Juan Pérez García** asignado a:
  - Turno: Mañana (06:00 - 12:00)
  - Ambiente: B-16
  - Llave: L-B16
  - Vigencia: 6 meses desde hoy

## Acceso al Sistema

URL: `http://localhost`

### Flujo de Prueba Recomendado

1. **Como Jefe de Carrera (admin):**
   - Login con `admin` / `password123`
   - Gestionar docentes, turnos, ambientes, llaves
   - Crear asignaciones docente-turno-aula-llave
   - Ver reportes y estadísticas

2. **Como Bibliotecario:**
   - Login con `bibliotecario` / `password123`
   - Registrar ingresos y salidas de docentes
   - Ver registros del día

3. **Como Docente:**
   - Login con `docente1` / `password123`
   - Ver mis registros de asistencia
   - Consultar mi horario asignado

## Reiniciar Base de Datos

Si necesitas resetear la base de datos a los datos iniciales:

```bash
docker-compose down -v
docker-compose up -d
```

Esto eliminará todos los datos y volverá a crear la base de datos con los datos de prueba precargados.

## Notas Técnicas

- Password hash usado: bcrypt con costo 10
- Hash generado: `$2b$10$iOFYa3PvpQ9Vy280vvowMOaeZ4s9UqFa2W.2UWLqtrf6GtgZiUYtq`
- Todos los datos se insertan con `ON CONFLICT DO NOTHING` para evitar duplicados

## Pruebas de Login Exitosas ✅

```bash
# Login como admin (jefe_carrera)
curl -X POST http://localhost:8081/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# Login como bibliotecario
curl -X POST http://localhost:8081/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bibliotecario","password":"password123"}'

# Login como docente
curl -X POST http://localhost:8081/login \
  -H "Content-Type: application/json" \
  -d '{"username":"docente1","password":"password123"}'
```

Todos los logins retornan un JWT token válido y los datos del usuario.
