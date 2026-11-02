import api from './api';

export interface Poliza {
  id_poliza: number;
  tipo_seguro: string;
  aseguradora: string;
  numero_poliza: string;
  ubicacion_fisica: string;
  monto_referencial: string; // el backend lo entrega como texto: usar Number()
  tramitada: boolean;
}

export interface PolizaInput {
  tipo_seguro: string;
  aseguradora: string;
  numero_poliza: string;
  ubicacion_fisica: string;
  monto_referencial: number;
}

export const listarPolizas = async () => (await api.get<Poliza[]>('/polizas')).data;
export const crearPoliza = async (p: PolizaInput) => (await api.post<Poliza>('/polizas', p)).data;
export const actualizarPoliza = async (id: number, p: PolizaInput) =>
  (await api.put<Poliza>(`/polizas/${id}`, p)).data;
export const eliminarPoliza = async (id: number) => { await api.delete(`/polizas/${id}`); };
