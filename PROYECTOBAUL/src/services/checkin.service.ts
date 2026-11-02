import api from './api';

export interface EstadoCheckin { fecha_ultimo_checkin: string; dias_desde_ultimo: number; }

export const obtenerCheckin = async () => (await api.get<EstadoCheckin>('/checkin')).data;
export const confirmarCheckin = async () => (await api.put('/checkin')).data;
