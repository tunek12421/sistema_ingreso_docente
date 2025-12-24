package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

// ApiResponse está definida en usuario_handler.go
// Se usa la misma estructura para todas las respuestas

// SendJSON envía una respuesta JSON
func SendJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// SendSuccess envía una respuesta exitosa
func SendSuccess(w http.ResponseWriter, data interface{}, message string) {
	SendJSON(w, http.StatusOK, ApiResponse{
		Data:    data,
		Message: message,
	})
}

// SendCreated envía respuesta de recurso creado
func SendCreated(w http.ResponseWriter, data interface{}, message string) {
	SendJSON(w, http.StatusCreated, ApiResponse{
		Data:    data,
		Message: message,
	})
}

// SendError envía un error al cliente de forma segura
// En producción, no expone detalles internos
func SendError(w http.ResponseWriter, status int, userMessage string, internalErr error) {
	// Log interno con detalles completos
	if internalErr != nil {
		log.Printf("[ERROR] %s - Detalle interno: %v", userMessage, internalErr)
	}

	// En desarrollo, mostrar error interno para debugging
	errorMessage := userMessage
	if os.Getenv("GO_ENV") != "production" && internalErr != nil {
		errorMessage = internalErr.Error()
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ApiResponse{
		Error: errorMessage,
	})
}

// SendBadRequest envía error 400
func SendBadRequest(w http.ResponseWriter, message string, err error) {
	SendError(w, http.StatusBadRequest, message, err)
}

// SendUnauthorized envía error 401
func SendUnauthorized(w http.ResponseWriter, message string) {
	SendError(w, http.StatusUnauthorized, message, nil)
}

// SendForbidden envía error 403
func SendForbidden(w http.ResponseWriter, message string) {
	SendError(w, http.StatusForbidden, message, nil)
}

// SendNotFound envía error 404
func SendNotFound(w http.ResponseWriter, message string) {
	SendError(w, http.StatusNotFound, message, nil)
}

// SendInternalError envía error 500
func SendInternalError(w http.ResponseWriter, err error) {
	SendError(w, http.StatusInternalServerError, "Error interno del servidor", err)
}

// SendConflict envía error 409
func SendConflict(w http.ResponseWriter, message string, err error) {
	SendError(w, http.StatusConflict, message, err)
}
