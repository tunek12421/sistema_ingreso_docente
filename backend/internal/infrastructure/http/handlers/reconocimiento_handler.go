package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/sistema-ingreso-docente/backend/internal/domain/repositories"
	"github.com/sistema-ingreso-docente/backend/internal/recognition"
)

// Extensiones de imagen permitidas
var allowedImageExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".webp": true,
}

// generateSafeFilename genera un nombre de archivo seguro y único
func generateSafeFilename(prefix string, originalExt string) string {
	// Generar ID único
	bytes := make([]byte, 8)
	rand.Read(bytes)
	uniqueID := hex.EncodeToString(bytes)

	// Sanitizar extensión
	ext := strings.ToLower(originalExt)
	if !allowedImageExtensions[ext] {
		ext = ".jpg" // Default seguro
	}

	return fmt.Sprintf("%s_%d_%s%s", prefix, time.Now().UnixNano(), uniqueID, ext)
}

// validateImageExtension verifica que la extensión sea permitida
func validateImageExtension(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	return allowedImageExtensions[ext]
}

type ReconocimientoHandler struct {
	docenteRepo repositories.DocenteRepository
}

func NewReconocimientoHandler(docenteRepo repositories.DocenteRepository) *ReconocimientoHandler {
	return &ReconocimientoHandler{
		docenteRepo: docenteRepo,
	}
}

// DetectarRostro detecta rostros en una imagen y retorna el descriptor del rostro más grande
func (h *ReconocimientoHandler) DetectarRostro(w http.ResponseWriter, r *http.Request) {
	file, _, tempFile, err := h.processUploadedImage(r)
	if err != nil {
		h.sendError(w, http.StatusBadRequest, err.Error())
		return
	}
	defer file.Close()
	defer os.Remove(tempFile)

	rec, err := recognition.NewRecognizer()
	if err != nil {
		h.sendError(w, http.StatusInternalServerError, "Error al inicializar reconocedor facial")
		return
	}
	defer rec.Close()

	faces, err := rec.RecognizeFile(tempFile)
	if err != nil {
		h.sendError(w, http.StatusInternalServerError, fmt.Sprintf("Error al procesar imagen: %v", err))
		return
	}

	if len(faces) == 0 {
		h.sendJSON(w, http.StatusOK, ApiResponse{
			Message: "No se detectaron rostros en la imagen",
			Data:    nil,
		})
		return
	}

	biggestFace := recognition.GetBiggerFace(faces)
	h.sendJSON(w, http.StatusOK, ApiResponse{
		Data: map[string]interface{}{
			"face_count": len(faces),
			"descriptor": biggestFace,
		},
	})
}

// IdentificarDocente identifica un docente por su rostro
func (h *ReconocimientoHandler) IdentificarDocente(w http.ResponseWriter, r *http.Request) {
	fmt.Println("═══════════════════════════════════════════════════════════════")
	fmt.Println("[IdentificarDocente] Nueva petición de identificación recibida")
	fmt.Printf("[IdentificarDocente] Timestamp: %v\n", time.Now().Format("2006-01-02 15:04:05.000"))

	file, _, tempFile, err := h.processUploadedImage(r)
	if err != nil {
		fmt.Printf("[IdentificarDocente] ERROR procesando imagen: %v\n", err)
		h.sendError(w, http.StatusBadRequest, err.Error())
		return
	}
	defer file.Close()
	defer os.Remove(tempFile)

	fmt.Printf("[IdentificarDocente] ✓ Imagen guardada en: %s\n", tempFile)

	rec, err := recognition.NewRecognizer()
	if err != nil {
		fmt.Printf("[IdentificarDocente] ERROR inicializando reconocedor: %v\n", err)
		h.sendError(w, http.StatusInternalServerError, "Error al inicializar reconocedor facial")
		return
	}
	defer rec.Close()

	fmt.Println("[IdentificarDocente] ✓ Reconocedor inicializado")
	fmt.Println("[IdentificarDocente] → Detectando rostros en la imagen...")

	faces, err := rec.RecognizeFile(tempFile)
	if err != nil {
		fmt.Printf("[IdentificarDocente] ERROR al detectar rostros: %v\n", err)
		h.sendError(w, http.StatusInternalServerError, fmt.Sprintf("Error al procesar imagen: %v", err))
		return
	}

	fmt.Printf("[IdentificarDocente] ✓ Rostros detectados: %d\n", len(faces))

	if len(faces) == 0 {
		fmt.Println("[IdentificarDocente] ✗ No se detectaron rostros, retornando respuesta vacía")
		h.sendJSON(w, http.StatusOK, ApiResponse{
			Message: "No se detectaron rostros en la imagen",
			Data:    nil,
		})
		return
	}

	capturedFace := recognition.GetBiggerFace(faces)
	fmt.Println("[IdentificarDocente] ✓ Rostro más grande seleccionado para comparación")

	fmt.Println("[IdentificarDocente] → Obteniendo lista de docentes...")
	docentes, err := h.docenteRepo.FindAll()
	if err != nil {
		fmt.Printf("[IdentificarDocente] ERROR obteniendo docentes: %v\n", err)
		h.sendError(w, http.StatusInternalServerError, "Error al obtener docentes")
		return
	}

	fmt.Printf("[IdentificarDocente] ✓ Total de docentes en BD: %d\n", len(docentes))

	// Umbral mínimo de coincidencias requeridas (al menos 3 de los descriptores deben coincidir)
	const minMatchesRequired = 3

	var matchedDocente *struct {
		ID                 int     `json:"id"`
		DocumentoIdentidad int64   `json:"documento_identidad"`
		NombreCompleto     string  `json:"nombre_completo"`
		MatchCount         int     `json:"match_count"`
		TotalDescriptors   int     `json:"total_descriptors"`
		Distance           float32 `json:"distance"` // Mejor distancia encontrada
	}
	bestMatchCount := 0
	totalComparisons := 0
	docentesConDescriptores := 0

	fmt.Println("[IdentificarDocente] → Iniciando comparación con descriptores almacenados...")
	fmt.Printf("[IdentificarDocente]   Umbral de distancia: < 0.25 (tolerance)\n")
	fmt.Printf("[IdentificarDocente]   Mínimo de coincidencias requerido: %d matches\n", minMatchesRequired)

	for _, docente := range docentes {
		if docente.FaceDescriptors == nil || *docente.FaceDescriptors == "" || *docente.FaceDescriptors == "[]" {
			continue
		}

		docentesConDescriptores++
		fmt.Printf("[IdentificarDocente]   Comparando con: %s (CI: %d)\n", docente.NombreCompleto, docente.DocumentoIdentidad)

		// Obtener descriptores usando el método del repositorio que maneja correctamente el JSONB
		descriptorsJSON, err := h.docenteRepo.GetFaceDescriptors(docente.ID)
		if err != nil {
			fmt.Printf("[IdentificarDocente]   ERROR obteniendo descriptores: %v\n", err)
			continue
		}

		fmt.Printf("[IdentificarDocente]   Total descriptores del docente: %d\n", len(descriptorsJSON))

		// Contar coincidencias para este docente
		matchCount := 0
		minDistance := float32(999999.0)

		// Comparar con cada descriptor del docente
		for i, descJSON := range descriptorsJSON {
			totalComparisons++
			storedDesc, err := recognition.JSONToDescriptor(descJSON)
			if err != nil {
				fmt.Printf("[IdentificarDocente]   ERROR parseando descriptor %d: %v\n", i+1, err)
				continue
			}

			distance := recognition.CompareFaces(capturedFace, storedDesc)
			isSame := recognition.IsSamePerson(capturedFace, storedDesc)

			fmt.Printf("[IdentificarDocente]   Descriptor %d/%d: distancia=%.4f, coincide=%v\n",
				i+1, len(descriptorsJSON), distance, isSame)

			if isSame {
				matchCount++
				if distance < minDistance {
					minDistance = distance
				}
				fmt.Printf("[IdentificarDocente]   ✓ Coincidencia %d registrada (distancia: %.4f)\n", matchCount, distance)
			}
		}

		fmt.Printf("[IdentificarDocente]   Resultado: %d/%d coincidencias (%.1f%%)\n",
			matchCount, len(descriptorsJSON), float32(matchCount)/float32(len(descriptorsJSON))*100)

		// Solo considerar como match válido si tiene al menos minMatchesRequired coincidencias
		if matchCount >= minMatchesRequired {
			if matchCount > bestMatchCount {
				bestMatchCount = matchCount
				matchedDocente = &struct {
					ID                 int     `json:"id"`
					DocumentoIdentidad int64   `json:"documento_identidad"`
					NombreCompleto     string  `json:"nombre_completo"`
					MatchCount         int     `json:"match_count"`
					TotalDescriptors   int     `json:"total_descriptors"`
					Distance           float32 `json:"distance"` // Mejor distancia encontrada
				}{
					ID:                 docente.ID,
					DocumentoIdentidad: docente.DocumentoIdentidad,
					NombreCompleto:     docente.NombreCompleto,
					MatchCount:         matchCount,
					TotalDescriptors:   len(descriptorsJSON),
					Distance:           minDistance,
				}
				fmt.Printf("[IdentificarDocente]   ★★★ NUEVA MEJOR COINCIDENCIA: %s (%d/%d matches, %.1f%%, mejor distancia: %.4f)\n",
					docente.NombreCompleto, matchCount, len(descriptorsJSON),
					float32(matchCount)/float32(len(descriptorsJSON))*100, minDistance)
			}
		} else {
			fmt.Printf("[IdentificarDocente]   ✗ Descartado: solo %d/%d coincidencias (mínimo requerido: %d)\n",
				matchCount, len(descriptorsJSON), minMatchesRequired)
		}
	}

	fmt.Printf("[IdentificarDocente] ✓ Comparación completada\n")
	fmt.Printf("[IdentificarDocente]   Docentes con descriptores: %d/%d\n", docentesConDescriptores, len(docentes))
	fmt.Printf("[IdentificarDocente]   Total comparaciones realizadas: %d\n", totalComparisons)

	if matchedDocente == nil {
		fmt.Println("[IdentificarDocente] ✗ NO SE ENCONTRÓ COINCIDENCIA (ningún docente alcanzó el mínimo de coincidencias)")
		h.sendJSON(w, http.StatusOK, ApiResponse{
			Message: "No se encontró ningún docente con ese rostro",
			Data:    nil,
		})
		fmt.Println("═══════════════════════════════════════════════════════════════")
		return
	}

	fmt.Println("[IdentificarDocente] ✓✓✓ DOCENTE IDENTIFICADO EXITOSAMENTE ✓✓✓")
	fmt.Printf("[IdentificarDocente]   Nombre: %s\n", matchedDocente.NombreCompleto)
	fmt.Printf("[IdentificarDocente]   CI: %d\n", matchedDocente.DocumentoIdentidad)
	fmt.Printf("[IdentificarDocente]   Coincidencias: %d/%d (%.1f%%)\n", matchedDocente.MatchCount, matchedDocente.TotalDescriptors, float32(matchedDocente.MatchCount)/float32(matchedDocente.TotalDescriptors)*100)
	fmt.Printf("[IdentificarDocente]   Mejor distancia (< 0.25): %.4f\n", matchedDocente.Distance)

	h.sendJSON(w, http.StatusOK, ApiResponse{Data: matchedDocente})
	fmt.Println("═══════════════════════════════════════════════════════════════")
}

// RegistrarRostroDocente registra el descriptor facial de un docente (soporta múltiples fotos)
func (h *ReconocimientoHandler) RegistrarRostroDocente(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	docenteID, err := strconv.Atoi(vars["id"])
	if err != nil {
		h.sendError(w, http.StatusBadRequest, "ID de docente inválido")
		return
	}

	_, err = h.docenteRepo.FindByID(docenteID)
	if err != nil {
		h.sendError(w, http.StatusNotFound, "Docente no encontrado")
		return
	}

	// SEGURIDAD: Límite de 20MB total (máx 5 imágenes de 4MB cada una)
	err = r.ParseMultipartForm(20 << 20)
	if err != nil {
		h.sendError(w, http.StatusBadRequest, "Error al parsear form o archivo demasiado grande")
		return
	}

	// Obtener múltiples archivos
	files := r.MultipartForm.File["images"]

	if len(files) == 0 {
		h.sendError(w, http.StatusBadRequest, "No se encontraron imágenes en la petición")
		return
	}

	// SEGURIDAD: Limitar número de archivos
	const maxImages = 10
	if len(files) > maxImages {
		h.sendError(w, http.StatusBadRequest, fmt.Sprintf("Máximo %d imágenes permitidas", maxImages))
		return
	}

	if len(files) < 3 {
		h.sendError(w, http.StatusBadRequest, "Se requieren al menos 3 fotos del docente")
		return
	}

	// SEGURIDAD: Validar tamaño individual de cada archivo (máx 4MB por imagen)
	const maxImageSize = 4 << 20 // 4MB
	for _, fileHeader := range files {
		if fileHeader.Size > maxImageSize {
			h.sendError(w, http.StatusBadRequest, "Cada imagen debe ser menor a 4MB")
			return
		}
	}

	rec, err := recognition.NewRecognizer()
	if err != nil {
		h.sendError(w, http.StatusInternalServerError, "Error al inicializar reconocedor facial")
		return
	}
	defer rec.Close()

	tempDir := "./temp"
	os.MkdirAll(tempDir, 0755)

	facesProcessed := 0
	for i, fileHeader := range files {
		// Validar extensión
		if !validateImageExtension(fileHeader.Filename) {
			log.Printf("[SECURITY] Archivo con extensión no permitida ignorado: %s", fileHeader.Filename)
			continue
		}

		file, err := fileHeader.Open()
		if err != nil {
			continue
		}
		defer file.Close()

		// Generar nombre seguro
		safeFilename := generateSafeFilename(fmt.Sprintf("docente_%d_photo_%d", docenteID, i), filepath.Ext(fileHeader.Filename))
		tempFile := filepath.Join(tempDir, safeFilename)
		dst, err := os.Create(tempFile)
		if err != nil {
			continue
		}

		_, err = io.Copy(dst, file)
		dst.Close()
		if err != nil {
			os.Remove(tempFile)
			continue
		}

		faces, err := rec.RecognizeFile(tempFile)
		os.Remove(tempFile)

		if err != nil {
			continue
		}

		if len(faces) == 0 {
			continue
		}

		biggestFace := recognition.GetBiggerFace(faces)
		descriptorJSON, err := recognition.DescriptorToJSON(biggestFace)
		if err != nil {
			continue
		}

		// Agregar descriptor al array en la BD
		err = h.docenteRepo.AddFaceDescriptor(docenteID, descriptorJSON)
		if err != nil {
			continue
		}

		facesProcessed++
	}

	if facesProcessed == 0 {
		h.sendError(w, http.StatusBadRequest, "No se pudo procesar ninguna foto válida")
		return
	}

	if facesProcessed < 3 {
		h.sendError(w, http.StatusBadRequest, fmt.Sprintf("Solo se procesaron %d fotos. Se requieren al menos 3 fotos válidas con rostros visibles", facesProcessed))
		return
	}

	h.sendJSON(w, http.StatusOK, ApiResponse{
		Message: fmt.Sprintf("Rostros registrados exitosamente (%d fotos procesadas)", facesProcessed),
		Data: map[string]interface{}{
			"docente_id":      docenteID,
			"faces_processed": facesProcessed,
		},
	})
}

// Helper methods
func (h *ReconocimientoHandler) processUploadedImage(r *http.Request) (io.ReadCloser, *multipart.FileHeader, string, error) {
	// SEGURIDAD: Límite de 5MB para una sola imagen
	err := r.ParseMultipartForm(5 << 20)
	if err != nil {
		return nil, nil, "", fmt.Errorf("error al parsear form o archivo demasiado grande")
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		return nil, nil, "", fmt.Errorf("no se encontró imagen en la petición")
	}

	// SEGURIDAD: Validar tamaño del archivo (máx 4MB)
	const maxImageSize = 4 << 20 // 4MB
	if header.Size > maxImageSize {
		file.Close()
		return nil, nil, "", fmt.Errorf("imagen demasiado grande (máx 4MB)")
	}

	// Validar extensión de archivo
	if !validateImageExtension(header.Filename) {
		file.Close()
		log.Printf("[SECURITY] Intento de subir archivo con extensión no permitida: %s", header.Filename)
		return nil, nil, "", fmt.Errorf("tipo de archivo no permitido")
	}

	tempDir := "./temp"
	os.MkdirAll(tempDir, 0755)

	// Generar nombre de archivo seguro (evita path traversal)
	safeFilename := generateSafeFilename("upload", filepath.Ext(header.Filename))
	tempFile := filepath.Join(tempDir, safeFilename)

	// Verificar que el path está dentro del directorio temporal
	absPath, _ := filepath.Abs(tempFile)
	absTempDir, _ := filepath.Abs(tempDir)
	if !strings.HasPrefix(absPath, absTempDir) {
		file.Close()
		log.Printf("[SECURITY] Intento de path traversal detectado: %s", header.Filename)
		return nil, nil, "", fmt.Errorf("nombre de archivo inválido")
	}

	dst, err := os.Create(tempFile)
	if err != nil {
		file.Close()
		return nil, nil, "", fmt.Errorf("error al guardar imagen temporal")
	}

	_, err = io.Copy(dst, file)
	dst.Close()
	if err != nil {
		file.Close()
		os.Remove(tempFile)
		return nil, nil, "", fmt.Errorf("error al copiar imagen")
	}

	return file, header, tempFile, nil
}

func (h *ReconocimientoHandler) sendJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (h *ReconocimientoHandler) sendError(w http.ResponseWriter, status int, message string) {
	h.sendJSON(w, status, ApiResponse{Error: message})
}

// ObtenerDescriptoresDocente obtiene los descriptores faciales de un docente
func (h *ReconocimientoHandler) ObtenerDescriptoresDocente(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	docenteID, err := strconv.Atoi(vars["id"])
	if err != nil {
		h.sendError(w, http.StatusBadRequest, "ID de docente inválido")
		return
	}

	descriptors, err := h.docenteRepo.GetFaceDescriptors(docenteID)
	if err != nil {
		h.sendError(w, http.StatusInternalServerError, "Error al obtener descriptores")
		return
	}

	h.sendJSON(w, http.StatusOK, ApiResponse{
		Data: map[string]interface{}{
			"docente_id":  docenteID,
			"count":       len(descriptors),
			"descriptors": descriptors,
		},
	})
}

// EliminarDescriptorDocente elimina un descriptor facial específico
func (h *ReconocimientoHandler) EliminarDescriptorDocente(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	docenteID, err := strconv.Atoi(vars["id"])
	if err != nil {
		h.sendError(w, http.StatusBadRequest, "ID de docente inválido")
		return
	}

	indexStr := vars["index"]
	index, err := strconv.Atoi(indexStr)
	if err != nil {
		h.sendError(w, http.StatusBadRequest, "Índice inválido")
		return
	}

	err = h.docenteRepo.RemoveFaceDescriptor(docenteID, index)
	if err != nil {
		h.sendError(w, http.StatusInternalServerError, "Error al eliminar descriptor")
		return
	}

	h.sendJSON(w, http.StatusOK, ApiResponse{
		Message: "Descriptor eliminado exitosamente",
	})
}

// LimpiarDescriptoresDocente elimina todos los descriptores faciales de un docente
func (h *ReconocimientoHandler) LimpiarDescriptoresDocente(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	docenteID, err := strconv.Atoi(vars["id"])
	if err != nil {
		h.sendError(w, http.StatusBadRequest, "ID de docente inválido")
		return
	}

	err = h.docenteRepo.ClearFaceDescriptors(docenteID)
	if err != nil {
		h.sendError(w, http.StatusInternalServerError, "Error al limpiar descriptores")
		return
	}

	h.sendJSON(w, http.StatusOK, ApiResponse{
		Message: "Todos los descriptores han sido eliminados",
	})
}
