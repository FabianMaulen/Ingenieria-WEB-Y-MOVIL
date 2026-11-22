const router = require('express').Router();
const { verificarToken } = require('../middlewares/auth');
const mensajesController = require('../controllers/mensajes.controller');

// Modelo dual: todo usuario autenticado gestiona sus propios mensajes póstumos sellados
router.use(verificarToken);

router.get('/', mensajesController.listar);
router.post('/', mensajesController.subirAdjuntoOpcional, mensajesController.crear);
router.get('/:id/adjunto', mensajesController.descargarAdjunto);
router.put('/:id', mensajesController.actualizar);
router.delete('/:id', mensajesController.eliminar);

module.exports = router;
