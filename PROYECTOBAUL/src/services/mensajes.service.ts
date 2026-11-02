import api from './api';

export interface MensajeResumen {
  id_mensaje: number;
  fecha_creacion: string;
  rut_destinatario: string;
  nombre_destinatario: string | null;
}

// El backend nunca devuelve el contenido: los mensajes quedan sellados hasta la apertura.
export const listarMensajes = async () => (await api.get<MensajeResumen[]>('/mensajes')).data;
export const crearMensaje = async (rut_destinatario: string, contenido: string) =>
  (await api.post('/mensajes', { rut_destinatario, contenido })).data;
export const actualizarMensaje = async (id: number, contenido: string) =>
  (await api.put(`/mensajes/${id}`, { contenido })).data;
export const eliminarMensaje = async (id: number) => { await api.delete(`/mensajes/${id}`); };
