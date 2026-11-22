import api, { ApiResponse } from './api';

export interface Poliza {
  id_poliza: number;
  tipo_seguro: string;
  aseguradora: string;
  numero_poliza: string;
  ubicacion_fisica: string;
  monto_referencial: string;
  tramitada: boolean;
  documento_nombre?: string | null;
  documento_mime?: string | null;
  tiene_documento?: boolean;
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

export const adjuntarDocumentoPoliza = async (idPoliza: number, archivo: File): Promise<Poliza> => {
  const form = new FormData();
  form.append('archivo', archivo);
  const res = await api.post<ApiResponse<Poliza>>(`/polizas/${idPoliza}/documento`, form, {
    timeout: 25000,
  });
  return res.data.data;
};

export const descargarDocumentoPoliza = async (
  idPoliza: number,
  nombrePorDefecto?: string | null
): Promise<void> => {
  const res = await api.get(`/polizas/${idPoliza}/documento`, {
    responseType: 'blob',
    timeout: 25000,
  });
  const contentType = String(res.headers?.['content-type'] || 'application/octet-stream');
  const disposicion = String(res.headers?.['content-disposition'] || '');
  const match = disposicion.match(/filename="?([^"]+)"?/i);
  const nombre = match?.[1] || nombrePorDefecto || `poliza-${idPoliza}`;

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

export const eliminarDocumentoPoliza = async (idPoliza: number): Promise<void> => {
  await api.delete(`/polizas/${idPoliza}/documento`);
};
