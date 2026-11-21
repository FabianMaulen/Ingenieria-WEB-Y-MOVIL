const router = require('express').Router();
const { verificarToken } = require('../middlewares/auth');
const inventarioController = require('../controllers/inventario.controller');

router.use(verificarToken);

router.get('/', inventarioController.listar);
router.get('/:id', inventarioController.obtener);
router.post('/', inventarioController.crear);
router.put('/:id', inventarioController.actualizar);
router.delete('/:id', inventarioController.eliminar);

module.exports = router;
