import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';

export interface FaceDescriptor {
  descriptor: number[];
  rectangle: {
    min: { x: number; y: number };
    max: { x: number; y: number };
  };
}

export interface DetectarRostroResponse {
  face_count: number;
  descriptor: FaceDescriptor;
}

export interface DocenteIdentificado {
  id: number;
  documento_identidad: number;
  nombre_completo: string;
  match_count: number;
  total_descriptors: number;
  distance: number; // Mejor distancia encontrada (< 0.3)
}

@Injectable({
  providedIn: 'root'
})
export class ReconocimientoService {
  private apiUrl = `${environment.apiUrl}/reconocimiento`;

  constructor(private http: HttpClient) {}

  /**
   * Detecta rostros en una imagen
   * @param imageFile Archivo de imagen
   */
  detectarRostro(imageFile: File): Observable<ApiResponse<DetectarRostroResponse>> {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.http.post<ApiResponse<DetectarRostroResponse>>(
      `${this.apiUrl}/detectar`,
      formData
    );
  }

  /**
   * Identifica un docente por su rostro
   * @param imageFile Archivo de imagen
   */
  identificarDocente(imageFile: File): Observable<ApiResponse<DocenteIdentificado>> {
    console.log('[ReconocimientoService] identificarDocente() llamado');
    console.log('[ReconocimientoService]   Archivo:', imageFile.name);
    console.log('[ReconocimientoService]   Tamaño:', (imageFile.size / 1024).toFixed(2), 'KB');
    console.log('[ReconocimientoService]   Tipo:', imageFile.type);

    const formData = new FormData();
    formData.append('image', imageFile);

    console.log('[ReconocimientoService] → Enviando POST a:', `${this.apiUrl}/identificar`);
    const startTime = Date.now();

    return new Observable(observer => {
      this.http.post<ApiResponse<DocenteIdentificado>>(
        `${this.apiUrl}/identificar`,
        formData
      ).subscribe({
        next: (response) => {
          const elapsed = Date.now() - startTime;
          console.log(`[ReconocimientoService] ← Respuesta recibida en ${elapsed}ms`);
          console.log('[ReconocimientoService]   Response:', response);
          if (response.data) {
            console.log('[ReconocimientoService]   ✓ Docente identificado:', response.data.nombre_completo);
            console.log('[ReconocimientoService]   ✓ CI:', response.data.documento_identidad);
            console.log('[ReconocimientoService]   ✓ Coincidencias:', `${response.data.match_count}/${response.data.total_descriptors}`);
            console.log('[ReconocimientoService]   ✓ Mejor distancia:', response.data.distance);
          } else {
            console.log('[ReconocimientoService]   ✗ No se identificó ningún docente');
            console.log('[ReconocimientoService]   Mensaje:', response.message);
          }
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          const elapsed = Date.now() - startTime;
          console.error(`[ReconocimientoService] ✗ ERROR después de ${elapsed}ms`);
          console.error('[ReconocimientoService]   Status:', error.status);
          console.error('[ReconocimientoService]   StatusText:', error.statusText);
          console.error('[ReconocimientoService]   Error:', error.error);
          console.error('[ReconocimientoService]   Error completo:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Registra el rostro de un docente (múltiples fotos)
   * @param docenteId ID del docente
   * @param imageFiles Array de archivos de imagen (mínimo 3)
   */
  registrarRostroDocente(docenteId: number, imageFiles: File[]): Observable<ApiResponse<any>> {
    const formData = new FormData();
    imageFiles.forEach((file, index) => {
      formData.append('images', file);
    });

    return this.http.post<ApiResponse<any>>(
      `${environment.apiUrl}/docentes/${docenteId}/rostro`,
      formData
    );
  }

  /**
   * Obtiene los descriptores faciales de un docente
   * @param docenteId ID del docente
   */
  obtenerDescriptoresDocente(docenteId: number): Observable<ApiResponse<{ docente_id: number; count: number; descriptors: string[] }>> {
    return this.http.get<ApiResponse<{ docente_id: number; count: number; descriptors: string[] }>>(
      `${environment.apiUrl}/docentes/${docenteId}/rostro`
    );
  }

  /**
   * Elimina un descriptor facial específico
   * @param docenteId ID del docente
   * @param index Índice del descriptor a eliminar
   */
  eliminarDescriptorDocente(docenteId: number, index: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${environment.apiUrl}/docentes/${docenteId}/rostro/${index}`
    );
  }

  /**
   * Elimina todos los descriptores faciales de un docente
   * @param docenteId ID del docente
   */
  limpiarDescriptoresDocente(docenteId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${environment.apiUrl}/docentes/${docenteId}/rostro`
    );
  }
}
