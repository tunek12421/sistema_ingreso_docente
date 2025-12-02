import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Llave, LlaveCreate, LlaveUpdate } from '../../shared/models/llave.model';
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

  create(llave: LlaveCreate): Observable<ApiResponse<Llave>> {
    return this.http.post<ApiResponse<Llave>>(this.apiUrl, llave);
  }

  update(id: number, llave: LlaveUpdate): Observable<ApiResponse<Llave>> {
    return this.http.put<ApiResponse<Llave>>(`${this.apiUrl}/${id}`, llave);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
