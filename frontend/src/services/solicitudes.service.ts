import api, { ApiResponse } from './api';

export type EstadoSolicitud = 'PENDIENTE' | 'CANCELADA' | 'APROBADA';

export interface SolicitudAlbacea {
  id_solicitud: number;
  estado_solicitud: EstadoSolicitud;
  fecha_solicitud: string;
  fecha_limite: string;
  plazo_gracia_horas?: number;
  nombre_titular: string;
  rut_titular?: string;
}

export interface Alerta {
  id_solicitud: number;
  origen?: 'ALBACEA' | 'FAMILIAR';
  estado_solicitud: EstadoSolicitud;
  fecha_solicitud: string;
  fecha_limite: string;
  plazo_gracia_horas?: number;
  horas_restantes?: number;
  puede_cancelar: boolean;
  nombre_albacea: string;
  rut_albacea: string;
  parentesco: string;
}

// RF-05: multipart/form-data. El interceptor en api.ts elimina Content-Type para que Axios fije el boundary.
export const solicitarApertura = async (rut_titular: string, certificado: File) => {
  const form = new FormData();
  form.append('rut_titular', rut_titular);
  form.append('certificado', certificado);
  const res = await api.post<ApiResponse<any>>('/solicitudes', form);
  return res.data;
};

export const crearSolicitud = solicitarApertura;

export const misSolicitudes = async (): Promise<SolicitudAlbacea[]> => {
  const res = await api.get<ApiResponse<SolicitudAlbacea[]>>('/solicitudes/mias');
  return res.data.data || [];
};

// RF-06: Alertas unificadas (albaceas + familiares externos)
export const listarAlertas = async (): Promise<Alerta[]> => {
  const res = await api.get<ApiResponse<Alerta[]>>('/solicitudes/alertas');
  return res.data.data || [];
};

export const cancelarSolicitud = async (id: number) => {
  const res = await api.put<ApiResponse<any>>(`/solicitudes/${id}/cancelar`);
  return res.data;
};

export const cancelarReporteFamiliar = async (id: number) => {
  const res = await api.put<ApiResponse<any>>(`/solicitudes/reportes-familiares/${id}/cancelar`);
  return res.data;
};
