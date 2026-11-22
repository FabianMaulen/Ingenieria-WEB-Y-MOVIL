import api, { ApiResponse } from './api';

export interface ResumenAdmin {
  usuarios: { total: number; admins: number; suspendidos?: number };
  polizas: { total: number; monto_total: string };
  inventario: { total: number };
  albaceas: { total: number; validados: number; pendientes: number; invitados: number };
  mensajes: { total: number };
  solicitudes: { total: number; pendientes: number; aprobadas: number; canceladas: number };
  reportes_familiares?: { total: number; activos: number };
  tickets?: { total: number; abiertos: number };
  auditoria: { total: number };
  servicios: { smtp_activo: boolean; portal_registro_civil: string };
}

export interface UsuarioAdmin {
  id_usuario: number;
  rut: string | null;
  nombre_usuario: string;
  correo_usuario: string;
  rol: string;
  activo: boolean;
  fecha_ultimo_checkin: string;
  frecuencia_checkin_dias: number;
  plazo_gracia_dias: number;
  correo_verificado: boolean;
  correo_alternativo: string | null;
  correo_alternativo_verificado: boolean;
  nombre_contacto_confianza: string | null;
  correo_contacto_confianza: string | null;
  total_polizas: number;
  total_albaceas: number;
  total_inventario: number;
  total_mensajes: number;
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
  plazo_gracia_horas: number;
  horas_restantes: number;
  ultimo_aviso_etapa: string | null;
  nombre_titular: string;
  rut_titular: string;
  correo_titular: string;
  nombre_albacea: string;
  rut_albacea: string;
  parentesco: string;
  tickets_abiertos?: number;
  ultimo_ticket_codigo?: string | null;
  ultimo_ticket_mensaje?: string | null;
}

export interface ReporteFamiliarAdmin {
  id_reporte: number;
  rut_titular_consultado: string;
  nombre_titular: string | null;
  nombre_familiar: string;
  rut_familiar: string;
  correo_familiar: string;
  parentesco: string;
  certificado_archivo: string;
  hash_documento: string;
  folio_extraido: string | null;
  estado_reporte: 'RECIBIDO' | 'EN_REVISION' | 'VALIDADO' | 'RECHAZADO' | 'CANCELADO_TITULAR';
  plazo_gracia_horas: number;
  horas_restantes: number;
  ultimo_aviso_etapa: string | null;
  fecha_reporte: string;
  tickets_abiertos?: number;
  ultimo_ticket_codigo?: string | null;
  ultimo_ticket_mensaje?: string | null;
}

export interface TicketSoporteAdmin {
  id_ticket: number;
  codigo_ticket: string;
  categoria: string;
  mensaje: string;
  estado_ticket: 'ABIERTO' | 'EN_PROCESO' | 'RESUELTO' | 'CERRADO';
  respuesta_admin: string | null;
  id_solicitud_asociada: number | null;
  id_reporte_asociado: number | null;
  estado_solicitud_asociada: string | null;
  estado_reporte_asociado: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  id_usuario: number;
  nombre_usuario: string;
  correo_usuario: string;
  rut: string | null;
}

export interface ResultadoVigilancia {
  solicitudes_aprobadas: number;
  reportes_validados: number;
  reintentos_enviados: number;
  avisos_48h_enviados: number;
  recordatorios_checkin: number;
  triggers_vencimiento_checkin: number;
}

export const obtenerResumenAdmin = async (): Promise<ResumenAdmin> => {
  const res = await api.get<ApiResponse<ResumenAdmin>>('/admin/resumen');
  return res.data.data;
};

export const listarUsuariosAdmin = async (limit = 100, offset = 0): Promise<UsuarioAdmin[]> => {
  const res = await api.get<ApiResponse<UsuarioAdmin[]>>('/admin/usuarios', { params: { limit, offset } });
  return res.data.data || [];
};

export interface EditarUsuarioAdminPayload {
  nombre_usuario?: string;
  correo_usuario?: string;
  rut?: string;
  rol?: 'TITULAR' | 'ADMIN';
  activo?: boolean;
  frecuencia_checkin_dias?: number;
  plazo_gracia_dias?: number;
  correo_alternativo?: string;
  nombre_contacto_confianza?: string;
  correo_contacto_confianza?: string;
}

export const actualizarUsuarioAdmin = async (
  id: number,
  cambios: EditarUsuarioAdminPayload
) => {
  const res = await api.put<ApiResponse<any>>(`/admin/usuarios/${id}`, cambios);
  return res.data;
};

export const eliminarUsuarioAdmin = async (id: number) => {
  const res = await api.delete<ApiResponse<any>>(`/admin/usuarios/${id}`);
  return res.data;
};

export const listarAuditoriaAdmin = async (limit = 60, offset = 0): Promise<EventoAuditoria[]> => {
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

export const listarReportesFamiliaresAdmin = async (): Promise<ReporteFamiliarAdmin[]> => {
  const res = await api.get<ApiResponse<ReporteFamiliarAdmin[]>>('/admin/reportes-familiares');
  return res.data.data || [];
};

export const actualizarEstadoReporteFamiliarAdmin = async (
  id: number,
  estado_reporte: 'RECIBIDO' | 'EN_REVISION' | 'VALIDADO' | 'RECHAZADO' | 'CANCELADO_TITULAR'
) => {
  const res = await api.put<ApiResponse<any>>(`/admin/reportes-familiares/${id}/estado`, {
    estado_reporte,
  });
  return res.data;
};

export const abrirCertificadoAdmin = async (tipo: 'solicitud' | 'reporte', id: number) => {
  const res = await api.get(`/admin/archivos/${tipo}/${id}`, { responseType: 'blob' });
  const blobUrl = URL.createObjectURL(res.data);
  window.open(blobUrl, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
};

export const ejecutarVigilanciaAdmin = async (): Promise<ResultadoVigilancia> => {
  const res = await api.post<ApiResponse<ResultadoVigilancia>>('/admin/vigilancia/ejecutar');
  return res.data.data;
};

export const listarTicketsAdmin = async (): Promise<TicketSoporteAdmin[]> => {
  const res = await api.get<ApiResponse<TicketSoporteAdmin[]>>('/admin/tickets');
  return res.data.data || [];
};

export const gestionarTicketAdmin = async (
  id: number,
  payload: {
    estado_ticket?: 'ABIERTO' | 'EN_PROCESO' | 'RESUELTO' | 'CERRADO';
    respuesta_admin?: string;
    accion_directa?: 'REVERTIR_APERTURA';
  }
) => {
  const res = await api.put<ApiResponse<any>>(`/admin/tickets/${id}`, payload);
  return res.data;
};
