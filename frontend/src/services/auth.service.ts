import api, { ApiResponse } from './api';

export type Rol = 'TITULAR' | 'ALBACEA' | 'ADMIN';
export type ModoApp = 'TITULAR' | 'ALBACEA' | 'ADMIN';

export interface Usuario {
  id: number;
  rut?: string | null;
  nombre: string;
  correo?: string;
  correo_verificado?: boolean;
  correo_alternativo?: string | null;
  correo_alternativo_verificado?: boolean;
  nombre_contacto_confianza?: string | null;
  correo_contacto_confianza?: string | null;
  frecuencia_checkin_dias?: number;
  plazo_gracia_dias?: number;
  notificar_recordatorios?: boolean;
  rol: Rol;
  boveda_activa?: boolean;
  terminos_aceptados_en?: string | null;
  avatar_url?: string | null;
  requiere_rut?: boolean;
  tiene_password?: boolean;
  es_albacea?: boolean;
  designaciones_pendientes?: number;
  designaciones_validadas?: number;
  total_designaciones?: number;
  total_polizas?: number;
  total_inventario?: number;
  total_albaceas?: number;
  total_mensajes?: number;
}

export interface PreferenciasPayload {
  frecuencia_checkin_dias: number;
  plazo_gracia_dias: number;
  correo_alternativo: string;
  nombre_contacto_confianza: string;
  correo_contacto_confianza: string;
  notificar_recordatorios: boolean;
}

export const AUTH_TOKEN_KEY = 'auth_token';

export const modoInicialUsuario = (usuario: Usuario): ModoApp => {
  if (usuario.rol === 'ADMIN') return 'ADMIN';
  if (usuario.boveda_activa === false && (usuario.total_designaciones || 0) > 0) {
    return 'ALBACEA';
  }
  return 'TITULAR';
};

export const rutaInicialUsuario = (usuario: Usuario): string => {
  const modo = modoInicialUsuario(usuario);
  if (modo === 'ADMIN') return '/admin?tab=resumen';
  if (modo === 'ALBACEA') return '/guia';
  return '/dashboard';
};

export const guardarSesion = (token: string, usuario: Usuario) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
  localStorage.setItem('user_rol', usuario.rol);
  localStorage.setItem('user_nombre', usuario.nombre || 'Usuario');
  localStorage.setItem('modo_activo', modoInicialUsuario(usuario));
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
  window.dispatchEvent(new Event('auth-updated'));
  return usuario;
};

export const actualizarPreferencias = async (payload: PreferenciasPayload) => {
  const res = await api.put<ApiResponse<Usuario>>('/auth/preferencias', payload);
  const actual = usuarioGuardado();
  if (actual && res.data.data) {
    const actualizado = { ...actual, ...res.data.data };
    localStorage.setItem('usuario', JSON.stringify(actualizado));
    window.dispatchEvent(new Event('auth-updated'));
    window.dispatchEvent(new Event('boveda-actualizada'));
  }
  return res.data;
};

export const activarBovedaPersonal = async (aceptaCondiciones: boolean) => {
  const res = await api.post<
    ApiResponse<{
      id: number;
      boveda_activa: boolean;
      terminos_aceptados_en: string;
      fecha_ultimo_checkin: string;
      frecuencia_checkin_dias: number;
      plazo_gracia_dias: number;
    }>
  >('/auth/activar-boveda', { acepta_condiciones: aceptaCondiciones });

  const actual = usuarioGuardado();
  if (actual && res.data.data) {
    const actualizado: Usuario = {
      ...actual,
      boveda_activa: Boolean(res.data.data.boveda_activa),
      terminos_aceptados_en: res.data.data.terminos_aceptados_en,
    };
    localStorage.setItem('usuario', JSON.stringify(actualizado));
    window.dispatchEvent(new Event('auth-updated'));
    window.dispatchEvent(new Event('boveda-actualizada'));
  }
  return res.data;
};

export const enviarVerificacionCorreo = async (tipo: 'PRINCIPAL' | 'ALTERNATIVO') => {
  const res = await api.post<ApiResponse<any>>('/auth/verificar-correo/enviar', { tipo });
  return res.data;
};

export const confirmarVerificacionCorreo = async (tipo: 'PRINCIPAL' | 'ALTERNATIVO', codigo: string) => {
  const res = await api.post<ApiResponse<any>>('/auth/verificar-correo/confirmar', { tipo, codigo });
  await obtenerPerfil().catch(() => {});
  return res.data;
};

export const confirmarVerificacionEnlace = async (
  correo: string,
  tipo: string,
  codigo: string
) => {
  const res = await api.get<ApiResponse<any>>('/auth/verificar-correo/enlace', {
    params: { correo, tipo, codigo },
  });
  return res.data;
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

// Google OAuth 2.0 (Authorization Code + state + PKCE)
export const obtenerUrlGoogle = async (): Promise<string> => {
  const res = await api.get<ApiResponse<{ url: string }>>('/auth/google/url');
  return res.data.data.url;
};

export const iniciarSesionConGoogle = async (code: string, state: string): Promise<Usuario> => {
  const res = await api.post<ApiResponse<{ token: string; usuario: Usuario }>>('/auth/google', {
    code,
    state,
  });
  const { token, usuario } = res.data.data;
  guardarSesion(token, usuario);
  return usuario;
};

export const completarRutUsuario = async (rut: string) => {
  const res = await api.put<ApiResponse<Usuario & { designaciones_vinculadas?: number }>>(
    '/auth/completar-rut',
    { rut }
  );
  const actual = usuarioGuardado();
  if (actual && res.data.data) {
    const actualizado: Usuario = {
      ...actual,
      rut: res.data.data.rut,
      requiere_rut: false,
    };
    localStorage.setItem('usuario', JSON.stringify(actualizado));
    window.dispatchEvent(new Event('auth-updated'));
    window.dispatchEvent(new Event('designaciones-actualizadas'));
  }
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
