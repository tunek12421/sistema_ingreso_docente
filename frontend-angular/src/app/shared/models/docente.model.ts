export interface Docente {
  id: number;
  ci: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocenteCreate {
  ci: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  email?: string;
}

export interface DocenteUpdate {
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
}
