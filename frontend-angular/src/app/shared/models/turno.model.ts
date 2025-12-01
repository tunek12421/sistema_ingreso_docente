export interface Turno {
  id: number;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  dias_semana: string[];
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface TurnoCreate {
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  dias_semana: string[];
}

export interface TurnoUpdate {
  nombre?: string;
  hora_inicio?: string;
  hora_fin?: string;
  dias_semana?: string[];
  activo?: boolean;
}
