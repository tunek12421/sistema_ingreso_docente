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
	registroUseCase   *usecases.RegistroUseCase
	docenteUseCase    *usecases.DocenteUseCase
	turnoUseCase      *usecases.TurnoUseCase
	asignacionUseCase *usecases.AsignacionUseCase
	db                *sql.DB
}

func NewRegistroHandler(
	registroUseCase *usecases.RegistroUseCase,
	docenteUseCase *usecases.DocenteUseCase,
	turnoUseCase *usecases.TurnoUseCase,
	asignacionUseCase *usecases.AsignacionUseCase,
	db *sql.DB,
) *RegistroHandler {
	return &RegistroHandler{
		registroUseCase:   registroUseCase,
		docenteUseCase:    docenteUseCase,
		turnoUseCase:      turnoUseCase,
		asignacionUseCase: asignacionUseCase,
		db:                db,
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

	// Intentar obtener datos automáticamente de asignaciones
	var ambienteID, turnoID int
	var llaveID *int = req.LlaveID

	// Buscar asignaciones activas del docente para hoy
	asignaciones, err := h.asignacionUseCase.GetByDocenteYFecha(docente.ID, time.Now())
	if err == nil && len(asignaciones) > 0 {
		// Si se proporcionó ambiente_id, buscar la asignación que coincida
		if req.AmbienteID != nil {
			for _, asig := range asignaciones {
				if asig.AmbienteID == *req.AmbienteID {
					ambienteID = asig.AmbienteID
					turnoID = asig.TurnoID
					if llaveID == nil && asig.LlaveID != nil {
						llaveID = asig.LlaveID
					}
					break
				}
			}
		} else {
			// Si no se especificó ambiente, usar la primera asignación
			asig := asignaciones[0]
			ambienteID = asig.AmbienteID
			turnoID = asig.TurnoID
			if llaveID == nil && asig.LlaveID != nil {
				llaveID = asig.LlaveID
			}
		}
	}

	// Si no se encontró asignación, requerir datos manuales
	if ambienteID == 0 {
		if req.AmbienteID == nil || req.TurnoID == nil {
			http.Error(w, `{"error":"El docente no tiene asignaciones. Debe especificar ambiente_id y turno_id manualmente"}`, http.StatusBadRequest)
			return
		}
		ambienteID = *req.AmbienteID
		turnoID = *req.TurnoID
	}

	registro, err := h.registroUseCase.RegistrarIngreso(docente.ID, ambienteID, turnoID, llaveID)
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

	// Intentar obtener datos automáticamente de asignaciones
	var ambienteID, turnoID int
	var llaveID *int = req.LlaveID

	// Buscar asignaciones activas del docente para hoy
	asignaciones, err := h.asignacionUseCase.GetByDocenteYFecha(docente.ID, time.Now())
	if err == nil && len(asignaciones) > 0 {
		// Si se proporcionó ambiente_id, buscar la asignación que coincida
		if req.AmbienteID != nil {
			for _, asig := range asignaciones {
				if asig.AmbienteID == *req.AmbienteID {
					ambienteID = asig.AmbienteID
					turnoID = asig.TurnoID
					if llaveID == nil && asig.LlaveID != nil {
						llaveID = asig.LlaveID
					}
					break
				}
			}
		} else {
			// Si no se especificó ambiente, usar la primera asignación
			asig := asignaciones[0]
			ambienteID = asig.AmbienteID
			turnoID = asig.TurnoID
			if llaveID == nil && asig.LlaveID != nil {
				llaveID = asig.LlaveID
			}
		}
	}

	// Si no se encontró asignación, requerir datos manuales
	if ambienteID == 0 {
		if req.AmbienteID == nil || req.TurnoID == nil {
			http.Error(w, `{"error":"El docente no tiene asignaciones. Debe especificar ambiente_id y turno_id manualmente"}`, http.StatusBadRequest)
			return
		}
		ambienteID = *req.AmbienteID
		turnoID = *req.TurnoID
	}

	registro, err := h.registroUseCase.RegistrarSalida(docente.ID, ambienteID, turnoID, llaveID)
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

	fecha, err := time.Parse("2006-01-02", fechaStr)
	if err != nil {
		http.Error(w, `{"error":"Fecha inválida"}`, http.StatusBadRequest)
		return
	}

	registros, err := h.registroUseCase.GetByFecha(fecha)
	if err != nil {
		http.Error(w, `{"error":"Error obteniendo registros"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(registros)
}

func (h *RegistroHandler) GetRegistrosHoy(w http.ResponseWriter, r *http.Request) {
	// Consulta directa con JOINS para obtener toda la información
	query := `
		SELECT
			r.id, r.docente_id, d.nombre_completo as docente_nombre, d.documento_identidad as docente_ci,
			r.ambiente_id, a.codigo as ambiente_codigo,
			r.turno_id, t.nombre as turno_nombre,
			r.llave_id, l.codigo as llave_codigo,
			r.tipo, r.fecha_hora, r.minutos_retraso, r.minutos_extra, r.es_excepcional
		FROM registros r
		INNER JOIN docentes d ON r.docente_id = d.id
		INNER JOIN ambientes_academicos a ON r.ambiente_id = a.id
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
			&reg.AmbienteID, &reg.AmbienteCodigo,
			&reg.TurnoID, &reg.TurnoNombre,
			&reg.LlaveID, &reg.LlaveCodigo,
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
