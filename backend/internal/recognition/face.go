package recognition

import (
	"encoding/json"
	"fmt"

	"github.com/Kagami/go-face"
)

const (
	// Directorios de modelos pre-entrenados de dlib
	modelDir = "./models"
	// Umbral de similitud para considerar un rostro como coincidente
	tolerance = 0.25
)

type FaceDescriptor struct {
	Descriptor [128]float32 `json:"descriptor"`
	Rectangle  Rectangle    `json:"rectangle"`
}

type Rectangle struct {
	Min Point `json:"min"`
	Max Point `json:"max"`
}

type Point struct {
	X int `json:"x"`
	Y int `json:"y"`
}

// Recognizer encapsula el reconocedor facial
type Recognizer struct {
	rec *face.Recognizer
}

// NewRecognizer inicializa un nuevo reconocedor facial
func NewRecognizer() (*Recognizer, error) {
	rec, err := face.NewRecognizer(modelDir)
	if err != nil {
		return nil, fmt.Errorf("error al inicializar el reconocedor: %v", err)
	}
	return &Recognizer{rec: rec}, nil
}

// Close cierra el reconocedor y libera recursos
func (r *Recognizer) Close() {
	if r.rec != nil {
		r.rec.Close()
	}
}

// RecognizeFile detecta rostros en una imagen desde un archivo
func (r *Recognizer) RecognizeFile(imagePath string) ([]FaceDescriptor, error) {
	faces, err := r.rec.RecognizeFile(imagePath)
	if err != nil {
		return nil, fmt.Errorf("error al procesar la imagen: %v", err)
	}

	if len(faces) == 0 {
		return nil, nil
	}

	// Convertir []face.Face a []FaceDescriptor
	result := make([]FaceDescriptor, len(faces))
	for i, f := range faces {
		result[i] = FaceDescriptor{
			Descriptor: f.Descriptor,
			Rectangle: Rectangle{
				Min: Point{X: f.Rectangle.Min.X, Y: f.Rectangle.Min.Y},
				Max: Point{X: f.Rectangle.Max.X, Y: f.Rectangle.Max.Y},
			},
		}
	}
	return result, nil
}

// Recognize detecta rostros en una imagen desde bytes
func (r *Recognizer) Recognize(imageData []byte) ([]FaceDescriptor, error) {
	faces, err := r.rec.Recognize(imageData)
	if err != nil {
		return nil, fmt.Errorf("error al procesar la imagen: %v", err)
	}

	if len(faces) == 0 {
		return nil, nil
	}

	// Convertir []face.Face a []FaceDescriptor
	result := make([]FaceDescriptor, len(faces))
	for i, f := range faces {
		result[i] = FaceDescriptor{
			Descriptor: f.Descriptor,
			Rectangle: Rectangle{
				Min: Point{X: f.Rectangle.Min.X, Y: f.Rectangle.Min.Y},
				Max: Point{X: f.Rectangle.Max.X, Y: f.Rectangle.Max.Y},
			},
		}
	}
	return result, nil
}

// CompareFaces compara dos descriptores faciales y retorna la distancia euclidiana
func CompareFaces(desc1, desc2 FaceDescriptor) float32 {
	var sum float32
	for i := range desc1.Descriptor {
		diff := desc1.Descriptor[i] - desc2.Descriptor[i]
		sum += diff * diff
	}
	return sum
}

// IsSamePerson determina si dos rostros pertenecen a la misma persona
func IsSamePerson(desc1, desc2 FaceDescriptor) bool {
	distance := CompareFaces(desc1, desc2)
	return distance < tolerance
}

// GetBiggerFace retorna el rostro con el área más grande de una lista de rostros
func GetBiggerFace(faces []FaceDescriptor) FaceDescriptor {
	if len(faces) == 0 {
		return FaceDescriptor{}
	}

	maxIndex := 0
	maxArea := 0

	for i, f := range faces {
		dx := f.Rectangle.Max.X - f.Rectangle.Min.X
		dy := f.Rectangle.Max.Y - f.Rectangle.Min.Y
		area := dx * dy
		if area > maxArea {
			maxArea = area
			maxIndex = i
		}
	}

	return faces[maxIndex]
}

// DescriptorToJSON convierte un descriptor facial a JSON
func DescriptorToJSON(desc FaceDescriptor) (string, error) {
	data, err := json.Marshal(desc)
	if err != nil {
		return "", fmt.Errorf("error al serializar descriptor: %v", err)
	}
	return string(data), nil
}

// JSONToDescriptor convierte JSON a un descriptor facial
func JSONToDescriptor(jsonData string) (FaceDescriptor, error) {
	var desc FaceDescriptor
	err := json.Unmarshal([]byte(jsonData), &desc)
	if err != nil {
		return FaceDescriptor{}, fmt.Errorf("error al deserializar descriptor: %v", err)
	}
	return desc, nil
}
