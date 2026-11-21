const router = require('express').Router();
const { verificarToken } = require('../middlewares/auth');
const albaceasController = require('../controllers/albaceas.controller');

// Modelo dual: todo usuario autenticado gestiona su propio directorio de albaceas
router.use(verificarToken);

router.get('/', albaceasController.listar);
router.post('/', albaceasController.crear);
router.delete('/:id', albaceasController.eliminar);

module.exports = router;
