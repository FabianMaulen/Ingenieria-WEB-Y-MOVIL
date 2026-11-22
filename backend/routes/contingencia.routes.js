const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const contingenciaController = require('../controllers/contingencia.controller');

const contingenciaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    mensaje: 'Demasiadas consultas en poco tiempo. Intenta nuevamente en 15 minutos.',
    data: null,
  },
});

router.post('/consultar', contingenciaLimiter, contingenciaController.consultarExistencia);
router.post(
  '/reportar',
  contingenciaLimiter,
  contingenciaController.subirCertificadoFamiliar,
  contingenciaController.crearReporteFamiliar
);

module.exports = router;
