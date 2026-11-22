const { enviarRespuesta } = require('../utils/respuesta');
const { responderConsultaPlataforma } = require('../services/gemini.service');

// POST /api/asistente/preguntar
exports.preguntar = async (req, res) => {
  try {
    const { pregunta } = req.body || {};
    const texto = String(pregunta || '').trim();

    if (!texto || texto.length < 3) {
      return enviarRespuesta(res, 400, 'Escribe una consulta de al menos 3 caracteres.', null);
    }

    if (texto.length > 500) {
      return enviarRespuesta(res, 400, 'La consulta no puede superar los 500 caracteres.', null);
    }

    const resultado = await responderConsultaPlataforma(texto);
    return enviarRespuesta(res, 200, 'Respuesta generada.', resultado);
  } catch (error) {
    console.error('Error en asistente.preguntar:', error);
    return enviarRespuesta(res, 500, 'No fue posible responder tu consulta en este momento.', null);
  }
};
