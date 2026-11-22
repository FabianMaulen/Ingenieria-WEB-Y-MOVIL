import api, { ApiResponse } from './api';

export interface TicketSoporte {
  id_ticket: number;
  codigo_ticket: string;
  categoria: string;
  mensaje: string;
  estado_ticket: 'ABIERTO' | 'EN_PROCESO' | 'RESUELTO' | 'CERRADO';
  respuesta_admin: string | null;
  id_solicitud_asociada: number | null;
  id_reporte_asociado: number | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export const enviarMensajeSoporte = async (
  categoria: string,
  mensaje: string,
  opciones?: { id_solicitud_asociada?: number | null; id_reporte_asociado?: number | null }
) => {
  const res = await api.post<ApiResponse<TicketSoporte>>('/soporte/contacto', {
    categoria,
    mensaje,
    id_solicitud_asociada: opciones?.id_solicitud_asociada || null,
    id_reporte_asociado: opciones?.id_reporte_asociado || null,
  });
  return res.data;
};

export const misTicketsSoporte = async (): Promise<TicketSoporte[]> => {
  const res = await api.get<ApiResponse<TicketSoporte[]>>('/soporte/mis-tickets');
  return res.data.data || [];
};
