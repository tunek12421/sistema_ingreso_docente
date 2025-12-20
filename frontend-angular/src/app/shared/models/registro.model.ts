export interface Registro {
  id: number;
  docente_id: number;
  docente_ci?: number | string;
  docente_nombre?: string;
  docente_nombre_completo?: string;
  llave_id: number;
  llave_codigo?: string;
  aula_codigo?: string;
  aula_nombre?: string;
  turno_id?: number;
  turno_nombre?: string;
  tipo: 'ingreso' | 'salida';
  fecha_hora: string;
  fecha?: string;
  hora_ingreso?: string;
  hora_salida?: string;
  minutos_retraso?: number;
  minutos_extra?: number;
  es_excepcional?: boolean;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RegistroIngresoRequest {
  docente_ci: string;
  llave_codigo: string;
  turno_id?: number;
  observaciones?: string;
}

export interface RegistroSalidaRequest {
  ci: number;
  turno_id?: number;
  llave_id?: number;
  observaciones?: string;
}

export interface RegistroUpdate {
  docente_id?: number;
  fecha_hora?: string;
  llave_id?: number;
  quitar_llave?: boolean;  // true = poner llave_id en NULL
  turno_id?: number;
  tipo?: 'ingreso' | 'salida';
  observaciones?: string;
  editado_por?: number;
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
