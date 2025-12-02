export interface Docente {
  id: number;
  usuario_id?: number;
  documento_identidad: number;
  nombre_completo: string;
  correo: string;
  telefono?: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocenteCreate {
  documento_identidad: number;
  nombre_completo: string;
  correo: string;
  telefono?: number;
  activo?: boolean;
}

export interface DocenteUpdate {
  documento_identidad?: number;
  nombre_completo?: string;
  correo?: string;
  telefono?: number;
  activo?: boolean;
}
