export type Rol = 'administrador' | 'jefe_carrera' | 'bibliotecario' | 'docente';

export interface Usuario {
  id: number;
  username: string;
  rol: Rol;
  nombre_completo?: string;
  email?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsuarioCreate {
  username: string;
  password: string;
  rol: Rol;
  nombre_completo?: string;
  email?: string;
}

export interface UsuarioUpdate {
  username?: string;
  password?: string;
  rol?: Rol;
  nombre_completo?: string;
  email?: string;
  activo?: boolean;
}

export interface ChangePasswordRequest {
  new_password: string;
}
