export type EstadoLlave = 'disponible' | 'en_uso' | 'extraviada' | 'inactiva';

export interface Llave {
  id: number;
  codigo: string;
  aula_codigo: string;
  aula_nombre: string;
  estado: EstadoLlave;
  descripcion?: string;
  created_at: string;
  updated_at: string;
}

export interface LlaveCreate {
  codigo: string;
  aula_codigo: string;
  aula_nombre: string;
  estado: EstadoLlave;
  descripcion?: string;
}

export interface LlaveUpdate {
  codigo?: string;
  aula_codigo?: string;
  aula_nombre?: string;
  estado?: EstadoLlave;
  descripcion?: string;
}

export const ESTADOS_LLAVE: { value: EstadoLlave; label: string; color: string }[] = [
  { value: 'disponible', label: 'Disponible', color: 'green' },
  { value: 'en_uso', label: 'En Uso', color: 'blue' },
  { value: 'extraviada', label: 'Extraviada', color: 'red' },
  { value: 'inactiva', label: 'Inactiva', color: 'gray' }
];
