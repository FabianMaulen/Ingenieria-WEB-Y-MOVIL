const router = require('express').Router();
const { verificarToken } = require('../middlewares/auth');
const solicitudesController = require('../controllers/solicitudes.controller');

// Modelo dual: todo usuario autenticado puede actuar como albacea (crear/mias) o titular (alertas/cancelar)
router.use(verificarToken);

router.post('/', solicitudesController.subirCertificado, solicitudesController.crear);
router.get('/mias', solicitudesController.mias);
router.get('/alertas', solicitudesController.alertas);
router.put('/reportes-familiares/:id/cancelar', solicitudesController.cancelarReporteFamiliar);
router.put('/:id/cancelar', solicitudesController.cancelar);

module.exports = router;
