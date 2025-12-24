package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/usecases"
	"github.com/sistema-ingreso-docente/backend/internal/infrastructure/security"
)

// _ es usado para mantener strconv importado (usado en SearchByCI)
var _ = strconv.Atoi

type DocenteHandler struct {
	docenteUseCase *usecases.DocenteUseCase
	usuarioUseCase *usecases.UsuarioUseCase
}

func NewDocenteHandler(docenteUseCase *usecases.DocenteUseCase, usuarioUseCase *usecases.UsuarioUseCase) *DocenteHandler {
	return &DocenteHandler{
		docenteUseCase: docenteUseCase,
		usuarioUseCase: usuarioUseCase,
	}
}

// generateUsername genera un username a partir del nombre completo
// Ejemplo: "Juan Pérez García" -> "juan.perez"
func generateUsername(nombreCompleto string) string {
	// Convertir a minúsculas y quitar acentos
	nombre := strings.ToLower(nombreCompleto)
	nombre = strings.ReplaceAll(nombre, "á", "a")
	nombre = strings.ReplaceAll(nombre, "é", "e")
	nombre = strings.ReplaceAll(nombre, "í", "i")
	nombre = strings.ReplaceAll(nombre, "ó", "o")
	nombre = strings.ReplaceAll(nombre, "ú", "u")
	nombre = strings.ReplaceAll(nombre, "ñ", "n")

	// Dividir por espacios y tomar las primeras 2 palabras
	words := strings.Fields(nombre)
	if len(words) == 0 {
		return "docente"
	}

	if len(words) == 1 {
		// Solo un nombre, usar solo ese
		return sanitizeUsername(words[0])
	}

	// Nombre y apellido separados por punto
	username := words[0] + "." + words[1]
	return sanitizeUsername(username)
}

// sanitizeUsername remueve caracteres no permitidos
func sanitizeUsername(username string) string {
	// Solo permitir letras, números, puntos y guiones bajos
	reg := regexp.MustCompile(`[^a-z0-9._-]+`)
	return reg.ReplaceAllString(username, "")
}

// generateUniqueUsername genera un username único verificando disponibilidad
// Si el username ya existe, agrega un número secuencial (juan.perez2, juan.perez3, etc.)
func (h *DocenteHandler) generateUniqueUsername(nombreCompleto string) string {
	baseUsername := generateUsername(nombreCompleto)
	username := baseUsername

	// Intentar con el username base primero
	if !h.usuarioUseCase.UsernameExists(username) {
		return username
	}

	// Si ya existe, agregar número secuencial
	counter := 2
	for counter <= 100 { // Límite de seguridad
		username = fmt.Sprintf("%s%d", baseUsername, counter)
		if !h.usuarioUseCase.UsernameExists(username) {
			return username
		}
		counter++
	}

	// Si llegamos aquí, agregar timestamp como último recurso
	return fmt.Sprintf("%s_%d", baseUsername, counter)
}

func (h *DocenteHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	docentes, err := h.docenteUseCase.GetAll()
	if err != nil {
		http.Error(w, `{"error":"Error obteniendo docentes"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(docentes)
}

func (h *DocenteHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := security.ValidateID(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID inválido"}`, http.StatusBadRequest)
		return
	}

	docente, err := h.docenteUseCase.GetByID(id)
	if err != nil {
		http.Error(w, `{"error":"Docente no encontrado"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(docente)
}

func (h *DocenteHandler) GetByCI(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	ci, err := security.ValidateCIString(vars["ci"])
	if err != nil {
		http.Error(w, `{"error":"CI inválido"}`, http.StatusBadRequest)
		return
	}

	docente, err := h.docenteUseCase.GetByCI(ci)
	if err != nil {
		http.Error(w, `{"error":"Docente no encontrado"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(docente)
}

func (h *DocenteHandler) SearchByCI(w http.ResponseWriter, r *http.Request) {
	// Obtener el parámetro query string "q"
	ciPartial := r.URL.Query().Get("q")
	if ciPartial == "" {
		http.Error(w, `{"error":"Parámetro de búsqueda 'q' requerido"}`, http.StatusBadRequest)
		return
	}

	// Validar que solo contenga dígitos
	if _, err := strconv.Atoi(ciPartial); err != nil {
		http.Error(w, `{"error":"El parámetro de búsqueda debe contener solo dígitos"}`, http.StatusBadRequest)
		return
	}

	docentes, err := h.docenteUseCase.SearchByCI(ciPartial)
	if err != nil {
		http.Error(w, `{"error":"Error buscando docentes"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(docentes)
}

func (h *DocenteHandler) Create(w http.ResponseWriter, r *http.Request) {
	var docente entities.Docente
	if err := json.NewDecoder(r.Body).Decode(&docente); err != nil {
		http.Error(w, `{"error":"Datos inválidos"}`, http.StatusBadRequest)
		return
	}

	// Validar CI
	if err := security.ValidateCI(docente.DocumentoIdentidad); err != nil {
		http.Error(w, `{"error":"Documento de identidad inválido"}`, http.StatusBadRequest)
		return
	}

	// Validar longitud de nombre completo
	if err := security.ValidateNombreCompleto(docente.NombreCompleto); err != nil {
		http.Error(w, `{"error":"Nombre completo demasiado largo"}`, http.StatusBadRequest)
		return
	}

	// Validar formato de email
	if err := security.ValidateEmail(docente.Correo); err != nil {
		http.Error(w, `{"error":"Formato de email inválido"}`, http.StatusBadRequest)
		return
	}

	// Crear el docente
	if err := h.docenteUseCase.Create(&docente); err != nil {
		log.Printf("[ERROR] Error creando docente: %v", err)
		http.Error(w, `{"error":"Error al crear docente"}`, http.StatusBadRequest)
		return
	}

	// Crear automáticamente el usuario asociado con username único
	// NOTA: No guardamos nombre_completo ni email en usuario - se obtienen del docente via JOIN
	username := h.generateUniqueUsername(docente.NombreCompleto)

	// Generar contraseña segura aleatoria (no usar CI como contraseña)
	password, err := security.GenerateSecurePassword(12)
	if err != nil {
		log.Printf("Error generando contraseña segura: %v", err)
		http.Error(w, `{"error":"Error interno al crear usuario"}`, http.StatusInternalServerError)
		return
	}

	usuario := &entities.Usuario{
		Username: username,
		Password: password,
		Rol:      entities.RolDocente,
		Activo:   true,
	}

	// Intentar crear el usuario
	if err := h.usuarioUseCase.Create(usuario); err != nil {
		// Si falla la creación del usuario, log pero no falla todo
		// El docente ya fue creado, solo advertimos
		log.Printf("Advertencia: No se pudo crear usuario para docente %d: %v", docente.ID, err)
	} else {
		// Actualizar el docente con el usuario_id
		docente.UsuarioID = &usuario.ID
		if err := h.docenteUseCase.Update(&docente); err != nil {
			log.Printf("Advertencia: No se pudo vincular usuario %d al docente %d: %v", usuario.ID, docente.ID, err)
		}

		// NOTA: En producción, enviar credenciales por email seguro al docente
		// NO loguear contraseñas en texto plano por seguridad
		log.Printf("[INFO] Usuario creado para docente %s - Username: %s (contraseña temporal generada)",
			docente.NombreCompleto, username)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(docente)
}

func (h *DocenteHandler) Update(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := security.ValidateID(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID inválido"}`, http.StatusBadRequest)
		return
	}

	// Obtener el docente actual para mantener el usuario_id
	docenteActual, err := h.docenteUseCase.GetByID(id)
	if err != nil {
		http.Error(w, `{"error":"Docente no encontrado"}`, http.StatusNotFound)
		return
	}

	var docente entities.Docente
	if err := json.NewDecoder(r.Body).Decode(&docente); err != nil {
		http.Error(w, `{"error":"Datos inválidos"}`, http.StatusBadRequest)
		return
	}

	// Validar CI si se proporciona
	if docente.DocumentoIdentidad > 0 {
		if err := security.ValidateCI(docente.DocumentoIdentidad); err != nil {
			http.Error(w, `{"error":"Documento de identidad inválido"}`, http.StatusBadRequest)
			return
		}
	}

	// Validar longitud de nombre completo
	if docente.NombreCompleto != "" {
		if err := security.ValidateNombreCompleto(docente.NombreCompleto); err != nil {
			http.Error(w, `{"error":"Nombre completo demasiado largo"}`, http.StatusBadRequest)
			return
		}
	}

	// Validar formato de email
	if err := security.ValidateEmail(docente.Correo); err != nil {
		http.Error(w, `{"error":"Formato de email inválido"}`, http.StatusBadRequest)
		return
	}

	docente.ID = id
	// Mantener el usuario_id del docente actual
	docente.UsuarioID = docenteActual.UsuarioID

	if err := h.docenteUseCase.Update(&docente); err != nil {
		log.Printf("[ERROR] Error actualizando docente %d: %v", id, err)
		http.Error(w, `{"error":"Error al actualizar docente"}`, http.StatusBadRequest)
		return
	}

	// NOTA: No actualizamos nombre/email en usuario - se obtienen del docente via JOIN

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(docente)
}

func (h *DocenteHandler) Delete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := security.ValidateID(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID inválido"}`, http.StatusBadRequest)
		return
	}

	if err := h.docenteUseCase.Delete(id); err != nil {
		log.Printf("[ERROR] Error eliminando docente %d: %v", id, err)
		http.Error(w, `{"error":"Error eliminando docente"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
