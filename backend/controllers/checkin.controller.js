const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { obtenerIp } = require('../utils/validadores');
const { enviarNotificacionSolicitante } = require('../services/email.service');

// GET /api/checkin
exports.obtener = async (req, res) => {
  try {
    const query = `
      SELECT fecha_ultimo_checkin,
             boveda_activa,
             frecuencia_checkin_dias,
             plazo_gracia_dias,
             GREATEST(0, EXTRACT(DAY FROM (NOW() - fecha_ultimo_checkin))::int) AS dias_desde_ultimo,
             GREATEST(0, frecuencia_checkin_dias - EXTRACT(DAY FROM (NOW() - fecha_ultimo_checkin))::int) AS dias_restantes
      FROM USUARIO
      WHERE id_usuario = $1
    `;
    const { rows } = await db.query(query, [req.user.id]);

    if (rows.length === 0) {
      return enviarRespuesta(res, 404, 'Usuario no encontrado.', null);
    }

    return enviarRespuesta(res, 200, 'Estado de check-in obtenido correctamente.', rows[0]);
  } catch (error) {
    console.error('Error al obtener check-in:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al consultar el check-in.', null);
  }
};

// POST /api/checkin (RF-04)
exports.confirmar = async (req, res) => {
  try {
    const id_titular = req.user.id;
    const ip = obtenerIp(req);

    // 1. Actualizar fecha del último check-in y reiniciar contador de recordatorios
    const resultado = await db.query(
      `UPDATE USUARIO
       SET fecha_ultimo_checkin = NOW(),
           ultimo_recordatorio_enviado = NULL
       WHERE id_usuario = $1
       RETURNING fecha_ultimo_checkin, frecuencia_checkin_dias, nombre_usuario`,
      [id_titular]
    );

    if (resultado.rowCount === 0) {
      return enviarRespuesta(res, 404, 'Usuario titular no encontrado.', null);
    }

    const { fecha_ultimo_checkin, frecuencia_checkin_dias, nombre_usuario } = resultado.rows[0];

    // 2. Cancelar solicitudes de apertura de albaceas PENDIENTES
    const canceladasSol = await db.query(
      `UPDATE SOLICITUD_APERTURA
       SET estado_solicitud = 'CANCELADA'
       WHERE id_usuario = $1 AND estado_solicitud = 'PENDIENTE'
       RETURNING id_solicitud, id_albacea`,
      [id_titular]
    );

    // 3. Cancelar reportes familiares externos ACTIVOS
    const canceladosRep = await db.query(
      `UPDATE REPORTE_FAMILIAR
       SET estado_reporte = 'CANCELADO_TITULAR'
       WHERE id_titular_encontrado = $1 AND estado_reporte IN ('RECIBIDO', 'EN_REVISION')
       RETURNING id_reporte, nombre_familiar, correo_familiar`,
      [id_titular]
    );

    // Notificar a los albaceas cuyas solicitudes fueron anuladas por check-in
    for (const s of canceladasSol.rows) {
      const albRes = await db.query(
        `SELECT COALESCE(u.nombre_usuario, d.nombre_albacea) AS nombre,
                COALESCE(u.correo_usuario, d.email_albacea) AS correo
         FROM DIRECTORIO_ALBACEAS d
         LEFT JOIN USUARIO u ON u.id_usuario = d.id_usuario_invitado
         WHERE d.id_directorio = $1`,
        [s.id_albacea]
      );
      if (albRes.rows[0]?.correo) {
        enviarNotificacionSolicitante({
          correoSolicitante: albRes.rows[0].correo,
          nombreSolicitante: albRes.rows[0].nombre,
          nombreTitular: nombre_usuario,
          estado: 'CANCELADA_TITULAR',
          detalle: `${nombre_usuario} realizó su Check-in de presencia en Baúl Eterno, por lo que la solicitud de apertura #${s.id_solicitud} fue anulada automáticamente.`,
        }).catch(() => {});
      }
    }

    // Notificar a familiares externos cuyos reportes fueron anulados por check-in
    for (const r of canceladosRep.rows) {
      enviarNotificacionSolicitante({
        correoSolicitante: r.correo_familiar,
        nombreSolicitante: r.nombre_familiar,
        nombreTitular: nombre_usuario,
        estado: 'CANCELADA_TITULAR',
        detalle: `${nombre_usuario} realizó su Check-in de presencia en Baúl Eterno, confirmando que se encuentra activo. El reporte de apertura #${r.id_reporte} fue anulado automáticamente.`,
      }).catch(() => {});
    }

    const totalCanceladas = (canceladasSol.rowCount || 0) + (canceladosRep.rowCount || 0);

    // RNF-05: Auditoría
    await registrarAuditoria(
      `Realizó check-in de vigencia (${frecuencia_checkin_dias} días)${totalCanceladas > 0 ? ` y anuló ${totalCanceladas} alerta(s) pendiente(s)` : ''}`,
      ip,
      id_titular
    );

    return enviarRespuesta(
      res,
      200,
      `Check-in realizado con éxito. Bóveda renovada por ${frecuencia_checkin_dias} días${totalCanceladas > 0 ? ` y ${totalCanceladas} solicitud(es) pendiente(s) anuladas` : ''}.`,
      {
        fecha_checkin: fecha_ultimo_checkin,
        frecuencia_checkin_dias,
        solicitudes_canceladas: totalCanceladas,
      }
    );
  } catch (error) {
    console.error('Error en check-in:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al realizar el check-in.', null);
  }
};
