import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Docente, DocenteCreate, DocenteUpdate } from '../../shared/models';
import { ApiResponse } from '../../shared/models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocenteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/docentes`;

  getAll(): Observable<ApiResponse<Docente[]>> {
    return this.http.get<ApiResponse<Docente[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<Docente>> {
    return this.http.get<ApiResponse<Docente>>(`${this.apiUrl}/${id}`);
  }

  getByCI(ci: string): Observable<ApiResponse<Docente>> {
    return this.http.get<ApiResponse<Docente>>(`${this.apiUrl}/ci/${ci}`);
  }

  create(docente: DocenteCreate): Observable<ApiResponse<Docente>> {
    return this.http.post<ApiResponse<Docente>>(this.apiUrl, docente);
  }

  update(id: number, docente: DocenteUpdate): Observable<ApiResponse<Docente>> {
    return this.http.put<ApiResponse<Docente>>(`${this.apiUrl}/${id}`, docente);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
