package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/sistema-ingreso-docente/backend/internal/application/dto"
	"github.com/sistema-ingreso-docente/backend/internal/domain/usecases"
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

// Update permite al Jefe de Carrera editar/corregir registros
func (h *RegistroHandler) Update(w http.ResponseWriter, r *http.Request) {
	// Por ahora, solo devolvemos un mensaje indicando que la funcionalidad está en desarrollo
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Funcionalidad de edición de registros en desarrollo",
	})
}
