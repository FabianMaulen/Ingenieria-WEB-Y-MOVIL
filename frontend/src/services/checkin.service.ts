import api, { ApiResponse } from './api';

export interface EstadoCheckin {
  fecha_ultimo_checkin: string;
  boveda_activa?: boolean;
  frecuencia_checkin_dias?: number;
  plazo_gracia_dias?: number;
  dias_desde_ultimo: number;
  dias_restantes?: number;
}

export const obtenerCheckin = async (): Promise<EstadoCheckin> => {
  const res = await api.get<ApiResponse<EstadoCheckin>>('/checkin');
  return res.data.data;
};

// RF-04: Confirmar presencia en la bóveda (POST /api/checkin)
export const renovarCheckin = async () => {
  const res = await api.post<
    ApiResponse<{ fecha_checkin: string; frecuencia_checkin_dias?: number; solicitudes_canceladas: number }>
  >('/checkin');
  return res.data;
};
export const confirmarCheckin = renovarCheckin;
