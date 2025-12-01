import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Llave, LlaveCreate, LlaveUpdate, LlaveEstadoUpdate } from '../../shared/models';
import { ApiResponse } from '../../shared/models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LlaveService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/llaves`;

  getAll(): Observable<ApiResponse<Llave[]>> {
    return this.http.get<ApiResponse<Llave[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<Llave>> {
    return this.http.get<ApiResponse<Llave>>(`${this.apiUrl}/${id}`);
  }

  getByCodigo(codigo: string): Observable<ApiResponse<Llave>> {
    return this.http.get<ApiResponse<Llave>>(`${this.apiUrl}/codigo/${codigo}`);
  }

  getByAulaCodigo(aulaCodigo: string): Observable<ApiResponse<Llave[]>> {
    return this.http.get<ApiResponse<Llave[]>>(`${this.apiUrl}/aula/${aulaCodigo}`);
  }

  create(llave: LlaveCreate): Observable<ApiResponse<Llave>> {
    return this.http.post<ApiResponse<Llave>>(this.apiUrl, llave);
  }

  update(id: number, llave: LlaveUpdate): Observable<ApiResponse<Llave>> {
    return this.http.put<ApiResponse<Llave>>(`${this.apiUrl}/${id}`, llave);
  }

  updateEstado(id: number, estado: LlaveEstadoUpdate): Observable<ApiResponse<Llave>> {
    return this.http.patch<ApiResponse<Llave>>(`${this.apiUrl}/${id}/estado`, estado);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
