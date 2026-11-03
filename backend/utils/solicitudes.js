// Guardar como backend/utils/solicitudes.js
const db = require('../db');
const { registrarAuditoria } = require('./auditoria');

// Plazo de gracia (RF-06). Configurable en el .env: PLAZO_GRACIA_HORAS=72
const PLAZO_HORAS = parseInt(process.env.PLAZO_GRACIA_HORAS || '72', 10);

// Las solicitudes PENDIENTES cuyo plazo venció pasan a APROBADA.
// Se ejecuta antes de consultar o modificar solicitudes, sin necesidad de un cron.
async function aprobarVencidas() {
    const { rows } = await db.query(
        `UPDATE SOLICITUD_APERTURA
         SET estado_solicitud = 'APROBADA'
         WHERE estado_solicitud = 'PENDIENTE'
           AND fecha_solicitud + make_interval(hours => $1::int) <= NOW()
         RETURNING id_solicitud, id_usuario`,
        [PLAZO_HORAS]
    );
    for (const r of rows) {
        await registrarAuditoria(
            `Solicitud ${r.id_solicitud} aprobada automáticamente al vencer el plazo de gracia`,
            'sistema',
            r.id_usuario
        );
    }
    return rows.length;
}

module.exports = { PLAZO_HORAS, aprobarVencidas };