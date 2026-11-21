import api, { ApiResponse } from './api';

export type EstadoValidacionAlbacea = 'PENDIENTE' | 'VALIDADO' | 'RECHAZADO' | 'INVITADO';

export interface Albacea {
  id_directorio: number;
  nombre_usuario: string;
  rut: string;
  correo_usuario: string;
  parentesco: string;
  estado_validacion: EstadoValidacionAlbacea;
  fecha_designacion?: string;
  registrado?: boolean;
}

export interface NuevoAlbaceaInput {
  rut_invitado: string;
  nombre_albacea: string;
  email_albacea: string;
  parentesco: string;
}

// GET /api/albaceas -> Trae la lista de albaceas del titular
export const getAlbaceas = async (limit = 50, offset = 0): Promise<Albacea[]> => {
  const res = await api.get<ApiResponse<Albacea[]>>('/albaceas', { params: { limit, offset } });
  return res.data.data || [];
};

// POST /api/albaceas -> Designa albacea (registrado o invitado por RUT + nombre + email)
export const agregarAlbacea = async (datos: NuevoAlbaceaInput) => {
  const res = await api.post<ApiResponse<Albacea>>('/albaceas', datos);
  return res.data;
};

// DELETE /api/albaceas/:id -> Elimina el vínculo por id_directorio
export const eliminarAlbacea = async (id_directorio: number): Promise<void> => {
  await api.delete(`/albaceas/${id_directorio}`);
};
