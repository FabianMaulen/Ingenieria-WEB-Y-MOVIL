import api, { ApiResponse } from './api';

export interface Contacto {
  telefono?: string;
  web?: string;
  correo?: string;
}

export interface PolizaGuia {
  id_poliza: number;
  tipo_seguro: string;
  aseguradora: string;
  numero_poliza: string;
  ubicacion_fisica: string;
  monto_referencial: string;
  tramitada: boolean;
  documento_nombre?: string | null;
  tiene_documento?: boolean;
  id_titular: number;
  nombre_titular: string;
  contacto: Contacto | null;
}

export interface InventarioGuia {
  id_inventario: number;
  plataforma: string;
  instruccion: string;
  categoria: string;
  fecha_creacion: string;
  id_titular: number;
  nombre_titular: string;
}

export interface MensajeGuia {
  id_mensaje: number;
  fecha_creacion: string;
  id_titular: number;
  nombre_titular: string;
  contenido: string;
  tiene_archivo?: boolean;
  archivo_nombre?: string | null;
}

export interface TitularLiberado {
  id_titular: number;
  nombre_titular: string;
  rut_titular: string;
}

export interface Guia {
  titulares_liberados: TitularLiberado[];
  polizas: PolizaGuia[];
  inventario: InventarioGuia[];
  mensajes: MensajeGuia[];
  cartas_otros_por_titular: Record<number, number>;
  resumen: { total: number; tramitadas: number };
  mensaje?: string;
}

export type EstadoDesignacion = 'PENDIENTE' | 'VALIDADO' | 'RECHAZADO' | 'INVITADO';

export interface DesignacionAlbacea {
  id_directorio: number;
  id_titular: number;
  nombre_titular: string;
  rut_titular: string;
  correo_titular?: string;
  parentesco: string;
  estado_validacion: EstadoDesignacion;
  fecha_designacion: string;
  boveda_liberada?: boolean;
  apertura_en_curso?: boolean;
}

export const obtenerGuia = async (): Promise<Guia> => {
  const res = await api.get<
    ApiResponse<{
      titulares_liberados?: TitularLiberado[];
      polizas: PolizaGuia[];
      inventario?: InventarioGuia[];
      mensajes?: MensajeGuia[];
      cartas_otros_por_titular?: Record<number, number>;
      resumen: { total: number; tramitadas: number };
    }>
  >('/guia');
  return {
    titulares_liberados: res.data.data?.titulares_liberados || [],
    polizas: res.data.data?.polizas || [],
    inventario: res.data.data?.inventario || [],
    mensajes: res.data.data?.mensajes || [],
    cartas_otros_por_titular: res.data.data?.cartas_otros_por_titular || {},
    resumen: res.data.data?.resumen || { total: 0, tramitadas: 0 },
    mensaje: res.data.mensaje,
  };
};

export const marcarTramitada = async (id: number, tramitada: boolean) => {
  const res = await api.put<ApiResponse<any>>(`/guia/polizas/${id}/tramitada`, { tramitada });
  return res.data.data;
};

export const obtenerDesignaciones = async (): Promise<DesignacionAlbacea[]> => {
  const res = await api.get<ApiResponse<DesignacionAlbacea[]>>('/guia/designaciones');
  return res.data.data || [];
};

export const responderDesignacion = async (idDirectorio: number, estado: 'VALIDADO' | 'RECHAZADO') => {
  const res = await api.put<ApiResponse<any>>(`/guia/designaciones/${idDirectorio}/responder`, { estado });
  window.dispatchEvent(new Event('designaciones-actualizadas'));
  return res.data;
};
