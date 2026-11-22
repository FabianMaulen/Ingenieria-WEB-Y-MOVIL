const fs = require('fs');
const path = require('path');
const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { aprobarVencidas, PLAZO_HORAS } = require('../utils/solicitudes');
const {
  parsearIdEntero,
  parsearPaginacion,
  obtenerIp,
  normalizarRut,
  validarRut,
  validarEmail,
} = require('../utils/validadores');
const {
  estaConfiguradoSmtp,
  enviarNotificacionSolicitante,
  enviarTriggerLiberacionAlbaceas,
  enviarAvisoLiberacionTitular,
  enviarRespuestaTicketSoporte,
} = require('../services/email.service');
const {
  ejecutarCicloVigilancia,
  entregarMensajesExternosPorCorreo,
} = require('../services/vigilancia.service');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'certificados');
const URL_VERIFICACION_REGISTRO_CIVIL =
  'https://www.registrocivil.cl/OficinaInternet/verificacion/verificacioncertificado.srcei';

async function notificarTodosLosAlbaceasValidados(idTitular, nombreTitular, motivo) {
  const { rows } = await db.query(
    `SELECT COALESCE(u.nombre_usuario, d.nombre_albacea) AS nombre_albacea,
            COALESCE(u.correo_usuario, d.email_albacea) AS correo_albacea
     FROM DIRECTORIO_ALBACEAS d
     LEFT JOIN USUARIO u ON u.id_usuario = d.id_usuario_invitado
     WHERE d.id_titular = $1 AND d.estado_validacion = 'VALIDADO'`,
    [idTitular]
  );

  for (const alb of rows) {
    if (alb.correo_albacea) {
      enviarTriggerLiberacionAlbaceas({
        correoAlbacea: alb.correo_albacea,
        nombreAlbacea: alb.nombre_albacea,
        nombreTitular,
        motivo,
      }).catch(() => {});
    }
  }

  // Entregar automáticamente cartas póstumas dirigidas a destinatarios externos por correo
  await entregarMensajesExternosPorCorreo(idTitular, nombreTitular).catch(() => {});
}

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
      reportesRes,
      ticketsRes,
      auditoriaRes,
    ] = await Promise.all([
      db.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE rol = 'ADMIN')::int AS admins,
          COUNT(*) FILTER (WHERE activo = FALSE)::int AS suspendidos
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
      db.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE estado_reporte IN ('RECIBIDO', 'EN_REVISION'))::int AS activos
        FROM REPORTE_FAMILIAR
      `),
      db.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE estado_ticket IN ('ABIERTO', 'EN_PROCESO'))::int AS abiertos
        FROM TICKET_SOPORTE
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
      reportes_familiares: reportesRes.rows[0],
      tickets: ticketsRes.rows[0],
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

// GET /api/admin/usuarios?limit=100&offset=0
exports.listarUsuarios = async (req, res) => {
  try {
    const paginacion = parsearPaginacion(req.query, 50, 100);
    if (paginacion.error) return enviarRespuesta(res, 400, paginacion.error, null);
    const { limit, offset } = paginacion;

    const [datosRes, totalRes] = await Promise.all([
      db.query(
        `SELECT u.id_usuario, u.rut, u.nombre_usuario, u.correo_usuario, u.rol, u.activo,
                u.fecha_ultimo_checkin, u.frecuencia_checkin_dias, u.plazo_gracia_dias,
                u.correo_verificado, u.correo_alternativo, u.correo_alternativo_verificado,
                u.nombre_contacto_confianza, u.correo_contacto_confianza,
                (SELECT COUNT(*)::int FROM POLIZA p WHERE p.id_usuario = u.id_usuario) AS total_polizas,
                (SELECT COUNT(*)::int FROM DIRECTORIO_ALBACEAS d WHERE d.id_titular = u.id_usuario) AS total_albaceas,
                (SELECT COUNT(*)::int FROM INVENTARIO i WHERE i.id_usuario = u.id_usuario) AS total_inventario,
                (SELECT COUNT(*)::int FROM MENSAJE_POSTUMO m WHERE m.id_usuario = u.id_usuario) AS total_mensajes
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

// PUT /api/admin/usuarios/:id (edición completa de usuario + rol + estado activo/suspendido)
exports.actualizarUsuario = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'Identificador de usuario inválido.', null);
    }

    const {
      nombre_usuario,
      correo_usuario,
      rut,
      rol,
      activo,
      frecuencia_checkin_dias,
      plazo_gracia_dias,
      correo_alternativo,
      nombre_contacto_confianza,
      correo_contacto_confianza,
    } = req.body || {};

    if (id === req.user.id && (rol !== undefined || activo !== undefined)) {
      return enviarRespuesta(res, 400, 'No puedes modificar tu propio rol ni suspender tu propia cuenta.', null);
    }

    const updates = [];
    const valores = [];

    if (nombre_usuario !== undefined) {
      const nombreLimpio = String(nombre_usuario).trim();
      if (nombreLimpio.length < 2) {
        return enviarRespuesta(res, 400, 'El nombre del usuario debe tener al menos 2 caracteres.', null);
      }
      valores.push(nombreLimpio);
      updates.push(`nombre_usuario = $${valores.length}`);
    }

    if (correo_usuario !== undefined) {
      const correoLimpio = String(correo_usuario).trim().toLowerCase();
      if (!validarEmail(correoLimpio)) {
        return enviarRespuesta(res, 400, 'El correo electrónico principal no es válido.', null);
      }
      valores.push(correoLimpio);
      updates.push(`correo_usuario = $${valores.length}`);
    }

    if (rut !== undefined) {
      const rutRaw = String(rut || '').trim();
      if (rutRaw === '') {
        valores.push(null);
        updates.push(`rut = $${valores.length}`);
      } else {
        const rutNorm = normalizarRut(rutRaw);
        if (!validarRut(rutNorm)) {
          return enviarRespuesta(res, 400, 'El RUT ingresado no es válido (verifica el dígito verificador).', null);
        }
        valores.push(rutNorm);
        updates.push(`rut = $${valores.length}`);
      }
    }

    if (rol !== undefined) {
      const rolNorm = String(rol).trim().toUpperCase();
      if (!['TITULAR', 'ADMIN'].includes(rolNorm)) {
        return enviarRespuesta(res, 400, "Rol inválido. Valores permitidos: 'TITULAR' o 'ADMIN'.", null);
      }
      valores.push(rolNorm);
      updates.push(`rol = $${valores.length}`);
    }

    if (activo !== undefined) {
      valores.push(Boolean(activo));
      updates.push(`activo = $${valores.length}`);
    }

    if (frecuencia_checkin_dias !== undefined) {
      const freq = Number(frecuencia_checkin_dias);
      if (![30, 90, 180, 365].includes(freq)) {
        return enviarRespuesta(res, 400, 'La frecuencia de Check-in debe ser 30, 90, 180 o 365 días.', null);
      }
      valores.push(freq);
      updates.push(`frecuencia_checkin_dias = $${valores.length}`);
    }

    if (plazo_gracia_dias !== undefined) {
      const gracia = Number(plazo_gracia_dias);
      if (![3, 7, 14].includes(gracia)) {
        return enviarRespuesta(res, 400, 'El plazo de gracia debe ser 3, 7 o 14 días.', null);
      }
      valores.push(gracia);
      updates.push(`plazo_gracia_dias = $${valores.length}`);
    }

    if (correo_alternativo !== undefined) {
      const alt = String(correo_alternativo || '').trim().toLowerCase();
      if (alt && !validarEmail(alt)) {
        return enviarRespuesta(res, 400, 'El correo alternativo no es válido.', null);
      }
      valores.push(alt || null);
      updates.push(`correo_alternativo = $${valores.length}`);
    }

    if (nombre_contacto_confianza !== undefined) {
      const nc = String(nombre_contacto_confianza || '').trim().slice(0, 150);
      valores.push(nc || null);
      updates.push(`nombre_contacto_confianza = $${valores.length}`);
    }

    if (correo_contacto_confianza !== undefined) {
      const cc = String(correo_contacto_confianza || '').trim().toLowerCase();
      if (cc && !validarEmail(cc)) {
        return enviarRespuesta(res, 400, 'El correo del contacto de confianza no es válido.', null);
      }
      valores.push(cc || null);
      updates.push(`correo_contacto_confianza = $${valores.length}`);
    }

    if (updates.length === 0) {
      return enviarRespuesta(res, 400, 'Debes indicar al menos un campo a actualizar.', null);
    }

    valores.push(id);
    const { rows } = await db.query(
      `UPDATE USUARIO
       SET ${updates.join(', ')}
       WHERE id_usuario = $${valores.length}
       RETURNING id_usuario, rut, nombre_usuario, correo_usuario, rol, activo,
                 frecuencia_checkin_dias, plazo_gracia_dias, correo_alternativo,
                 nombre_contacto_confianza, correo_contacto_confianza`,
      valores
    );

    if (!rows[0]) {
      return enviarRespuesta(res, 404, 'Usuario no encontrado.', null);
    }

    await registrarAuditoria(
      `[ADMIN] Editó usuario #${id} (${rows[0].nombre_usuario} · ${rows[0].correo_usuario}) -> rol=${rows[0].rol}, activo=${rows[0].activo}`,
      obtenerIp(req),
      req.user.id
    );

    return enviarRespuesta(res, 200, 'Datos del usuario actualizados correctamente.', rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return enviarRespuesta(res, 409, 'El correo electrónico o RUT ingresado ya pertenece a otra cuenta.', null);
    }
    console.error('Error en admin.actualizarUsuario:', error);
    return enviarRespuesta(res, 500, 'Error al actualizar el usuario.', null);
  }
};

// DELETE /api/admin/usuarios/:id
exports.eliminarUsuario = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'Identificador de usuario inválido.', null);
    }

    if (id === req.user.id) {
      return enviarRespuesta(res, 400, 'No puedes eliminar tu propia cuenta de administrador.', null);
    }

    const { rows } = await db.query(
      'DELETE FROM USUARIO WHERE id_usuario = $1 RETURNING id_usuario, nombre_usuario, correo_usuario',
      [id]
    );

    if (!rows[0]) {
      return enviarRespuesta(res, 404, 'Usuario no encontrado.', null);
    }

    await registrarAuditoria(
      `[ADMIN] Eliminó permanentemente la cuenta #${id} (${rows[0].nombre_usuario} · ${rows[0].correo_usuario})`,
      obtenerIp(req),
      req.user.id
    );

    return enviarRespuesta(res, 200, `Usuario ${rows[0].nombre_usuario} eliminado permanentemente.`, rows[0]);
  } catch (error) {
    console.error('Error en admin.eliminarUsuario:', error);
    return enviarRespuesta(res, 500, 'Error al eliminar el usuario.', null);
  }
};

// GET /api/admin/auditoria?limit=60&offset=0
exports.listarAuditoria = async (req, res) => {
  try {
    const paginacion = parsearPaginacion(req.query, 60, 100);
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
              s.estado_solicitud, s.fecha_solicitud, s.ultimo_aviso_etapa,
              COALESCE(s.plazo_gracia_horas, $1::int) AS plazo_gracia_horas,
              GREATEST(0, EXTRACT(EPOCH FROM ((s.fecha_solicitud + make_interval(hours => COALESCE(s.plazo_gracia_horas, $1::int))) - NOW())) / 3600.0)::int AS horas_restantes,
              t.nombre_usuario AS nombre_titular, t.rut AS rut_titular, t.correo_usuario AS correo_titular,
              COALESCE(a.nombre_usuario, d.nombre_albacea) AS nombre_albacea,
              d.rut_albacea, d.parentesco,
              (SELECT COUNT(*)::int FROM TICKET_SOPORTE tk
               WHERE tk.id_solicitud_asociada = s.id_solicitud AND tk.estado_ticket IN ('ABIERTO', 'EN_PROCESO')) AS tickets_abiertos,
              (SELECT tk.codigo_ticket FROM TICKET_SOPORTE tk
               WHERE tk.id_solicitud_asociada = s.id_solicitud AND tk.estado_ticket IN ('ABIERTO', 'EN_PROCESO')
               ORDER BY tk.fecha_creacion DESC LIMIT 1) AS ultimo_ticket_codigo,
              (SELECT tk.mensaje FROM TICKET_SOPORTE tk
               WHERE tk.id_solicitud_asociada = s.id_solicitud AND tk.estado_ticket IN ('ABIERTO', 'EN_PROCESO')
               ORDER BY tk.fecha_creacion DESC LIMIT 1) AS ultimo_ticket_mensaje
       FROM SOLICITUD_APERTURA s
       JOIN USUARIO t ON t.id_usuario = s.id_usuario
       JOIN DIRECTORIO_ALBACEAS d ON d.id_directorio = s.id_albacea
       LEFT JOIN USUARIO a ON a.id_usuario = d.id_usuario_invitado
       ORDER BY s.fecha_solicitud DESC`,
      [PLAZO_HORAS]
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
      return enviarRespuesta(
        res,
        400,
        "Estado inválido. Valores permitidos: 'PENDIENTE', 'APROBADA' o 'CANCELADA'.",
        null
      );
    }

    const { rows } = await db.query(
      `UPDATE SOLICITUD_APERTURA
       SET estado_solicitud = $1
       WHERE id_solicitud = $2
       RETURNING id_solicitud, estado_solicitud, fecha_solicitud, id_usuario, id_albacea`,
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

    const info = await db.query(
      `SELECT t.id_usuario AS id_titular, t.nombre_usuario AS nombre_titular,
              t.correo_usuario AS correo_titular, t.correo_alternativo,
              COALESCE(a.nombre_usuario, d.nombre_albacea) AS nombre_albacea,
              COALESCE(a.correo_usuario, d.email_albacea) AS correo_albacea
       FROM DIRECTORIO_ALBACEAS d
       JOIN USUARIO t ON t.id_usuario = d.id_titular
       LEFT JOIN USUARIO a ON a.id_usuario = d.id_usuario_invitado
       WHERE d.id_directorio = $1`,
      [rows[0].id_albacea]
    );

    if (info.rows[0]) {
      const d = info.rows[0];
      if (nuevoEstado === 'APROBADA') {
        // Notificar globalmente a TODOS los albaceas validados + avisar al titular
        notificarTodosLosAlbaceasValidados(
          d.id_titular,
          d.nombre_titular,
          `aprobación administrativa de la solicitud #${id}`
        ).catch(() => {});

        enviarAvisoLiberacionTitular({
          correoTitular: d.correo_titular,
          correoAlternativo: d.correo_alternativo,
          nombreTitular: d.nombre_titular,
          detalle: `Un administrador autorizó la apertura de tu bóveda (solicitud #${id} de ${d.nombre_albacea}), habilitando el acceso a tus albaceas validados.`,
        }).catch(() => {});
      } else if (nuevoEstado === 'CANCELADA' && d.correo_albacea) {
        enviarNotificacionSolicitante({
          correoSolicitante: d.correo_albacea,
          nombreSolicitante: d.nombre_albacea,
          nombreTitular: d.nombre_titular,
          estado: 'RECHAZADA',
          detalle: `La solicitud de apertura #${id} sobre la bóveda de ${d.nombre_titular} fue cancelada tras la revisión administrativa.`,
        }).catch(() => {});
      }
    }

    return enviarRespuesta(res, 200, `Solicitud #${id} actualizada a ${nuevoEstado}.`, rows[0]);
  } catch (error) {
    console.error('Error en admin.actualizarEstadoSolicitud:', error);
    return enviarRespuesta(res, 500, 'Error al actualizar el estado de la solicitud.', null);
  }
};

// GET /api/admin/reportes-familiares
exports.listarReportesFamiliares = async (req, res) => {
  try {
    await aprobarVencidas();
    const { rows } = await db.query(
      `SELECT r.id_reporte, r.rut_titular_consultado, r.nombre_familiar, r.rut_familiar,
              r.correo_familiar, r.parentesco, r.certificado_archivo, r.hash_documento,
              r.folio_extraido, r.estado_reporte, r.fecha_reporte, r.ultimo_aviso_etapa,
              COALESCE(r.plazo_gracia_horas, $1::int) AS plazo_gracia_horas,
              GREATEST(0, EXTRACT(EPOCH FROM ((r.fecha_reporte + make_interval(hours => COALESCE(r.plazo_gracia_horas, $1::int))) - NOW())) / 3600.0)::int AS horas_restantes,
              t.nombre_usuario AS nombre_titular,
              (SELECT COUNT(*)::int FROM TICKET_SOPORTE tk
               WHERE tk.id_reporte_asociado = r.id_reporte AND tk.estado_ticket IN ('ABIERTO', 'EN_PROCESO')) AS tickets_abiertos,
              (SELECT tk.codigo_ticket FROM TICKET_SOPORTE tk
               WHERE tk.id_reporte_asociado = r.id_reporte AND tk.estado_ticket IN ('ABIERTO', 'EN_PROCESO')
               ORDER BY tk.fecha_creacion DESC LIMIT 1) AS ultimo_ticket_codigo,
              (SELECT tk.mensaje FROM TICKET_SOPORTE tk
               WHERE tk.id_reporte_asociado = r.id_reporte AND tk.estado_ticket IN ('ABIERTO', 'EN_PROCESO')
               ORDER BY tk.fecha_creacion DESC LIMIT 1) AS ultimo_ticket_mensaje
       FROM REPORTE_FAMILIAR r
       LEFT JOIN USUARIO t ON t.id_usuario = r.id_titular_encontrado
       ORDER BY r.fecha_reporte DESC`,
      [PLAZO_HORAS]
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
    if (!['RECIBIDO', 'EN_REVISION', 'VALIDADO', 'RECHAZADO', 'CANCELADO_TITULAR'].includes(nuevoEstado)) {
      return enviarRespuesta(res, 400, 'Estado inválido para reporte familiar.', null);
    }

    const { rows } = await db.query(
      `UPDATE REPORTE_FAMILIAR
       SET estado_reporte = $1
       WHERE id_reporte = $2
       RETURNING id_reporte, id_titular_encontrado, estado_reporte, nombre_familiar, correo_familiar, rut_titular_consultado`,
      [nuevoEstado, id]
    );

    if (!rows[0]) {
      return enviarRespuesta(res, 404, 'Reporte familiar no encontrado.', null);
    }

    const rep = rows[0];

    await registrarAuditoria(
      `[ADMIN] Actualizó reporte familiar #${id} a estado ${nuevoEstado}`,
      obtenerIp(req),
      req.user.id
    );

    if (nuevoEstado === 'VALIDADO') {
      enviarNotificacionSolicitante({
        correoSolicitante: rep.correo_familiar,
        nombreSolicitante: rep.nombre_familiar,
        nombreTitular: `RUT ${rep.rut_titular_consultado}`,
        estado: 'APROBADA',
        detalle: `Tu reporte familiar #${id} fue validado por administración. La bóveda quedó liberada para los albaceas designados y nuestro equipo coordinará el acompañamiento.`,
      }).catch(() => {});

      if (rep.id_titular_encontrado) {
        const titRes = await db.query(
          'SELECT nombre_usuario, correo_usuario, correo_alternativo FROM USUARIO WHERE id_usuario = $1',
          [rep.id_titular_encontrado]
        );
        if (titRes.rows[0]) {
          const tit = titRes.rows[0];
          // Liberación global: notificar a TODOS los albaceas validados + avisar al titular
          notificarTodosLosAlbaceasValidados(
            rep.id_titular_encontrado,
            tit.nombre_usuario,
            `validación administrativa del reporte familiar #${id}`
          ).catch(() => {});

          enviarAvisoLiberacionTitular({
            correoTitular: tit.correo_usuario,
            correoAlternativo: tit.correo_alternativo,
            nombreTitular: tit.nombre_usuario,
            detalle: `Un administrador validó el reporte familiar #${id} (${rep.nombre_familiar}) y liberó el acceso a tu bóveda para tus albaceas validados.`,
          }).catch(() => {});
        }
      }
    } else if (nuevoEstado === 'RECHAZADO') {
      enviarNotificacionSolicitante({
        correoSolicitante: rep.correo_familiar,
        nombreSolicitante: rep.nombre_familiar,
        nombreTitular: `RUT ${rep.rut_titular_consultado}`,
        estado: 'RECHAZADA',
        detalle: `Tu reporte familiar #${id} fue rechazado tras la revisión administrativa. Si crees que es un error, contáctanos o adjunta un documento legible.`,
      }).catch(() => {});
    }

    return enviarRespuesta(res, 200, `Reporte familiar #${id} actualizado a ${nuevoEstado}.`, rep);
  } catch (error) {
    console.error('Error en admin.actualizarEstadoReporteFamiliar:', error);
    return enviarRespuesta(res, 500, 'Error al actualizar el reporte familiar.', null);
  }
};

// GET /api/admin/archivos/:tipo/:id (descarga/visualización segura del certificado adjunto)
exports.descargarCertificado = async (req, res) => {
  try {
    const tipo = String(req.params.tipo || '').toLowerCase();
    const id = parsearIdEntero(req.params.id);
    if (!id || !['solicitud', 'reporte'].includes(tipo)) {
      return enviarRespuesta(res, 400, 'Parámetros inválidos para descargar archivo.', null);
    }

    let nombreArchivo = null;
    if (tipo === 'solicitud') {
      const r = await db.query('SELECT certificado_defuncion FROM SOLICITUD_APERTURA WHERE id_solicitud = $1', [id]);
      nombreArchivo = r.rows[0]?.certificado_defuncion || null;
    } else {
      const r = await db.query('SELECT certificado_archivo FROM REPORTE_FAMILIAR WHERE id_reporte = $1', [id]);
      nombreArchivo = r.rows[0]?.certificado_archivo || null;
    }

    if (!nombreArchivo || nombreArchivo === 'TRIGGER_INACTIVIDAD') {
      return enviarRespuesta(res, 404, 'Esta solicitud no posee un archivo adjunto en disco.', null);
    }

    const nombreSeguro = path.basename(nombreArchivo);
    const rutaCompleta = path.join(UPLOAD_DIR, nombreSeguro);
    if (!fs.existsSync(rutaCompleta)) {
      return enviarRespuesta(res, 404, 'El archivo adjunto no se encontró en el almacenamiento del servidor.', null);
    }

    return res.sendFile(rutaCompleta);
  } catch (error) {
    console.error('Error en admin.descargarCertificado:', error);
    return enviarRespuesta(res, 500, 'Error al recuperar el archivo adjunto.', null);
  }
};

// POST /api/admin/vigilancia/ejecutar
exports.ejecutarVigilancia = async (req, res) => {
  try {
    const resultado = await ejecutarCicloVigilancia();
    await registrarAuditoria(
      `[ADMIN] Ejecutó manualmente el motor de vigilancia y alertas (${JSON.stringify(resultado)})`,
      obtenerIp(req),
      req.user.id
    );
    return enviarRespuesta(res, 200, 'Ciclo de vigilancia ejecutado correctamente.', resultado);
  } catch (error) {
    console.error('Error en admin.ejecutarVigilancia:', error);
    return enviarRespuesta(res, 500, 'Error al ejecutar el motor de vigilancia.', null);
  }
};

// GET /api/admin/tickets
exports.listarTickets = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT tk.id_ticket, tk.codigo_ticket, tk.categoria, tk.mensaje, tk.estado_ticket,
              tk.respuesta_admin, tk.id_solicitud_asociada, tk.id_reporte_asociado,
              tk.fecha_creacion, tk.fecha_actualizacion,
              u.id_usuario, u.nombre_usuario, u.correo_usuario, u.rut,
              sa.estado_solicitud AS estado_solicitud_asociada,
              rf.estado_reporte AS estado_reporte_asociado
       FROM TICKET_SOPORTE tk
       JOIN USUARIO u ON u.id_usuario = tk.id_usuario
       LEFT JOIN SOLICITUD_APERTURA sa ON sa.id_solicitud = tk.id_solicitud_asociada
       LEFT JOIN REPORTE_FAMILIAR rf ON rf.id_reporte = tk.id_reporte_asociado
       ORDER BY
         CASE WHEN tk.estado_ticket IN ('ABIERTO', 'EN_PROCESO') THEN 0 ELSE 1 END,
         tk.fecha_creacion DESC`
    );

    return enviarRespuesta(res, 200, 'Tickets de soporte obtenidos correctamente.', rows);
  } catch (error) {
    console.error('Error en admin.listarTickets:', error);
    return enviarRespuesta(res, 500, 'Error al listar tickets de soporte.', null);
  }
};

// PUT /api/admin/tickets/:id (actualizar estado/respuesta y ejecutar acción directa sobre el caso asociado)
exports.gestionarTicket = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'Identificador de ticket inválido.', null);
    }

    const { estado_ticket, respuesta_admin, accion_directa } = req.body || {};

    const actualRes = await db.query(
      `SELECT tk.*, u.nombre_usuario, u.correo_usuario
       FROM TICKET_SOPORTE tk
       JOIN USUARIO u ON u.id_usuario = tk.id_usuario
       WHERE tk.id_ticket = $1`,
      [id]
    );
    const ticket = actualRes.rows[0];
    if (!ticket) {
      return enviarRespuesta(res, 404, 'Ticket de soporte no encontrado.', null);
    }

    let nuevoEstado = estado_ticket ? String(estado_ticket).trim().toUpperCase() : ticket.estado_ticket;
    let nuevaRespuesta = respuesta_admin !== undefined ? String(respuesta_admin).trim() : ticket.respuesta_admin;
    let detalleAccion = '';

    // Acción directa: revertir la apertura asociada al ticket desde el mismo panel de soporte
    if (accion_directa === 'REVERTIR_APERTURA') {
      if (ticket.id_solicitud_asociada) {
        await db.query(
          `UPDATE SOLICITUD_APERTURA SET estado_solicitud = 'CANCELADA' WHERE id_solicitud = $1`,
          [ticket.id_solicitud_asociada]
        );
        detalleAccion = `Solicitud de apertura #${ticket.id_solicitud_asociada} cancelada y bóveda sellada nuevamente.`;
      } else if (ticket.id_reporte_asociado) {
        await db.query(
          `UPDATE REPORTE_FAMILIAR SET estado_reporte = 'RECHAZADO' WHERE id_reporte = $1`,
          [ticket.id_reporte_asociado]
        );
        detalleAccion = `Reporte familiar #${ticket.id_reporte_asociado} revertido/rechazado y bóveda sellada nuevamente.`;
      } else {
        return enviarRespuesta(res, 400, 'Este ticket no está vinculado a ninguna solicitud o reporte de apertura.', null);
      }

      // Renovar vigencia del titular afectado
      await db.query(
        'UPDATE USUARIO SET fecha_ultimo_checkin = NOW(), ultimo_recordatorio_enviado = NULL WHERE id_usuario = $1',
        [ticket.id_usuario]
      );

      nuevoEstado = 'RESUELTO';
      if (!nuevaRespuesta) {
        nuevaRespuesta = `Revisamos tu caso (${ticket.codigo_ticket}): ${detalleAccion} Tu vigencia de Check-in también fue renovada.`;
      }
    }

    if (!['ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO'].includes(nuevoEstado)) {
      return enviarRespuesta(res, 400, 'Estado de ticket inválido.', null);
    }

    const { rows } = await db.query(
      `UPDATE TICKET_SOPORTE
       SET estado_ticket = $1,
           respuesta_admin = $2,
           fecha_actualizacion = NOW()
       WHERE id_ticket = $3
       RETURNING *`,
      [nuevoEstado, nuevaRespuesta || null, id]
    );

    await registrarAuditoria(
      `[ADMIN] Gestionó ticket ${ticket.codigo_ticket} -> estado=${nuevoEstado}${detalleAccion ? ` (${detalleAccion})` : ''}`,
      obtenerIp(req),
      req.user.id
    );

    enviarRespuestaTicketSoporte({
      correoUsuario: ticket.correo_usuario,
      nombreUsuario: ticket.nombre_usuario,
      codigoTicket: ticket.codigo_ticket,
      estadoTicket: nuevoEstado,
      respuestaAdmin: nuevaRespuesta,
    }).catch(() => {});

    return enviarRespuesta(
      res,
      200,
      detalleAccion
        ? `${detalleAccion} Ticket ${ticket.codigo_ticket} marcado como RESUELTO.`
        : `Ticket ${ticket.codigo_ticket} actualizado a ${nuevoEstado}.`,
      rows[0]
    );
  } catch (error) {
    console.error('Error en admin.gestionarTicket:', error);
    return enviarRespuesta(res, 500, 'Error al gestionar el ticket de soporte.', null);
  }
};
