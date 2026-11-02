import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// 1. Instancia base de Axios
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para enviar el token automáticamente si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Helper de errores para las páginas
export const mensajeError = (error: any): string => {
  if (error.response?.data?.mensaje) {
    return error.response.data.mensaje;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
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
  rol: string;
}

// 4. Funciones de autenticación y checkin
export const loginApi = async (credentials: { correo_usuario: string; password: string }) => {
  const response = await api.post('/auth/login', {
    correo_usuario: credentials.correo_usuario,
    password: credentials.password
  });
  return response.data;
};

export const registrarUsuarioApi = async (data: RegistroParams) => {
  const response = await api.post('/auth/register', {
    rut: data.rut,
    nombre_usuario: data.nombre_usuario,
    correo_usuario: data.correo_usuario,
    password: data.password,
    rol: data.rol
  });
  return response.data;
};

export const renovarCheckinApi = async () => {
  const response = await api.post('/checkin', {});
  return response.data;
};

// 5. Exportación por defecto
export default api;