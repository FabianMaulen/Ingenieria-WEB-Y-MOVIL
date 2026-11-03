import api from './api';

export interface EstadoCheckin { 
  fecha_ultimo_checkin: string; 
  dias_desde_ultimo: number; 
}

export const obtenerCheckin = async () => (await api.get<EstadoCheckin>('/checkin')).data;

// RF-04: Confirmar presencia en la bóveda (POST /api/checkin)
export const renovarCheckin = async () => (await api.post<{ mensaje: string; fecha_checkin: string }>('/checkin')).data;
export const confirmarCheckin = renovarCheckin;