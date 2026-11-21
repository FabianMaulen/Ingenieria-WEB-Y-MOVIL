const router = require('express').Router();
const { verificarToken, soloRol } = require('../middlewares/auth');
const adminController = require('../controllers/admin.controller');

// Acceso exclusivo para Superusuario / Soporte (rol ADMIN)
router.use(verificarToken, soloRol('ADMIN'));

router.get('/resumen', adminController.obtenerResumen);
router.get('/usuarios', adminController.listarUsuarios);
router.get('/auditoria', adminController.listarAuditoria);
router.get('/solicitudes', adminController.listarSolicitudes);
router.put('/solicitudes/:id/estado', adminController.actualizarEstadoSolicitud);

module.exports = router;
