import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Docente, DocenteCreate, DocenteUpdate } from '../../shared/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocenteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/docentes`;

  getAll(): Observable<Docente[]> {
    return this.http.get<Docente[]>(this.apiUrl);
  }

  getById(id: number): Observable<Docente> {
    return this.http.get<Docente>(`${this.apiUrl}/${id}`);
  }

  getByCI(ci: number): Observable<Docente> {
    return this.http.get<Docente>(`${this.apiUrl}/ci/${ci}`);
  }

  create(docente: DocenteCreate): Observable<Docente> {
    return this.http.post<Docente>(this.apiUrl, docente);
  }

  update(id: number, docente: DocenteUpdate): Observable<Docente> {
    return this.http.put<Docente>(`${this.apiUrl}/${id}`, docente);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
