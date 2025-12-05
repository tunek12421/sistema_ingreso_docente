import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Turno, TurnoCreate, TurnoUpdate } from '../../shared/models';
import { ApiResponse } from '../../shared/models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TurnoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/turnos`;

  getAll(): Observable<ApiResponse<Turno[]>> {
    return this.http.get<ApiResponse<Turno[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<Turno>> {
    return this.http.get<ApiResponse<Turno>>(`${this.apiUrl}/${id}`);
  }

  getTurnoActual(): Observable<ApiResponse<Turno>> {
    return this.http.get<ApiResponse<Turno>>(`${this.apiUrl}/actual`);
  }

  create(turno: TurnoCreate): Observable<ApiResponse<Turno>> {
    return this.http.post<ApiResponse<Turno>>(this.apiUrl, turno);
  }

  update(id: number, turno: TurnoUpdate): Observable<ApiResponse<Turno>> {
    return this.http.put<ApiResponse<Turno>>(`${this.apiUrl}/${id}`, turno);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
