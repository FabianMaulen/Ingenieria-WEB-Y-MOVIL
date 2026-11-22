const router = require('express').Router();
const { verificarToken, soloRol } = require('../middlewares/auth');
const adminController = require('../controllers/admin.controller');

// Acceso exclusivo para Superusuario / Soporte (rol ADMIN)
router.use(verificarToken, soloRol('ADMIN'));

router.get('/resumen', adminController.obtenerResumen);
router.get('/usuarios', adminController.listarUsuarios);
router.put('/usuarios/:id', adminController.actualizarUsuario);
router.delete('/usuarios/:id', adminController.eliminarUsuario);
router.get('/auditoria', adminController.listarAuditoria);
router.get('/solicitudes', adminController.listarSolicitudes);
router.put('/solicitudes/:id/estado', adminController.actualizarEstadoSolicitud);
router.get('/reportes-familiares', adminController.listarReportesFamiliares);
router.put('/reportes-familiares/:id/estado', adminController.actualizarEstadoReporteFamiliar);
router.get('/archivos/:tipo/:id', adminController.descargarCertificado);
router.post('/vigilancia/ejecutar', adminController.ejecutarVigilancia);
router.get('/tickets', adminController.listarTickets);
router.put('/tickets/:id', adminController.gestionarTicket);

module.exports = router;
