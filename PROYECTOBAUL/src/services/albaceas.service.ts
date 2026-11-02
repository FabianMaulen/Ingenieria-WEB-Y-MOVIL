import api from './api';

export interface Albacea {
  id_directorio: number;
  nombre_usuario: string;
  rut: string;
  correo_usuario: string;
  parentesco: string;
  estado_validacion: string;
}

export const listarAlbaceas = async () => (await api.get<Albacea[]>('/albaceas')).data;
export const getAlbaceas = listarAlbaceas;
export const agregarAlbacea = async (rut_invitado: string, parentesco: string) =>
  (await api.post('/albaceas', { rut_invitado, parentesco })).data;
export const eliminarAlbacea = async (id: number) => { await api.delete(`/albaceas/${id}`); };
