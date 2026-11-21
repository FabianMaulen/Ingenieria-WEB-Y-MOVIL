/**
 * Helper para unificar el formato de respuesta JSON en toda la API:
 * { mensaje: string, data: any, meta?: object }
 */
function enviarRespuesta(res, status, mensaje, data = null, meta = undefined) {
  const payload = { mensaje, data };
  if (meta !== undefined) {
    payload.meta = meta;
  }
  return res.status(status).json(payload);
}

module.exports = { enviarRespuesta };
