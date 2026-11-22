import api, { ApiResponse } from './api';

export interface MensajeResumen {
  id_mensaje: number;
  fecha_creacion: string;
  rut_destinatario: string | null;
  nombre_destinatario: string | null;
  correo_destinatario?: string | null;
  es_externo?: boolean;
  enviado_por_correo?: boolean;
  archivo_nombre?: string | null;
  archivo_mime?: string | null;
  tiene_archivo?: boolean;
}

export interface CrearMensajePayload {
  tipo_destinatario: 'ALBACEA' | 'EXTERNO';
  rut_destinatario?: string;
  nombre_destinatario?: string;
  correo_destinatario?: string;
  contenido: string;
  archivo?: File | null;
}

// El backend nunca devuelve el contenido: los mensajes y archivos quedan sellados hasta la apertura.
export const listarMensajes = async (limit = 50, offset = 0): Promise<MensajeResumen[]> => {
  const res = await api.get<ApiResponse<MensajeResumen[]>>('/mensajes', { params: { limit, offset } });
  return res.data.data || [];
};
export const getMensajes = listarMensajes;

export const crearMensaje = async (payload: CrearMensajePayload) => {
  let res;
  if (payload.archivo) {
    const form = new FormData();
    form.append('tipo_destinatario', payload.tipo_destinatario);
    if (payload.rut_destinatario) form.append('rut_destinatario', payload.rut_destinatario);
    if (payload.nombre_destinatario) form.append('nombre_destinatario', payload.nombre_destinatario);
    if (payload.correo_destinatario) form.append('correo_destinatario', payload.correo_destinatario);
    form.append('contenido', payload.contenido || '');
    form.append('archivo', payload.archivo);
    res = await api.post<ApiResponse<MensajeResumen>>('/mensajes', form, { timeout: 25000 });
  } else {
    res = await api.post<ApiResponse<MensajeResumen>>('/mensajes', payload);
  }
  window.dispatchEvent(new Event('boveda-actualizada'));
  return res.data;
};

export const descargarAdjuntoMensaje = async (
  idMensaje: number,
  nombrePorDefecto?: string | null
): Promise<void> => {
  const res = await api.get(`/mensajes/${idMensaje}/adjunto`, {
    responseType: 'blob',
    timeout: 25000,
  });
  const contentType = String(res.headers?.['content-type'] || 'application/octet-stream');
  const disposicion = String(res.headers?.['content-disposition'] || '');
  const match = disposicion.match(/filename="?([^"]+)"?/i);
  const nombre = match?.[1] || nombrePorDefecto || `adjunto-carta-${idMensaje}`;

  const blob = new Blob([res.data], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombre;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const actualizarMensaje = async (id: number, contenido: string) => {
  const res = await api.put<ApiResponse<MensajeResumen>>(`/mensajes/${id}`, { contenido });
  return res.data;
};

export const eliminarMensaje = async (id: number): Promise<void> => {
  await api.delete(`/mensajes/${id}`);
  window.dispatchEvent(new Event('boveda-actualizada'));
};
