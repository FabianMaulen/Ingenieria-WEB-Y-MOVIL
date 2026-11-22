const router = require('express').Router();
const { enviarRespuesta } = require('../utils/respuesta');
const { obtenerValorUf } = require('../services/indicadores.service');

// GET /api/indicadores/uf
router.get('/uf', async (req, res) => {
  try {
    const data = await obtenerValorUf();
    return enviarRespuesta(res, 200, 'Valor diario de la UF obtenido correctamente.', data);
  } catch (error) {
    console.error('Error en GET /api/indicadores/uf:', error);
    return enviarRespuesta(res, 500, 'No se pudo obtener el valor de la UF.', null);
  }
});

module.exports = router;
