const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { verificarToken } = require('../middlewares/auth');
const authController = require('../controllers/auth.controller');
const oauthController = require('../controllers/oauth.controller');

// Protección contra fuerza bruta en el inicio de sesión
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  skip: () => process.env.NODE_ENV === 'test',
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
  skip: () => process.env.NODE_ENV === 'test',
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

// Confirmación de correo vía enlace directo (desde Gmail)
router.get('/verificar-correo/enlace', authController.confirmarVerificacionPorEnlace);

// Google OAuth 2.0 (Authorization Code + state + PKCE S256)
router.get('/google/url', oauthController.obtenerUrlGoogle);
router.post('/google', oauthController.callbackGoogle);

router.get('/perfil', verificarToken, authController.perfil);
router.put('/preferencias', verificarToken, authController.actualizarPreferencias);
router.post('/verificar-correo/enviar', verificarToken, authController.enviarCodigoVerificacion);
router.post('/verificar-correo/confirmar', verificarToken, authController.confirmarVerificacionCorreo);
router.put('/change-password', verificarToken, authController.changePassword);
router.put('/completar-rut', verificarToken, authController.completarRut);

module.exports = router;
