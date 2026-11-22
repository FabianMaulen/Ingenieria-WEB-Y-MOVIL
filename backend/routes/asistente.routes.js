const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { verificarToken } = require('../middlewares/auth');
const asistenteController = require('../controllers/asistente.controller');

const asistenteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    mensaje: 'Has realizado muchas consultas al asistente. Intenta nuevamente en unos minutos.',
    data: null,
  },
});

router.use(verificarToken);
router.post('/preguntar', asistenteLimiter, asistenteController.preguntar);

module.exports = router;
