package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/sistema-ingreso-docente/backend/internal/application/dto"
	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/usecases"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/http/middleware"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/jwt"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/security"
)

// Constantes de seguridad para edición de registros
const (
	// MaxEditWindowHours define cuántas horas después de creado se puede editar un registro
	// sin ser jefe de carrera
	MaxEditWindowHours = 24
)

type RegistroHandler struct {
	registroUseCase *usecases.RegistroUseCase
	docenteUseCase  *usecases.DocenteUseCase
	turnoUseCase    *usecases.TurnoUseCase
	db              *sql.DB
}

func NewRegistroHandler(
	registroUseCase *usecases.RegistroUseCase,
	docenteUseCase *usecases.DocenteUseCase,
	turnoUseCase *usecases.TurnoUseCase,
	db *sql.DB,
) *RegistroHandler {
	return &RegistroHandler{
		registroUseCase: registroUseCase,
		docenteUseCase:  docenteUseCase,
		turnoUseCase:    turnoUseCase,
		db:              db,
	}
}

func (h *RegistroHandler) RegistrarIngreso(w http.ResponseWriter, r *http.Request) {
	var req dto.RegistroIngresoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Datos inválidos"}`, http.StatusBadRequest)
		return
	}

	// Buscar docente por CI
	docente, err := h.docenteUseCase.GetByCI(req.CI)
	if err != nil {
		http.Error(w, `{"error":"Docente no encontrado"}`, http.StatusNotFound)
		return
	}

	// Validar que se proporcione turno_id
	if req.TurnoID == nil {
		http.Error(w, `{"error":"Debe especificar turno_id"}`, http.StatusBadRequest)
		return
	}

	registro, err := h.registroUseCase.RegistrarIngreso(docente.ID, *req.TurnoID, req.LlaveID, req.Observaciones)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(registro)
}

func (h *RegistroHandler) RegistrarSalida(w http.ResponseWriter, r *http.Request) {
	var req dto.RegistroSalidaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Datos inválidos"}`, http.StatusBadRequest)
		return
	}

	docente, err := h.docenteUseCase.GetByCI(req.CI)
	if err != nil {
		http.Error(w, `{"error":"Docente no encontrado"}`, http.StatusNotFound)
		return
	}

	// Validar que se proporcione turno_id
	if req.TurnoID == nil {
		http.Error(w, `{"error":"Debe especificar turno_id"}`, http.StatusBadRequest)
		return
	}

	registro, err := h.registroUseCase.RegistrarSalida(docente.ID, *req.TurnoID, req.LlaveID, req.Observaciones)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(registro)
}

func (h *RegistroHandler) GetByFecha(w http.ResponseWriter, r *http.Request) {
	fechaStr := r.URL.Query().Get("fecha")
	if fechaStr == "" {
		fechaStr = time.Now().Format("2006-01-02")
	}

	_, err := time.Parse("2006-01-02", fechaStr)
	if err != nil {
		http.Error(w, `{"error":"Fecha inválida"}`, http.StatusBadRequest)
		return
	}

	// Consulta directa con JOINS para obtener toda la información (similar a GetRegistrosHoy)
	query := `
		SELECT
			r.id, r.docente_id, d.nombre_completo as docente_nombre, d.documento_identidad as docente_ci,
			r.turno_id, t.nombre as turno_nombre,
			r.llave_id, l.codigo as llave_codigo, l.aula_codigo, l.aula_nombre,
			r.tipo, r.fecha_hora, r.minutos_retraso, r.minutos_extra, r.es_excepcional
		FROM registros r
		INNER JOIN docentes d ON r.docente_id = d.id
		INNER JOIN turnos t ON r.turno_id = t.id
		LEFT JOIN llaves l ON r.llave_id = l.id
		WHERE DATE(r.fecha_hora) = $1
		ORDER BY r.fecha_hora DESC
	`

	rows, err := h.db.Query(query, fechaStr)
	if err != nil {
		http.Error(w, `{"error":"Error obteniendo registros"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var registros []dto.RegistroHoyResponse
	for rows.Next() {
		var reg dto.RegistroHoyResponse
		err := rows.Scan(
			&reg.ID, &reg.DocenteID, &reg.DocenteNombre, &reg.DocenteCI,
			&reg.TurnoID, &reg.TurnoNombre,
			&reg.LlaveID, &reg.LlaveCodigo, &reg.AulaCodigo, &reg.AulaNombre,
			&reg.Tipo, &reg.FechaHora, &reg.MinutosRetraso, &reg.MinutosExtra, &reg.EsExcepcional,
		)
		if err != nil {
			http.Error(w, `{"error":"Error procesando registros"}`, http.StatusInternalServerError)
			return
		}
		registros = append(registros, reg)
	}

	if len(registros) == 0 {
		registros = []dto.RegistroHoyResponse{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(registros)
}

func (h *RegistroHandler) GetRegistrosHoy(w http.ResponseWriter, r *http.Request) {
	// Consulta directa con JOINS para obtener toda la información
	query := `
		SELECT
			r.id, r.docente_id, d.nombre_completo as docente_nombre, d.documento_identidad as docente_ci,
			r.turno_id, t.nombre as turno_nombre,
			r.llave_id, l.codigo as llave_codigo, l.aula_codigo, l.aula_nombre,
			r.tipo, r.fecha_hora, r.minutos_retraso, r.minutos_extra, r.es_excepcional
		FROM registros r
		INNER JOIN docentes d ON r.docente_id = d.id
		INNER JOIN turnos t ON r.turno_id = t.id
		LEFT JOIN llaves l ON r.llave_id = l.id
		WHERE DATE(r.fecha_hora) = CURRENT_DATE
		ORDER BY r.fecha_hora DESC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		http.Error(w, `{"error":"Error obteniendo registros de hoy"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var registros []dto.RegistroHoyResponse
	for rows.Next() {
		var reg dto.RegistroHoyResponse
		err := rows.Scan(
			&reg.ID, &reg.DocenteID, &reg.DocenteNombre, &reg.DocenteCI,
			&reg.TurnoID, &reg.TurnoNombre,
			&reg.LlaveID, &reg.LlaveCodigo, &reg.AulaCodigo, &reg.AulaNombre,
			&reg.Tipo, &reg.FechaHora, &reg.MinutosRetraso, &reg.MinutosExtra, &reg.EsExcepcional,
		)
		if err != nil {
			http.Error(w, `{"error":"Error procesando registros"}`, http.StatusInternalServerError)
			return
		}
		registros = append(registros, reg)
	}

	if registros == nil {
		registros = []dto.RegistroHoyResponse{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(registros)
}

func (h *RegistroHandler) GetLlaveActual(w http.ResponseWriter, r *http.Request) {
	docenteIDStr := r.URL.Query().Get("docente_id")

	// Si no se proporciona docente_id, devolver todas las llaves actualmente en uso
	if docenteIDStr == "" {
		query := `
			SELECT DISTINCT ON (r_ingreso.llave_id)
				r_ingreso.id,
				r_ingreso.llave_id,
				l.codigo as llave_codigo,
				l.aula_codigo,
				r_ingreso.docente_id,
				CAST(d.documento_identidad AS TEXT) as docente_ci,
				d.nombre_completo as docente_nombre_completo,
				r_ingreso.fecha_hora as hora_ingreso
			FROM registros r_ingreso
			INNER JOIN llaves l ON r_ingreso.llave_id = l.id
			INNER JOIN docentes d ON r_ingreso.docente_id = d.id
			WHERE r_ingreso.tipo = 'ingreso'
			  AND r_ingreso.llave_id IS NOT NULL
			  AND NOT EXISTS (
				  SELECT 1 FROM registros r_salida
				  WHERE r_salida.llave_id = r_ingreso.llave_id
					AND r_salida.docente_id = r_ingreso.docente_id
					AND r_salida.tipo = 'salida'
					AND r_salida.fecha_hora > r_ingreso.fecha_hora
			  )
			ORDER BY r_ingreso.llave_id, r_ingreso.fecha_hora DESC
		`

		rows, err := h.db.Query(query)
		if err != nil {
			http.Error(w, `{"error":"Error al consultar registros activos"}`, http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		type LlaveActual struct {
			LlaveID             int    `json:"llave_id"`
			LlaveCodigo         string `json:"llave_codigo"`
			AulaCodigo          string `json:"aula_codigo"`
			DocenteID           int    `json:"docente_id"`
			DocenteCI           string `json:"docente_ci"`
			DocenteNombreCompleto string `json:"docente_nombre_completo"`
			HoraIngreso         string `json:"hora_ingreso"`
		}

		var llavesActuales []LlaveActual
		for rows.Next() {
			var la LlaveActual
			var id int
			err := rows.Scan(
				&id,
				&la.LlaveID,
				&la.LlaveCodigo,
				&la.AulaCodigo,
				&la.DocenteID,
				&la.DocenteCI,
				&la.DocenteNombreCompleto,
				&la.HoraIngreso,
			)
			if err != nil {
				continue
			}
			llavesActuales = append(llavesActuales, la)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(llavesActuales)
		return
	}

	// Si se proporciona docente_id, devolver la llave actual de ese docente
	var docenteID int
	if _, err := fmt.Sscanf(docenteIDStr, "%d", &docenteID); err != nil {
		http.Error(w, `{"error":"docente_id inválido"}`, http.StatusBadRequest)
		return
	}

	llaveID, err := h.registroUseCase.GetLlaveActualDocente(docenteID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"llave_id": nil,
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"llave_id": llaveID,
	})
}

// Update permite al Bibliotecario o Jefe de Carrera editar/corregir registros
func (h *RegistroHandler) Update(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := security.ValidateID(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID inválido"}`, http.StatusBadRequest)
		return
	}

	// Obtener claims del usuario autenticado
	claims, ok := r.Context().Value(middleware.UserContextKey).(*jwt.Claims)
	if !ok || claims == nil {
		http.Error(w, `{"error":"No autorizado"}`, http.StatusUnauthorized)
		return
	}

	// Obtener el registro actual
	registroActual, err := h.registroUseCase.GetByID(id)
	if err != nil {
		http.Error(w, `{"error":"Registro no encontrado"}`, http.StatusNotFound)
		return
	}

	// SEGURIDAD: Validar ventana temporal de edición
	// Solo Jefe de Carrera o Administrador pueden editar registros antiguos
	horasDesdeCreacion := time.Since(registroActual.FechaHora).Hours()
	if horasDesdeCreacion > MaxEditWindowHours {
		if claims.Rol != entities.RolJefeCarrera && claims.Rol != entities.RolAdministrador {
			http.Error(w, `{"error":"Solo puede editar registros de las últimas 24 horas"}`, http.StatusForbidden)
			return
		}
	}

	// Guardar copia del registro anterior para sincronización de llaves
	registroAnterior := &entities.Registro{
		ID:        registroActual.ID,
		DocenteID: registroActual.DocenteID,
		TurnoID:   registroActual.TurnoID,
		Tipo:      registroActual.Tipo,
		FechaHora: registroActual.FechaHora,
	}
	if registroActual.LlaveID != nil {
		llaveIDCopia := *registroActual.LlaveID
		registroAnterior.LlaveID = &llaveIDCopia
	}

	// Parsear los datos de actualización
	var req dto.RegistroUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Datos inválidos"}`, http.StatusBadRequest)
		return
	}

	// Validar observaciones si se proporcionan
	if req.Observaciones != nil {
		if err := security.ValidateDescripcion(*req.Observaciones); err != nil {
			http.Error(w, `{"error":"Observaciones demasiado largas"}`, http.StatusBadRequest)
			return
		}
	}

	// Actualizar solo los campos proporcionados
	if req.DocenteID != nil {
		if *req.DocenteID <= 0 {
			http.Error(w, `{"error":"docente_id inválido"}`, http.StatusBadRequest)
			return
		}
		registroActual.DocenteID = *req.DocenteID
	}

	if req.FechaHora != nil {
		fechaHora, err := time.Parse(time.RFC3339, *req.FechaHora)
		if err != nil {
			http.Error(w, `{"error":"Formato de fecha/hora inválido. Use RFC3339"}`, http.StatusBadRequest)
			return
		}
		registroActual.FechaHora = fechaHora
	}

	// Manejar cambio de llave: puede ser nueva llave o quitar llave
	if req.QuitarLlave {
		registroActual.LlaveID = nil
	} else if req.LlaveID != nil {
		if *req.LlaveID <= 0 {
			http.Error(w, `{"error":"llave_id inválido"}`, http.StatusBadRequest)
			return
		}
		registroActual.LlaveID = req.LlaveID
	}

	if req.TurnoID != nil {
		if *req.TurnoID <= 0 {
			http.Error(w, `{"error":"turno_id inválido"}`, http.StatusBadRequest)
			return
		}
		registroActual.TurnoID = *req.TurnoID
	}

	if req.Tipo != nil {
		tipoRegistro := entities.TipoRegistro(*req.Tipo)
		if !tipoRegistro.IsValid() {
			http.Error(w, `{"error":"Tipo inválido. Valores permitidos: ingreso, salida"}`, http.StatusBadRequest)
			return
		}
		registroActual.Tipo = tipoRegistro
	}

	if req.Observaciones != nil {
		registroActual.Observaciones = req.Observaciones
	}

	// SEGURIDAD: Forzar editado_por desde JWT (no confiar en el request)
	registroActual.EditadoPor = &claims.UserID

	// Guardar cambios con sincronización de estados de llaves
	if err := h.registroUseCase.UpdateConSincronizacionLlaves(registroAnterior, registroActual); err != nil {
		log.Printf("[ERROR] Error actualizando registro %d por usuario %d: %v", id, claims.UserID, err)
		http.Error(w, `{"error":"Error al actualizar registro"}`, http.StatusInternalServerError)
		return
	}

	// Log de auditoría
	log.Printf("[AUDIT] Usuario %d (%s) editó registro %d", claims.UserID, claims.Username, id)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(registroActual)
}

// Delete elimina un registro y sincroniza el estado de la llave si es necesario
func (h *RegistroHandler) Delete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := security.ValidateID(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID inválido"}`, http.StatusBadRequest)
		return
	}

	// Obtener claims del usuario autenticado
	claims, ok := r.Context().Value(middleware.UserContextKey).(*jwt.Claims)
	if !ok || claims == nil {
		http.Error(w, `{"error":"No autorizado"}`, http.StatusUnauthorized)
		return
	}

	// Obtener el registro antes de eliminarlo para sincronizar la llave
	registro, err := h.registroUseCase.GetByID(id)
	if err != nil {
		http.Error(w, `{"error":"Registro no encontrado"}`, http.StatusNotFound)
		return
	}

	// SEGURIDAD: Validar ventana temporal de eliminación
	// Solo Jefe de Carrera o Administrador pueden eliminar registros antiguos
	horasDesdeCreacion := time.Since(registro.FechaHora).Hours()
	if horasDesdeCreacion > MaxEditWindowHours {
		if claims.Rol != entities.RolJefeCarrera && claims.Rol != entities.RolAdministrador {
			http.Error(w, `{"error":"Solo puede eliminar registros de las últimas 24 horas"}`, http.StatusForbidden)
			return
		}
	}

	// Eliminar con sincronización de estado de llave
	if err := h.registroUseCase.DeleteConSincronizacionLlave(registro); err != nil {
		log.Printf("[ERROR] Error eliminando registro %d por usuario %d: %v", id, claims.UserID, err)
		http.Error(w, `{"error":"Error al eliminar registro"}`, http.StatusInternalServerError)
		return
	}

	// Log de auditoría
	log.Printf("[AUDIT] Usuario %d (%s) eliminó registro %d", claims.UserID, claims.Username, id)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Registro eliminado correctamente"})
}
