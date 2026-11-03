import api from './api';

export type Rol = 'TITULAR' | 'ALBACEA' | 'ADMIN';
export interface Usuario { id: number; nombre: string; rol: Rol; }

export const login = async (correo_usuario: string, password: string): Promise<Usuario> => {
  const { data } = await api.post('/auth/login', { correo_usuario, password });
  localStorage.setItem('token', data.token);
  localStorage.setItem('usuario', JSON.stringify(data.usuario));
  return data.usuario;
};

export const registrar = async (datos: {
  rut: string; nombre_usuario: string; correo_usuario: string;
  password: string; rol: 'TITULAR' | 'ALBACEA';
}) => (await api.post('/auth/register', datos)).data;

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
};

export const usuarioGuardado = (): Usuario | null => {
  const raw = localStorage.getItem('usuario');
  return raw ? JSON.parse(raw) : null;
};
