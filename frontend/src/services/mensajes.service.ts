import api, { ApiResponse } from './api';

export interface MensajeResumen {
  id_mensaje: number;
  fecha_creacion: string;
  rut_destinatario: string | null;
  nombre_destinatario: string | null;
  correo_destinatario?: string | null;
  es_externo?: boolean;
  enviado_por_correo?: boolean;
}

export interface CrearMensajePayload {
  tipo_destinatario: 'ALBACEA' | 'EXTERNO';
  rut_destinatario?: string;
  nombre_destinatario?: string;
  correo_destinatario?: string;
  contenido: string;
}

// El backend nunca devuelve el contenido: los mensajes quedan sellados hasta la apertura.
export const listarMensajes = async (limit = 50, offset = 0): Promise<MensajeResumen[]> => {
  const res = await api.get<ApiResponse<MensajeResumen[]>>('/mensajes', { params: { limit, offset } });
  return res.data.data || [];
};
export const getMensajes = listarMensajes;

export const crearMensaje = async (payload: CrearMensajePayload) => {
  const res = await api.post<ApiResponse<MensajeResumen>>('/mensajes', payload);
  return res.data;
};

export const actualizarMensaje = async (id: number, contenido: string) => {
  const res = await api.put<ApiResponse<MensajeResumen>>(`/mensajes/${id}`, { contenido });
  return res.data;
};

export const eliminarMensaje = async (id: number): Promise<void> => {
  await api.delete(`/mensajes/${id}`);
};
