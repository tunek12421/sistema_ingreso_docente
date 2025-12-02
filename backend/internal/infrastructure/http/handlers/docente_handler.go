package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	"github.com/sistema-ingreso-docente/backend/internal/domain/entities"
	"github.com/sistema-ingreso-docente/backend/internal/domain/usecases"
)

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
	id, err := strconv.Atoi(vars["id"])
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
	ci, err := strconv.ParseInt(vars["ci"], 10, 64)
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

func (h *DocenteHandler) Create(w http.ResponseWriter, r *http.Request) {
	var docente entities.Docente
	if err := json.NewDecoder(r.Body).Decode(&docente); err != nil {
		http.Error(w, `{"error":"Datos inválidos"}`, http.StatusBadRequest)
		return
	}

	// Crear el docente
	if err := h.docenteUseCase.Create(&docente); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	// Crear automáticamente el usuario asociado con username único
	username := h.generateUniqueUsername(docente.NombreCompleto)
	password := fmt.Sprintf("%d", docente.DocumentoIdentidad) // CI como contraseña inicial

	usuario := &entities.Usuario{
		Username:       username,
		Password:       password,
		Rol:            entities.RolDocente,
		NombreCompleto: docente.NombreCompleto,
		Email:          docente.Correo,
		Activo:         true,
	}

	// Intentar crear el usuario
	if err := h.usuarioUseCase.Create(usuario); err != nil {
		// Si falla la creación del usuario, log pero no falla todo
		// El docente ya fue creado, solo advertimos
		fmt.Printf("Advertencia: No se pudo crear usuario para docente %d: %v\n", docente.ID, err)
	} else {
		// Actualizar el docente con el usuario_id
		docente.UsuarioID = &usuario.ID
		if err := h.docenteUseCase.Update(&docente); err != nil {
			fmt.Printf("Advertencia: No se pudo vincular usuario %d al docente %d: %v\n", usuario.ID, docente.ID, err)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(docente)
}

func (h *DocenteHandler) Update(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID inválido"}`, http.StatusBadRequest)
		return
	}

	var docente entities.Docente
	if err := json.NewDecoder(r.Body).Decode(&docente); err != nil {
		http.Error(w, `{"error":"Datos inválidos"}`, http.StatusBadRequest)
		return
	}

	docente.ID = id
	if err := h.docenteUseCase.Update(&docente); err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(docente)
}

func (h *DocenteHandler) Delete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, `{"error":"ID inválido"}`, http.StatusBadRequest)
		return
	}

	if err := h.docenteUseCase.Delete(id); err != nil {
		http.Error(w, `{"error":"Error eliminando docente"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
