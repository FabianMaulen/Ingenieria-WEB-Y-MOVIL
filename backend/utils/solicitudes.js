// Helper de plazos de gracia y aprobación automática de solicitudes vencidas (RF-06)
const db = require('../db');
const { registrarAuditoria } = require('./auditoria');

// Plazo de gracia por defecto: 7 días (168 horas). Configurable por usuario en USUARIO.plazo_gracia_dias
const PLAZO_HORAS = parseInt(process.env.PLAZO_GRACIA_HORAS || '168', 10);

async function aprobarVencidas() {
  const { rows } = await db.query(
    `UPDATE SOLICITUD_APERTURA s
     SET estado_solicitud = 'APROBADA',
         ultimo_aviso_etapa = 'LIBERADA'
     FROM USUARIO u
     WHERE s.id_usuario = u.id_usuario
       AND s.estado_solicitud = 'PENDIENTE'
       AND s.fecha_solicitud + make_interval(hours => COALESCE(s.plazo_gracia_horas, u.plazo_gracia_dias * 24, $1::int)) <= NOW()
     RETURNING s.id_solicitud, s.id_usuario`,
    [PLAZO_HORAS]
  );

  for (const r of rows) {
    await registrarAuditoria(
      `Solicitud #${r.id_solicitud} aprobada automáticamente al vencer el plazo de gracia`,
      'sistema',
      r.id_usuario
    );
  }

  // También validar reportes familiares cuyo plazo de gracia expiró sin respuesta del titular
  const repRes = await db.query(
    `UPDATE REPORTE_FAMILIAR r
     SET estado_reporte = 'VALIDADO',
         ultimo_aviso_etapa = 'LIBERADA'
     FROM USUARIO u
     WHERE r.id_titular_encontrado = u.id_usuario
       AND r.estado_reporte IN ('RECIBIDO', 'EN_REVISION')
       AND r.fecha_reporte + make_interval(hours => COALESCE(r.plazo_gracia_horas, u.plazo_gracia_dias * 24, $1::int)) <= NOW()
     RETURNING r.id_reporte, r.id_titular_encontrado`,
    [PLAZO_HORAS]
  );

  for (const r of repRes.rows) {
    await registrarAuditoria(
      `Reporte familiar #${r.id_reporte} validado automáticamente al vencer el plazo de gracia`,
      'sistema',
      r.id_titular_encontrado
    );
  }

  return rows.length + repRes.rows.length;
}

module.exports = { PLAZO_HORAS, aprobarVencidas };
