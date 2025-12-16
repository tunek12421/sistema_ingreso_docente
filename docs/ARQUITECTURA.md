# Arquitectura del Sistema

Documentacion de la arquitectura del Sistema de Ingreso Docente.

## Vision General

El sistema sigue una arquitectura cliente-servidor con:
- **Backend**: API REST en Go con Clean Architecture
- **Frontend**: SPA en Angular con arquitectura modular por features
- **Base de Datos**: PostgreSQL relacional

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│     Backend     │────▶│   PostgreSQL    │
│    (Angular)    │     │      (Go)       │     │                 │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     :4200                   :8080                   :5432
```

---

## Arquitectura del Backend

### Clean Architecture

El backend implementa Clean Architecture con separacion clara de responsabilidades:

```
┌────────────────────────────────────────────────────────────┐
│                      HTTP Handlers                         │
│                   (Capa de Presentacion)                   │
├────────────────────────────────────────────────────────────┤
│                        Use Cases                           │
│                   (Logica de Negocio)                      │
├────────────────────────────────────────────────────────────┤
│                       Repositories                         │
│                   (Interfaces de Datos)                    │
├────────────────────────────────────────────────────────────┤
│                    Implementations                         │
│              (PostgreSQL, JWT, Face Recognition)           │
└────────────────────────────────────────────────────────────┘
```

### Estructura de Directorios

```
backend/
├── cmd/
│   └── api/
│       └── main.go              # Punto de entrada, inyeccion de dependencias
│
├── internal/
│   ├── application/
│   │   └── dto/                 # Data Transfer Objects
│   │       ├── auth.go          # DTOs de autenticacion
│   │       ├── registro.go      # DTOs de registro
│   │       └── registro_response.go
│   │
│   ├── domain/
│   │   ├── entities/            # Entidades del dominio
│   │   │   ├── usuario.go
│   │   │   ├── docente.go
│   │   │   ├── turno.go
│   │   │   ├── llave.go
│   │   │   └── registro.go
│   │   │
│   │   ├── repositories/        # Interfaces de repositorios
│   │   │   ├── usuario_repository.go
│   │   │   ├── docente_repository.go
│   │   │   ├── turno_repository.go
│   │   │   ├── llave_repository.go
│   │   │   └── registro_repository.go
│   │   │
│   │   └── usecases/            # Casos de uso (logica de negocio)
│   │       ├── auth_usecase.go
│   │       ├── usuario_usecase.go
│   │       ├── docente_usecase.go
│   │       ├── turno_usecase.go
│   │       ├── llave_usecase.go
│   │       └── registro_usecase.go
│   │
│   ├── infrastructure/
│   │   ├── database/            # Implementacion de repositorios
│   │   │   ├── connection.go    # Conexion a PostgreSQL
│   │   │   ├── usuario_repository_impl.go
│   │   │   ├── docente_repository_impl.go
│   │   │   ├── turno_repository_impl.go
│   │   │   ├── llave_repository_impl.go
│   │   │   └── registro_repository_impl.go
│   │   │
│   │   ├── http/
│   │   │   ├── handlers/        # Manejadores HTTP
│   │   │   │   ├── auth_handler.go
│   │   │   │   ├── usuario_handler.go
│   │   │   │   ├── docente_handler.go
│   │   │   │   ├── turno_handler.go
│   │   │   │   ├── llave_handler.go
│   │   │   │   ├── registro_handler.go
│   │   │   │   └── reconocimiento_handler.go
│   │   │   │
│   │   │   ├── middleware/      # Middlewares
│   │   │   │   ├── auth.go      # Autenticacion JWT
│   │   │   │   └── cors.go      # CORS
│   │   │   │
│   │   │   └── routes/
│   │   │       └── routes.go    # Definicion de rutas
│   │   │
│   │   └── jwt/
│   │       └── jwt.go           # Generacion/validacion de tokens
│   │
│   └── recognition/
│       └── face.go              # Reconocimiento facial con dlib
│
└── models/                      # Modelos pre-entrenados dlib
    ├── dlib_face_recognition_resnet_model_v1.dat
    ├── mmod_human_face_detector.dat
    └── shape_predictor_5_face_landmarks.dat
```

### Flujo de una Request

```
HTTP Request
     │
     ▼
┌─────────────┐
│   Router    │  (Gorilla Mux)
│  routes.go  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    CORS     │  (Middleware)
│  cors.go    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Auth     │  (Middleware - valida JWT)
│  auth.go    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Handler   │  (Recibe request, valida, llama usecase)
│ *_handler   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   UseCase   │  (Logica de negocio)
│ *_usecase   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Repository  │  (Acceso a datos)
│ *_repo_impl │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ PostgreSQL  │
└─────────────┘
```

### Inyeccion de Dependencias

La inyeccion se realiza en `main.go`:

```go
// Conexion a BD
db := database.NewConnection()

// Repositorios
userRepo := database.NewUsuarioRepository(db)
docenteRepo := database.NewDocenteRepository(db)
// ...

// Casos de uso
authUseCase := usecases.NewAuthUseCase(userRepo, jwtService)
userUseCase := usecases.NewUsuarioUseCase(userRepo)
// ...

// Handlers
authHandler := handlers.NewAuthHandler(authUseCase)
userHandler := handlers.NewUsuarioHandler(userUseCase)
// ...

// Router
router := routes.SetupRoutes(authHandler, userHandler, ...)
```

---

## Arquitectura del Frontend

### Estructura Modular

El frontend usa arquitectura por features con separacion en capas:

```
frontend-angular/
└── src/
    └── app/
        ├── core/                # Singleton services, guards, interceptors
        │   ├── services/
        │   │   ├── auth.service.ts
        │   │   ├── usuario.service.ts
        │   │   ├── docente.service.ts
        │   │   ├── turno.service.ts
        │   │   ├── llave.service.ts
        │   │   ├── registro.service.ts
        │   │   ├── reconocimiento.service.ts
        │   │   └── toast.service.ts
        │   │
        │   ├── guards/
        │   │   ├── auth.guard.ts
        │   │   └── role.guard.ts
        │   │
        │   └── interceptors/
        │       ├── auth.interceptor.ts
        │       └── error.interceptor.ts
        │
        ├── shared/              # Componentes y modelos compartidos
        │   ├── models/
        │   │   ├── auth.model.ts
        │   │   ├── usuario.model.ts
        │   │   ├── docente.model.ts
        │   │   ├── turno.model.ts
        │   │   ├── llave.model.ts
        │   │   ├── registro.model.ts
        │   │   └── api-response.model.ts
        │   │
        │   └── components/
        │       ├── modal/
        │       ├── alert-modal/
        │       ├── loading-spinner/
        │       ├── toast-container/
        │       └── webcam-capture/
        │
        └── features/            # Modulos por rol/funcionalidad
            ├── auth/
            │   └── login/
            │
            ├── admin/
            │   ├── layout/
            │   ├── dashboard/
            │   ├── usuarios/
            │   ├── docentes/
            │   ├── turnos/
            │   └── llaves/
            │
            ├── bibliotecario/
            │   ├── layout/
            │   ├── dashboard/
            │   ├── registro-entrada/
            │   ├── registro-salida/
            │   ├── llaves-actuales/
            │   └── historial/
            │
            ├── jefe-carrera/
            │   ├── layout/
            │   ├── dashboard/
            │   ├── docentes/
            │   └── registros/
            │
            └── docente/
                ├── layout/
                └── dashboard/
```

### Flujo de Autenticacion

```
┌──────────────┐
│    Login     │
│  Component   │
└──────┬───────┘
       │ submit credentials
       ▼
┌──────────────┐
│    Auth      │
│   Service    │
└──────┬───────┘
       │ POST /login
       ▼
┌──────────────┐     ┌──────────────┐
│   Backend    │────▶│ localStorage │
│   Response   │     │  (token)     │
└──────────────┘     └──────┬───────┘
                            │
       ┌────────────────────┘
       │
       ▼
┌──────────────┐
│    Auth      │  Interceptor agrega token a requests
│ Interceptor  │
└──────────────┘
```

### Guards y Proteccion de Rutas

```typescript
// auth.guard.ts - Verifica que hay sesion activa
canActivate() {
  if (authService.isAuthenticated()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
}

// role.guard.ts - Verifica rol del usuario
canActivate(route) {
  const requiredRoles = route.data['roles'];
  const userRole = authService.getCurrentUser()?.rol;

  if (requiredRoles.includes(userRole)) {
    return true;
  }
  return false;
}
```

### Configuracion de Rutas

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['administrador'] },
    loadChildren: () => import('./features/admin/admin.routes')
  },
  {
    path: 'bibliotecario',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['bibliotecario'] },
    loadChildren: () => import('./features/bibliotecario/bibliotecario.routes')
  },
  // ...
];
```

---

## Patrones de Diseno

### Backend

1. **Repository Pattern**: Abstrae el acceso a datos
2. **Use Case Pattern**: Encapsula logica de negocio
3. **Dependency Injection**: Inyeccion manual en main.go
4. **Middleware Pattern**: Para autenticacion y CORS

### Frontend

1. **Service Pattern**: Servicios singleton para HTTP
2. **Guard Pattern**: Proteccion de rutas
3. **Interceptor Pattern**: Modificacion de requests/responses
4. **Observable Pattern**: RxJS para datos asincronos

---

## Seguridad

### Autenticacion

- JWT con expiracion de 24 horas
- Contraseñas hasheadas con bcrypt
- Token almacenado en localStorage

### Autorizacion

- Middleware de verificacion de rol en backend
- Guards en frontend para UI
- Validacion doble (frontend + backend)

### Protecciones

- CORS configurado para origenes permitidos
- Validacion de entrada en ambos lados
- Prepared statements para prevenir SQL injection

---

## Reconocimiento Facial

### Arquitectura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Webcam    │────▶│   go-face   │────▶│  PostgreSQL │
│  (Browser)  │     │   (dlib)    │     │   (JSONB)   │
└─────────────┘     └─────────────┘     └─────────────┘
     Base64           Descriptor           Array de
     Image            128 floats           descriptores
```

### Proceso de Identificacion

1. Captura imagen desde webcam (frontend)
2. Envio como base64 al backend
3. dlib detecta rostros en la imagen
4. Genera descriptor de 128 valores
5. Compara con descriptores almacenados
6. Retorna docente si distancia < 0.25

---

## Comunicacion Frontend-Backend

### Request/Response Flow

```
Frontend                          Backend
   │                                 │
   │  POST /login                    │
   │  {username, password}           │
   │────────────────────────────────▶│
   │                                 │
   │  200 OK                         │
   │  {token, user}                  │
   │◀────────────────────────────────│
   │                                 │
   │  GET /docentes                  │
   │  Authorization: Bearer <token>  │
   │────────────────────────────────▶│
   │                                 │
   │  200 OK                         │
   │  [{docente1}, {docente2}]       │
   │◀────────────────────────────────│
```

### Manejo de Errores

```typescript
// error.interceptor.ts
intercept(req, next) {
  return next.handle(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
}
```

---

## Consideraciones de Escalabilidad

### Backend

- Stateless: Cada request es independiente
- JWT: No requiere sesiones en servidor
- Pool de conexiones a BD

### Frontend

- Lazy loading de modulos
- Standalone components
- Tree shaking en build

### Base de Datos

- Indices en campos de busqueda frecuente
- JSONB para datos flexibles (descriptores faciales)
- Vistas para consultas complejas
