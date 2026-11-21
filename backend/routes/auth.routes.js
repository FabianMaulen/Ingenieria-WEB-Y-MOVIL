const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { verificarToken } = require('../middlewares/auth');
const authController = require('../controllers/auth.controller');

// Protección contra fuerza bruta en el inicio de sesión
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    mensaje: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.',
    data: null,
  },
});

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.get('/perfil', verificarToken, authController.perfil);
router.put('/change-password', verificarToken, authController.changePassword);

module.exports = router;
