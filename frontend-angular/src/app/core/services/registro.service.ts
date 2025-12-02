import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Registro, RegistroIngresoRequest, RegistroSalidaRequest, RegistroUpdate, LlaveActual } from '../../shared/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegistroService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/registros`;

  getRegistrosHoy(): Observable<Registro[]> {
    return this.http.get<Registro[]>(`${this.apiUrl}/hoy`);
  }

  getByFecha(fecha?: string): Observable<Registro[]> {
    let params = new HttpParams();
    if (fecha) {
      params = params.set('fecha', fecha);
    }
    return this.http.get<Registro[]>(this.apiUrl, { params });
  }

  getLlaveActual(): Observable<LlaveActual[]> {
    return this.http.get<LlaveActual[]>(`${this.apiUrl}/llave-actual`);
  }

  registrarIngreso(request: RegistroIngresoRequest): Observable<Registro> {
    return this.http.post<Registro>(`${this.apiUrl}/ingreso`, request);
  }

  registrarEntrada(request: { docente_id: number; llave_id: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ingreso`, request);
  }

  registrarSalida(request: RegistroSalidaRequest): Observable<Registro> {
    return this.http.post<Registro>(`${this.apiUrl}/salida`, request);
  }

  update(id: number, registro: RegistroUpdate): Observable<Registro> {
    return this.http.put<Registro>(`${this.apiUrl}/${id}`, registro);
  }
}
