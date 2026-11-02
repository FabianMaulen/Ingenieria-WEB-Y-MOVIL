import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export interface RegistroParams {
  rut: string;
  nombre_usuario: string;
  contrasena?: string;
  contrasena_hash?: string;
  correo_usuario?: string;
}

export const loginApi = async (credentials: { identifier: string; password?: string; contrasena?: string }) => {
  const response = await axios.post(`${API_URL}/login`, {
    rut: credentials.identifier,
    contrasena: credentials.password || credentials.contrasena
  });
  return response.data;
};

export const registrarUsuarioApi = async (data: RegistroParams) => {
  const response = await axios.post(`${API_URL}/registro`, {
    rut: data.rut,
    nombre_usuario: data.nombre_usuario,
    contrasena: data.contrasena || data.contrasena_hash
  });
  return response.data;
};

export const renovarCheckinApi = async () => {
  const token = localStorage.getItem('auth_token');
  const response = await axios.post(
    `${API_URL}/checkin`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};