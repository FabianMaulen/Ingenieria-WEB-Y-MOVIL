const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { obtenerIp } = require('../utils/validadores');

// GET /api/checkin
exports.obtener = async (req, res) => {
  try {
    const query = `
      SELECT fecha_ultimo_checkin,
             GREATEST(0, EXTRACT(DAY FROM (NOW() - fecha_ultimo_checkin))::int) AS dias_desde_ultimo
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

    // 1. Actualizar fecha del último check-in
    const resultado = await db.query(
      `UPDATE USUARIO
       SET fecha_ultimo_checkin = NOW()
       WHERE id_usuario = $1
       RETURNING fecha_ultimo_checkin`,
      [id_titular]
    );

    if (resultado.rowCount === 0) {
      return enviarRespuesta(res, 404, 'Usuario titular no encontrado.', null);
    }

    // 2. Cancelar automáticamente cualquier solicitud de apertura PENDIENTE al confirmar presencia
    const canceladas = await db.query(
      `UPDATE SOLICITUD_APERTURA
       SET estado_solicitud = 'CANCELADA'
       WHERE id_usuario = $1 AND estado_solicitud = 'PENDIENTE'`,
      [id_titular]
    );

    // RNF-05: Auditoría
    await registrarAuditoria('Realizó check-in de vigencia en la bóveda', ip, id_titular);

    return enviarRespuesta(res, 200, 'Check-in realizado con éxito. Bóveda renovada por 180 días.', {
      fecha_checkin: resultado.rows[0].fecha_ultimo_checkin,
      solicitudes_canceladas: canceladas.rowCount || 0,
    });
  } catch (error) {
    console.error('Error en check-in:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al realizar el check-in.', null);
  }
};
