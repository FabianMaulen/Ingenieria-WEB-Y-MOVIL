const router = require('express').Router();
const { verificarToken } = require('../middlewares/auth');
const guiaController = require('../controllers/guia.controller');

// Modelo dual: cualquier usuario autenticado puede consultar sus designaciones y guía como albacea
router.use(verificarToken);
router.use(guiaController.sincronizarVencidas);

router.get('/', guiaController.obtenerGuia);
router.put('/polizas/:id/tramitada', guiaController.marcarTramitada);
router.get('/designaciones', guiaController.listarDesignaciones);
router.put('/designaciones/:id/responder', guiaController.responderDesignacion);

module.exports = router;
