export interface Registro {
  id: number;
  docente_id: number;
  docente_ci?: string;
  docente_nombre_completo?: string;
  llave_id: number;
  llave_codigo?: string;
  aula_codigo?: string;
  turno_id?: number;
  turno_nombre?: string;
  fecha: string;
  hora_ingreso: string;
  hora_salida?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface RegistroIngresoRequest {
  docente_ci: string;
  llave_codigo: string;
  turno_id?: number;
  observaciones?: string;
}

export interface RegistroSalidaRequest {
  llave_codigo: string;
  observaciones?: string;
}

export interface RegistroUpdate {
  hora_ingreso?: string;
  hora_salida?: string;
  observaciones?: string;
}

export interface LlaveActual {
  llave_id: number;
  llave_codigo: string;
  aula_codigo: string;
  docente_id: number;
  docente_ci: string;
  docente_nombre_completo: string;
  hora_ingreso: string;
}
