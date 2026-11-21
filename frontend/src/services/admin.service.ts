import api, { ApiResponse } from './api';

export interface ResumenAdmin {
  usuarios: { total: number; admins: number };
  polizas: { total: number; monto_total: string };
  inventario: { total: number };
  albaceas: { total: number; validados: number; pendientes: number; invitados: number };
  mensajes: { total: number };
  solicitudes: { total: number; pendientes: number; aprobadas: number; canceladas: number };
  auditoria: { total: number };
  servicios: { smtp_activo: boolean; portal_registro_civil: string };
}

export interface UsuarioAdmin {
  id_usuario: number;
  rut: string;
  nombre_usuario: string;
  correo_usuario: string;
  rol: string;
  fecha_ultimo_checkin: string;
  total_polizas: number;
  total_albaceas: number;
  total_inventario: number;
}

export interface EventoAuditoria {
  id_evento: number;
  accion: string;
  fecha_hora: string;
  direccion_ip: string;
  nombre_usuario: string | null;
  correo_usuario: string | null;
  rut: string | null;
}

export interface SolicitudAdmin {
  id_solicitud: number;
  certificado_defuncion: string;
  hash_documento: string;
  estado_solicitud: 'PENDIENTE' | 'APROBADA' | 'CANCELADA';
  fecha_solicitud: string;
  nombre_titular: string;
  rut_titular: string;
  correo_titular: string;
  nombre_albacea: string;
  rut_albacea: string;
  parentesco: string;
}

export const obtenerResumenAdmin = async (): Promise<ResumenAdmin> => {
  const res = await api.get<ApiResponse<ResumenAdmin>>('/admin/resumen');
  return res.data.data;
};

export const listarUsuariosAdmin = async (limit = 50, offset = 0): Promise<UsuarioAdmin[]> => {
  const res = await api.get<ApiResponse<UsuarioAdmin[]>>('/admin/usuarios', { params: { limit, offset } });
  return res.data.data || [];
};

export const listarAuditoriaAdmin = async (limit = 50, offset = 0): Promise<EventoAuditoria[]> => {
  const res = await api.get<ApiResponse<EventoAuditoria[]>>('/admin/auditoria', { params: { limit, offset } });
  return res.data.data || [];
};

export const listarSolicitudesAdmin = async (): Promise<{
  solicitudes: SolicitudAdmin[];
  portalRegistroCivil: string;
}> => {
  const res = await api.get<ApiResponse<SolicitudAdmin[]>>('/admin/solicitudes');
  return {
    solicitudes: res.data.data || [],
    portalRegistroCivil:
      res.data.meta?.portal_registro_civil ||
      'https://www.registrocivil.cl/OficinaInternet/verificacion/verificacioncertificado.srcei',
  };
};

export const actualizarEstadoSolicitudAdmin = async (
  id: number,
  estado_solicitud: 'PENDIENTE' | 'APROBADA' | 'CANCELADA'
) => {
  const res = await api.put<ApiResponse<any>>(`/admin/solicitudes/${id}/estado`, { estado_solicitud });
  return res.data;
};
