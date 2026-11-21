import api, { ApiResponse } from './api';

export type Rol = 'TITULAR' | 'ALBACEA' | 'ADMIN';
export type ModoApp = 'TITULAR' | 'ALBACEA';

export interface Usuario {
  id: number;
  rut?: string;
  nombre: string;
  correo?: string;
  rol: Rol;
  es_albacea?: boolean;
  designaciones_pendientes?: number;
  designaciones_validadas?: number;
  total_designaciones?: number;
}

export const AUTH_TOKEN_KEY = 'auth_token';

export const guardarSesion = (token: string, usuario: Usuario) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
  localStorage.setItem('user_rol', usuario.rol);
  localStorage.setItem('user_nombre', usuario.nombre || 'Usuario');
  if (!localStorage.getItem('modo_activo')) {
    localStorage.setItem('modo_activo', 'TITULAR');
  }
  window.dispatchEvent(new Event('auth-updated'));
};

export const login = async (correo_usuario: string, password: string): Promise<Usuario> => {
  const res = await api.post<ApiResponse<{ token: string; usuario: Usuario }>>('/auth/login', {
    correo_usuario,
    password,
  });
  const { token, usuario } = res.data.data;
  guardarSesion(token, usuario);
  return usuario;
};

export const registrar = async (datos: {
  rut: string;
  nombre_usuario: string;
  correo_usuario: string;
  password: string;
}) => {
  const res = await api.post<ApiResponse<any>>('/auth/register', datos);
  return res.data;
};

export const obtenerPerfil = async (): Promise<Usuario> => {
  const res = await api.get<ApiResponse<Usuario>>('/auth/perfil');
  const usuario = res.data.data;
  localStorage.setItem('usuario', JSON.stringify(usuario));
  localStorage.setItem('user_nombre', usuario.nombre || 'Usuario');
  localStorage.setItem('user_rol', usuario.rol);
  return usuario;
};

export const cambiarPassword = async (passwordActual: string, nuevaPassword: string) => {
  const res = await api.put<ApiResponse<null>>('/auth/change-password', {
    passwordActual,
    nuevaPassword,
  });
  return res.data;
};

export const solicitarRecuperacion = async (correo_usuario: string) => {
  const res = await api.post<ApiResponse<null>>('/auth/forgot-password', { correo_usuario });
  return res.data;
};

export const restablecerPassword = async (
  correo_usuario: string,
  codigo: string,
  nuevaPassword: string
) => {
  const res = await api.post<ApiResponse<null>>('/auth/reset-password', {
    correo_usuario,
    codigo,
    nuevaPassword,
  });
  return res.data;
};

export const logout = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('user_rol');
  localStorage.removeItem('user_nombre');
  localStorage.removeItem('modo_activo');
  window.dispatchEvent(new Event('auth-updated'));
};

export const obtenerToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const usuarioGuardado = (): Usuario | null => {
  const raw = localStorage.getItem('usuario');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
};
