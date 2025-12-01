export interface Turno {
  id: number;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  descripcion?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface TurnoCreate {
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
}

export interface TurnoUpdate {
  nombre?: string;
  hora_inicio?: string;
  hora_fin?: string;
  activo?: boolean;
}
