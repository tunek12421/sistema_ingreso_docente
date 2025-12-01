# 📋 Checklist de Tareas - Frontend Angular
## ORDEN RECOMENDADO DE TRABAJO

## Estado del Proyecto
- **Framework**: Angular 21 + Tailwind CSS 3
- **Arquitectura**: Clean Architecture (core/shared/features)
- **Autenticación**: ✅ Completada (Login + Guards + Interceptors)
- **Servicios HTTP**: ✅ Completados (Usuario, Docente, Turno, Llave, Registro)
- **Componentes Base**: ✅ Modal reutilizable

---

## 🎯 ORDEN RECOMENDADO (Trabajaremos en este orden)

### FASE 1: Componentes Base (3 tareas) ✅ COMPLETADA
1. [x] **Componente Loading Spinner**
2. [x] **Componente Toast/Mensajes**
3. [x] **Componente Tabla Reutilizable** (No necesario - usaremos HTML directo)

### FASE 2: Módulo Administrador - Layout y Dashboard (2 tareas)
4. [ ] **Layout Admin con Sidebar**
5. [ ] **Dashboard Admin con Estadísticas**

### FASE 3: Módulo Administrador - CRUD Usuarios (1 tarea)
6. [ ] **CRUD Usuarios Completo**

### FASE 4: Módulo Administrador - CRUD Docentes (1 tarea)
7. [ ] **CRUD Docentes Completo**

### FASE 5: Módulo Administrador - CRUD Turnos (1 tarea)
8. [ ] **CRUD Turnos Completo**

### FASE 6: Módulo Administrador - CRUD Llaves (1 tarea)
9. [ ] **CRUD Llaves Completo + Estados**

### FASE 7: Módulo Administrador - Vista Registros (1 tarea)
10. [ ] **Vista Registros (Solo Lectura)**

### FASE 8: Módulo Bibliotecario - Layout (1 tarea)
11. [ ] **Layout Bibliotecario**

### FASE 9: Módulo Bibliotecario - Registro Ingreso (1 tarea)
12. [ ] **Formulario Registro Ingreso**

### FASE 10: Módulo Bibliotecario - Registro Salida (1 tarea)
13. [ ] **Formulario Registro Salida**

### FASE 11: Módulo Bibliotecario - Vistas (2 tareas)
14. [ ] **Vista Registros de Hoy**
15. [ ] **Vista Llaves Actuales**

### FASE 12: Módulo Jefe Carrera - Layout (1 tarea)
16. [ ] **Layout Jefe de Carrera**

### FASE 13: Módulo Jefe Carrera - Gestión (1 tarea)
17. [ ] **CRUD Docentes (Jefe Carrera)**

### FASE 14: Módulo Jefe Carrera - Registros (1 tarea)
18. [ ] **Vista y Edición de Registros**

### FASE 15: Módulo Jefe Carrera - Reportes (1 tarea)
19. [ ] **Generador de Reportes**

### FASE 16: Módulo Docente (1 tarea)
20. [ ] **Vista Mis Registros**

### FASE 17: Testing Final (3 tareas)
21. [ ] **Probar Login y Navegación**
22. [ ] **Probar CRUD Completo**
23. [ ] **Probar Permisos y Guards**

**Total: 23 tareas en 17 fases**

---

## 🔴 MÓDULO ADMINISTRADOR (0/7 completadas)

### Layout y Navegación
- [ ] **Layout con sidebar navegación**
  - Sidebar responsive con menú de navegación
  - Header con información del usuario
  - Botón de logout
  - Toggle para colapsar/expandir sidebar

### Dashboard
- [ ] **Dashboard principal con estadísticas**
  - Tarjetas con contadores (usuarios, docentes, turnos, llaves)
  - Gráficos de uso de llaves
  - Últimos registros del día
  - Resumen de llaves disponibles vs en uso

### Gestión de Entidades
- [ ] **Gestión de Usuarios (lista + CRUD)**
  - Tabla con lista de usuarios
  - Filtros por rol y estado
  - Formulario crear usuario
  - Formulario editar usuario
  - Cambiar contraseña
  - Activar/Desactivar usuario
  - Confirmación de eliminación

- [ ] **Gestión de Docentes (lista + CRUD)**
  - Tabla con lista de docentes
  - Búsqueda por CI, nombre o apellido
  - Formulario crear docente
  - Formulario editar docente
  - Validación de CI único
  - Confirmación de eliminación

- [ ] **Gestión de Turnos (lista + CRUD)**
  - Tabla con lista de turnos
  - Visualización de horarios
  - Formulario crear turno
  - Formulario editar turno
  - Selector de días de la semana
  - Validación de horarios
  - Confirmación de eliminación

- [ ] **Gestión de Llaves (lista + CRUD + estados)**
  - Tabla con lista de llaves
  - Filtros por estado
  - Búsqueda por código de llave o aula
  - Formulario crear llave
  - Formulario editar llave
  - Cambiar estado (disponible, en_uso, perdida, mantenimiento)
  - Badge visual de estado
  - Confirmación de eliminación

### Consultas
- [ ] **Vista de Registros (solo lectura + filtros)**
  - Tabla de registros
  - Filtro por fecha
  - Filtro por docente
  - Ver quién tiene cada llave actualmente
  - Exportar a CSV/Excel (opcional)

---

## 🟡 MÓDULO BIBLIOTECARIO (0/5 completadas)

### Layout y Navegación
- [ ] **Layout con navegación**
  - Menú simplificado (Registrar Ingreso/Salida, Ver Registros)
  - Header con usuario
  - Botón de logout

### Registro de Llaves
- [ ] **Formulario Registro Ingreso**
  - Buscar docente por CI (con validación)
  - Mostrar datos del docente
  - Verificar turno del docente
  - Seleccionar llave disponible
  - Campo de observaciones (opcional)
  - Registrar ingreso
  - Mensajes de error/éxito

- [ ] **Formulario Registro Salida**
  - Buscar por código de llave
  - Mostrar docente que tiene la llave
  - Confirmar devolución
  - Campo de observaciones (opcional)
  - Registrar salida
  - Mensajes de error/éxito

### Consultas
- [ ] **Vista Registros de Hoy**
  - Tabla con registros del día actual
  - Mostrar ingresos pendientes de salida
  - Actualización en tiempo real
  - Badge de estado (con llave / sin llave)

- [ ] **Vista Llaves Actuales**
  - Tabla mostrando quién tiene cada llave
  - Tiempo transcurrido desde el retiro
  - Filtros por aula
  - Indicador visual de tiempo excedido

---

## 🟢 MÓDULO JEFE DE CARRERA (0/4 completadas)

### Layout y Navegación
- [ ] **Layout con navegación**
  - Menú (Docentes, Registros, Reportes)
  - Header con usuario
  - Botón de logout

### Gestión
- [ ] **Gestión de Docentes (lista + CRUD)**
  - Misma funcionalidad que Administrador
  - Tabla con lista de docentes
  - CRUD completo
  - Validaciones

### Registros
- [ ] **Vista y Edición de Registros**
  - Tabla de registros con filtros
  - Editar hora de ingreso/salida
  - Agregar/editar observaciones
  - Validación de permisos
  - Confirmación de cambios

### Reportes
- [ ] **Generador de Reportes**
  - Filtros: por fecha, rango de fechas, docente
  - Reporte de asistencias por docente
  - Reporte de uso de llaves
  - Estadísticas de registros
  - Exportar a PDF/Excel
  - Vista previa antes de exportar

---

## 🔵 MÓDULO DOCENTE (0/1 completada)

- [ ] **Vista de Mis Registros (solo lectura)**
  - Tabla con mis registros históricos
  - Filtro por fecha
  - Ver estado actual (¿tengo llave?)
  - Información de turno asignado

---

## 🟣 COMPONENTES COMPARTIDOS (0/3 completadas)

- [ ] **Tabla reutilizable con paginación**
  - Component genérico `<app-table>`
  - Soporte para paginación
  - Ordenamiento por columnas
  - Búsqueda/filtrado
  - Acciones por fila (editar, eliminar)
  - Estados: loading, empty, error

- [ ] **Loading spinner y estados de carga**
  - Spinner component
  - Skeleton loaders
  - Estados de carga en botones
  - Overlay de carga para formularios

- [ ] **Mensajes de error y éxito (toast/alert)**
  - Toast notifications
  - Alert component
  - Service para mostrar mensajes globales
  - Auto-dismiss después de X segundos
  - Diferentes tipos: success, error, warning, info

---

## 🧪 TESTING (0/3 completadas)

- [ ] **Probar login y navegación entre módulos**
  - Login con cada rol
  - Redirección automática al dashboard correcto
  - Guards funcionando correctamente
  - Logout y limpieza de sesión

- [ ] **Probar CRUD completo de cada entidad**
  - Crear registros
  - Leer/listar registros
  - Actualizar registros
  - Eliminar registros
  - Validaciones de formularios
  - Manejo de errores del backend

- [ ] **Probar permisos y guards de roles**
  - Administrador puede acceder a todo
  - Bibliotecario solo a sus funciones
  - Jefe de Carrera solo a docentes y reportes
  - Docente solo a vista de registros
  - Verificar que no se puedan acceder rutas sin permiso

---

## 📊 Progreso Total

**0 / 23 tareas completadas** (0%)

### Por Módulo:
- 🔴 Administrador: 0/7 (0%)
- 🟡 Bibliotecario: 0/5 (0%)
- 🟢 Jefe de Carrera: 0/4 (0%)
- 🔵 Docente: 0/1 (0%)
- 🟣 Componentes Compartidos: 0/3 (0%)
- 🧪 Testing: 0/3 (0%)

---

## 🎯 Orden Sugerido de Implementación

### Fase 1: Componentes Base
1. Componentes compartidos (tabla, loading, mensajes)
2. Layout del administrador

### Fase 2: CRUD Básicos (Administrador)
3. Gestión de Usuarios
4. Gestión de Docentes
5. Gestión de Turnos
6. Gestión de Llaves

### Fase 3: Funcionalidad Principal (Bibliotecario)
7. Layout del bibliotecario
8. Registro de Ingreso
9. Registro de Salida
10. Vistas de consulta

### Fase 4: Jefe de Carrera
11. Layout jefe de carrera
12. Gestión de Docentes
13. Edición de Registros
14. Generador de Reportes

### Fase 5: Docente y Testing
15. Vista para Docentes
16. Testing completo

---

## 📝 Notas

- Cada módulo debe tener validaciones completas en formularios
- Todos los formularios deben tener manejo de errores
- Usar Tailwind CSS para mantener consistencia visual
- Implementar confirmaciones antes de eliminar
- Agregar loading states en todas las operaciones asíncronas
- Mantener el código DRY (Don't Repeat Yourself)

---

**Última actualización**: 2025-12-01
