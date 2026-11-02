import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export interface RegistroParams {
  rut: string;
  nombre_usuario: string;
  correo_usuario: string;
  password: string;
  rol: string;
}

export const loginApi = async (credentials: { correo_usuario: string; password: string }) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    correo_usuario: credentials.correo_usuario,
    password: credentials.password
  });
  return response.data;
};

export const registrarUsuarioApi = async (data: RegistroParams) => {
  const response = await axios.post(`${API_BASE_URL}/auth/register`, {
    rut: data.rut,
    nombre_usuario: data.nombre_usuario,
    correo_usuario: data.correo_usuario,
    password: data.password,
    rol: data.rol
  });
  return response.data;
};

export const renovarCheckinApi = async () => {
  const token = localStorage.getItem('auth_token');
  const response = await axios.post(
    `${API_BASE_URL}/checkin`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};