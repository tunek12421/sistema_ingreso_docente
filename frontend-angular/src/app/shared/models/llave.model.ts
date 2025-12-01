export type EstadoLlave = 'disponible' | 'en_uso' | 'perdida' | 'mantenimiento';

export interface Llave {
  id: number;
  codigo_llave: string;
  aula_codigo: string;
  descripcion?: string;
  estado: EstadoLlave;
  created_at: string;
  updated_at: string;
}

export interface LlaveCreate {
  codigo_llave: string;
  aula_codigo: string;
  descripcion?: string;
}

export interface LlaveUpdate {
  codigo_llave?: string;
  aula_codigo?: string;
  descripcion?: string;
}

export interface LlaveEstadoUpdate {
  estado: EstadoLlave;
}
