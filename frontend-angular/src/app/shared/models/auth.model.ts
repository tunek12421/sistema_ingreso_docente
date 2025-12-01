import { Rol } from './usuario.model';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    rol: Rol;
    nombre_completo?: string;
  };
}

export interface AuthUser {
  id: number;
  username: string;
  rol: Rol;
  nombre_completo?: string;
}
