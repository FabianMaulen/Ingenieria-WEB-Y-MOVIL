const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { aprobarVencidas } = require('../utils/solicitudes');
const { parsearIdEntero, parsearPaginacion, obtenerIp } = require('../utils/validadores');
const { estaConfiguradoSmtp } = require('../services/email.service');

const URL_VERIFICACION_REGISTRO_CIVIL =
  'https://www.registrocivil.cl/OficinaInternet/verificacion/verificacioncertificado.srcei';

// GET /api/admin/resumen
exports.obtenerResumen = async (req, res) => {
  try {
    await aprobarVencidas();

    const [
      usuariosRes,
      polizasRes,
      inventarioRes,
      albaceasRes,
      mensajesRes,
      solicitudesRes,
      auditoriaRes,
    ] = await Promise.all([
      db.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE rol = 'ADMIN')::int AS admins
        FROM USUARIO
      `),
      db.query('SELECT COUNT(*)::int AS total, COALESCE(SUM(monto_referencial), 0)::numeric AS monto_total FROM POLIZA'),
      db.query('SELECT COUNT(*)::int AS total FROM INVENTARIO'),
      db.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE estado_validacion = 'VALIDADO')::int AS validados,
          COUNT(*) FILTER (WHERE estado_validacion = 'PENDIENTE')::int AS pendientes,
          COUNT(*) FILTER (WHERE estado_validacion = 'INVITADO')::int AS invitados
        FROM DIRECTORIO_ALBACEAS
      `),
      db.query('SELECT COUNT(*)::int AS total FROM MENSAJE_POSTUMO'),
      db.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE estado_solicitud = 'PENDIENTE')::int AS pendientes,
          COUNT(*) FILTER (WHERE estado_solicitud = 'APROBADA')::int AS aprobadas,
          COUNT(*) FILTER (WHERE estado_solicitud = 'CANCELADA')::int AS canceladas
        FROM SOLICITUD_APERTURA
      `),
      db.query('SELECT COUNT(*)::int AS total FROM AUDITORIA'),
    ]);

    return enviarRespuesta(res, 200, 'Resumen administrativo obtenido correctamente.', {
      usuarios: usuariosRes.rows[0],
      polizas: polizasRes.rows[0],
      inventario: inventarioRes.rows[0],
      albaceas: albaceasRes.rows[0],
      mensajes: mensajesRes.rows[0],
      solicitudes: solicitudesRes.rows[0],
      auditoria: auditoriaRes.rows[0],
      servicios: {
        smtp_activo: estaConfiguradoSmtp(),
        portal_registro_civil: URL_VERIFICACION_REGISTRO_CIVIL,
      },
    });
  } catch (error) {
    console.error('Error en admin.obtenerResumen:', error);
    return enviarRespuesta(res, 500, 'Error al obtener métricas del panel administrativo.', null);
  }
};

// GET /api/admin/usuarios?limit=20&offset=0
exports.listarUsuarios = async (req, res) => {
  try {
    const paginacion = parsearPaginacion(req.query, 25, 100);
    if (paginacion.error) return enviarRespuesta(res, 400, paginacion.error, null);
    const { limit, offset } = paginacion;

    const [datosRes, totalRes] = await Promise.all([
      db.query(
        `SELECT u.id_usuario, u.rut, u.nombre_usuario, u.correo_usuario, u.rol,
                u.fecha_ultimo_checkin,
                (SELECT COUNT(*)::int FROM POLIZA p WHERE p.id_usuario = u.id_usuario) AS total_polizas,
                (SELECT COUNT(*)::int FROM DIRECTORIO_ALBACEAS d WHERE d.id_titular = u.id_usuario) AS total_albaceas,
                (SELECT COUNT(*)::int FROM INVENTARIO i WHERE i.id_usuario = u.id_usuario) AS total_inventario
         FROM USUARIO u
         ORDER BY u.id_usuario DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      db.query('SELECT COUNT(*)::int AS total FROM USUARIO'),
    ]);

    return enviarRespuesta(res, 200, 'Usuarios obtenidos correctamente.', datosRes.rows, {
      total: totalRes.rows[0]?.total ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error en admin.listarUsuarios:', error);
    return enviarRespuesta(res, 500, 'Error al listar usuarios.', null);
  }
};

// GET /api/admin/auditoria?limit=30&offset=0
exports.listarAuditoria = async (req, res) => {
  try {
    const paginacion = parsearPaginacion(req.query, 30, 100);
    if (paginacion.error) return enviarRespuesta(res, 400, paginacion.error, null);
    const { limit, offset } = paginacion;

    const [datosRes, totalRes] = await Promise.all([
      db.query(
        `SELECT a.id_evento, a.accion, a.fecha_hora, a.direccion_ip,
                u.nombre_usuario, u.correo_usuario, u.rut
         FROM AUDITORIA a
         LEFT JOIN USUARIO u ON u.id_usuario = a.id_usuario
         ORDER BY a.fecha_hora DESC, a.id_evento DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      db.query('SELECT COUNT(*)::int AS total FROM AUDITORIA'),
    ]);

    return enviarRespuesta(res, 200, 'Bitácora de auditoría obtenida correctamente.', datosRes.rows, {
      total: totalRes.rows[0]?.total ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error en admin.listarAuditoria:', error);
    return enviarRespuesta(res, 500, 'Error al listar bitácora de auditoría.', null);
  }
};

// GET /api/admin/solicitudes
exports.listarSolicitudes = async (req, res) => {
  try {
    await aprobarVencidas();
    const { rows } = await db.query(
      `SELECT s.id_solicitud, s.certificado_defuncion, s.hash_documento,
              s.estado_solicitud, s.fecha_solicitud,
              t.nombre_usuario AS nombre_titular, t.rut AS rut_titular, t.correo_usuario AS correo_titular,
              COALESCE(a.nombre_usuario, d.nombre_albacea) AS nombre_albacea,
              d.rut_albacea, d.parentesco
       FROM SOLICITUD_APERTURA s
       JOIN USUARIO t ON t.id_usuario = s.id_usuario
       JOIN DIRECTORIO_ALBACEAS d ON d.id_directorio = s.id_albacea
       LEFT JOIN USUARIO a ON a.id_usuario = d.id_usuario_invitado
       ORDER BY s.fecha_solicitud DESC`
    );

    return enviarRespuesta(res, 200, 'Solicitudes de apertura obtenidas correctamente.', rows, {
      portal_registro_civil: URL_VERIFICACION_REGISTRO_CIVIL,
    });
  } catch (error) {
    console.error('Error en admin.listarSolicitudes:', error);
    return enviarRespuesta(res, 500, 'Error al obtener solicitudes de apertura.', null);
  }
};

// PUT /api/admin/solicitudes/:id/estado
exports.actualizarEstadoSolicitud = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador de solicitud debe ser un entero positivo válido.', null);
    }

    const { estado_solicitud } = req.body || {};
    const nuevoEstado = String(estado_solicitud || '').trim().toUpperCase();
    if (!['PENDIENTE', 'APROBADA', 'CANCELADA'].includes(nuevoEstado)) {
      return enviarRespuesta(res, 400, "Estado inválido. Valores permitidos: 'PENDIENTE', 'APROBADA' o 'CANCELADA'.", null);
    }

    const { rows } = await db.query(
      `UPDATE SOLICITUD_APERTURA
       SET estado_solicitud = $1
       WHERE id_solicitud = $2
       RETURNING id_solicitud, estado_solicitud, fecha_solicitud`,
      [nuevoEstado, id]
    );

    if (!rows[0]) {
      return enviarRespuesta(res, 404, 'Solicitud de apertura no encontrada.', null);
    }

    await registrarAuditoria(
      `[ADMIN] Cambió manualmente el estado de la solicitud #${id} a ${nuevoEstado}`,
      obtenerIp(req),
      req.user.id
    );

    return enviarRespuesta(res, 200, `Solicitud #${id} actualizada a ${nuevoEstado}.`, rows[0]);
  } catch (error) {
    console.error('Error en admin.actualizarEstadoSolicitud:', error);
    return enviarRespuesta(res, 500, 'Error al actualizar el estado de la solicitud.', null);
  }
};

// GET /api/admin/reportes-familiares
exports.listarReportesFamiliares = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.id_reporte, r.rut_titular_consultado, r.nombre_familiar, r.rut_familiar,
              r.correo_familiar, r.parentesco, r.certificado_archivo, r.hash_documento,
              r.folio_extraido, r.estado_reporte, r.fecha_reporte,
              t.nombre_usuario AS nombre_titular
       FROM REPORTE_FAMILIAR r
       LEFT JOIN USUARIO t ON t.id_usuario = r.id_titular_encontrado
       ORDER BY r.fecha_reporte DESC`
    );

    return enviarRespuesta(res, 200, 'Reportes familiares obtenidos correctamente.', rows, {
      portal_registro_civil: URL_VERIFICACION_REGISTRO_CIVIL,
    });
  } catch (error) {
    console.error('Error en admin.listarReportesFamiliares:', error);
    return enviarRespuesta(res, 500, 'Error al listar reportes familiares.', null);
  }
};

// PUT /api/admin/reportes-familiares/:id/estado
exports.actualizarEstadoReporteFamiliar = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador de reporte debe ser un entero positivo válido.', null);
    }

    const { estado_reporte } = req.body || {};
    const nuevoEstado = String(estado_reporte || '').trim().toUpperCase();
    if (!['RECIBIDO', 'EN_REVISION', 'VALIDADO', 'RECHAZADO'].includes(nuevoEstado)) {
      return enviarRespuesta(res, 400, 'Estado inválido para reporte familiar.', null);
    }

    const { rows } = await db.query(
      `UPDATE REPORTE_FAMILIAR
       SET estado_reporte = $1
       WHERE id_reporte = $2
       RETURNING id_reporte, estado_reporte`,
      [nuevoEstado, id]
    );

    if (!rows[0]) {
      return enviarRespuesta(res, 404, 'Reporte familiar no encontrado.', null);
    }

    await registrarAuditoria(
      `[ADMIN] Actualizó reporte familiar #${id} a estado ${nuevoEstado}`,
      obtenerIp(req),
      req.user.id
    );

    return enviarRespuesta(res, 200, `Reporte familiar #${id} actualizado a ${nuevoEstado}.`, rows[0]);
  } catch (error) {
    console.error('Error en admin.actualizarEstadoReporteFamiliar:', error);
    return enviarRespuesta(res, 500, 'Error al actualizar el reporte familiar.', null);
  }
};
