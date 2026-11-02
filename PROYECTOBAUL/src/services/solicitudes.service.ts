import api from './api';

export type EstadoSolicitud = 'PENDIENTE' | 'CANCELADA' | 'APROBADA';

export interface SolicitudAlbacea {
  id_solicitud: number;
  estado_solicitud: EstadoSolicitud;
  fecha_solicitud: string;
  fecha_limite: string;
  nombre_titular: string;
}

export interface Alerta {
  id_solicitud: number;
  estado_solicitud: EstadoSolicitud;
  fecha_solicitud: string;
  fecha_limite: string;
  puede_cancelar: boolean;
  nombre_albacea: string;
  rut_albacea: string;
  parentesco: string;
}

// RF-05: multipart/form-data. No fijar Content-Type: Axios agrega el boundary.
export const solicitarApertura = async (rut_titular: string, certificado: File) => {
  const form = new FormData();
  form.append('rut_titular', rut_titular);
  form.append('certificado', certificado); // el campo debe llamarse "certificado"
  return (await api.post('/solicitudes', form)).data;
};

export const misSolicitudes = async () => (await api.get<SolicitudAlbacea[]>('/solicitudes/mias')).data;

// RF-06
export const listarAlertas = async () => (await api.get<Alerta[]>('/solicitudes/alertas')).data;
export const cancelarSolicitud = async (id: number) => (await api.put(`/solicitudes/${id}/cancelar`)).data;
