import api, { ApiResponse } from './api';

export interface Poliza {
  id_poliza: number;
  tipo_seguro: string;
  aseguradora: string;
  numero_poliza: string;
  ubicacion_fisica: string;
  monto_referencial: string;
  tramitada: boolean;
}

export interface PolizaInput {
  tipo_seguro: string;
  aseguradora: string;
  numero_poliza: string;
  ubicacion_fisica: string;
  monto_referencial: number;
}

export const listarPolizas = async (limit = 50, offset = 0): Promise<Poliza[]> => {
  const res = await api.get<ApiResponse<Poliza[]>>('/polizas', { params: { limit, offset } });
  return res.data.data || [];
};
export const obtenerPolizas = listarPolizas;

export const crearPoliza = async (p: PolizaInput): Promise<Poliza> => {
  const res = await api.post<ApiResponse<Poliza>>('/polizas', p);
  window.dispatchEvent(new Event('boveda-actualizada'));
  return res.data.data;
};
export const agregarPoliza = crearPoliza;

export const actualizarPoliza = async (id: number, p: PolizaInput): Promise<Poliza> => {
  const res = await api.put<ApiResponse<Poliza>>(`/polizas/${id}`, p);
  return res.data.data;
};

export const eliminarPoliza = async (id: number): Promise<void> => {
  await api.delete(`/polizas/${id}`);
  window.dispatchEvent(new Event('boveda-actualizada'));
};

export interface PolizaExtraidaIA {
  tipo_seguro: string;
  aseguradora: string;
  numero_poliza: string;
  monto_referencial: number;
  moneda_detectada?: string;
  observaciones?: string;
}

export const extraerPolizaConIA = async (archivo: File): Promise<PolizaExtraidaIA> => {
  const form = new FormData();
  form.append('archivo', archivo);
  const res = await api.post<ApiResponse<PolizaExtraidaIA>>('/polizas/extraer', form, {
    timeout: 30000,
  });
  return res.data.data;
};
