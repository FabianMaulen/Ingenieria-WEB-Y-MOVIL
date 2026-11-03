import api from './api';

export interface Poliza {
  id_poliza: number;
  tipo_seguro: string;
  aseguradora: string;
  numero_poliza: string;
  ubicacion_fisica: string;
  monto_referencial: string; // El backend lo entrega como texto
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
export const obtenerPolizas = listarPolizas; // Alias de compatibilidad

export const crearPoliza = async (p: PolizaInput) => (await api.post<Poliza>('/polizas', p)).data;
export const agregarPoliza = crearPoliza; // Alias de compatibilidad

export const actualizarPoliza = async (id: number, p: PolizaInput) =>
  (await api.put<Poliza>(`/polizas/${id}`, p)).data;

export const eliminarPoliza = async (id: number) => { 
  await api.delete(`/polizas/${id}`); 
};