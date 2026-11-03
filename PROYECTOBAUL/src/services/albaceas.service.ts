import api from './api';

export interface Albacea {
  id_directorio: number;
  nombre_usuario: string;
  rut: string;
  correo_usuario: string;
  parentesco: string;
  estado_validacion: string;
}

// GET /api/albaceas -> Trae la lista de albaceas del titular
export const getAlbaceas = async (): Promise<Albacea[]> => {
  return (await api.get<Albacea[]>('/albaceas')).data;
};

// POST /api/albaceas -> Registra albacea enviando { rut_invitado, parentesco }
export const agregarAlbacea = async (datos: { rut_invitado: string; parentesco: string }) => {
  return (await api.post('/albaceas', datos)).data;
};

// DELETE /api/albaceas/:id -> Elimina el vínculo por id_directorio
export const eliminarAlbacea = async (id_directorio: number) => {
  await api.delete(`/albaceas/${id_directorio}`);
};