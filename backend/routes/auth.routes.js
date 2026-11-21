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

// Protección contra abuso en solicitudes de recuperación de contraseña
const recoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    mensaje: 'Demasiadas solicitudes de recuperación. Intenta nuevamente en 15 minutos.',
    data: null,
  },
});

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/forgot-password', recoveryLimiter, authController.forgotPassword);
router.post('/reset-password', recoveryLimiter, authController.resetPassword);
router.get('/perfil', verificarToken, authController.perfil);
router.put('/change-password', verificarToken, authController.changePassword);

module.exports = router;
