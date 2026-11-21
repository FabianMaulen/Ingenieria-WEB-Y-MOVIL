import axios from 'axios';

export interface ApiResponse<T> {
  mensaje: string;
  data: T;
  meta?: Record<string, any>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// 1. Instancia base de Axios con baseURL desde entorno y timeout de seguridad
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de solicitud: adjunta Bearer token y respeta multipart/form-data
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Interceptor de respuesta: captura 401 (sesión inválida/expirada), limpia localStorage y redirige a /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl: string = error?.config?.url || '';
    const esRutaCredenciales =
      requestUrl.includes('/auth/login') || requestUrl.includes('/auth/change-password');

    if (status === 401 && !esRutaCredenciales) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('user_rol');
      localStorage.removeItem('user_nombre');
      localStorage.removeItem('modo_activo');

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

// 2. Helper de errores para las páginas
export const mensajeError = (error: any): string => {
  if (error?.response?.data?.mensaje) {
    return error.response.data.mensaje;
  }
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.code === 'ECONNABORTED') {
    return 'Tiempo de espera agotado al conectar con el servidor.';
  }
  if (error?.message) {
    return error.message;
  }
  return 'Ocurrió un error inesperado al procesar la solicitud.';
};

// 3. Tipos e interfaces
export interface RegistroParams {
  rut: string;
  nombre_usuario: string;
  correo_usuario: string;
  password: string;
  rol?: string;
}

// 4. Funciones de autenticación y checkin (desenvuelven la estructura unificada { mensaje, data })
export const loginApi = async (credentials: { correo_usuario: string; password: string }) => {
  const response = await api.post<ApiResponse<{ token: string; usuario: any }>>('/auth/login', {
    correo_usuario: credentials.correo_usuario,
    password: credentials.password,
  });
  return response.data.data;
};

export const registrarUsuarioApi = async (data: RegistroParams) => {
  const response = await api.post<ApiResponse<any>>('/auth/register', {
    rut: data.rut,
    nombre_usuario: data.nombre_usuario,
    correo_usuario: data.correo_usuario,
    password: data.password,
  });
  return response.data;
};

export const renovarCheckinApi = async () => {
  const response = await api.post<ApiResponse<{ fecha_checkin: string; solicitudes_canceladas: number }>>(
    '/checkin',
    {}
  );
  return response.data;
};

// 5. Exportación por defecto
export default api;
