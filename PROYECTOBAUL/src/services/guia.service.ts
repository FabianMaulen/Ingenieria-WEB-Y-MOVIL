import api from './api';

export interface Contacto { telefono?: string; web?: string; correo?: string; }

export interface PolizaGuia {
  id_poliza: number;
  tipo_seguro: string;
  aseguradora: string;
  numero_poliza: string;
  ubicacion_fisica: string;
  monto_referencial: string;
  tramitada: boolean;
  id_titular: number;
  nombre_titular: string;
  contacto: Contacto | null;
}

export interface Guia {
  polizas: PolizaGuia[];
  resumen: { total: number; tramitadas: number };
  mensaje?: string;
}

export const obtenerGuia = async () => (await api.get<Guia>('/guia')).data;
export const marcarTramitada = async (id: number, tramitada: boolean) =>
  (await api.put(`/guia/polizas/${id}/tramitada`, { tramitada })).data;
