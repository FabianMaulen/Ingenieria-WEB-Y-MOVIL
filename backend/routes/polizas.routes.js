const router = require('express').Router();
const { verificarToken } = require('../middlewares/auth');
const polizasController = require('../controllers/polizas.controller');

// Modelo dual: todo usuario autenticado puede gestionar sus propias pólizas
router.use(verificarToken);

router.get('/', polizasController.listar);
router.get('/:id', polizasController.obtener);
router.post('/', polizasController.crear);
router.put('/:id', polizasController.actualizar);
router.delete('/:id', polizasController.eliminar);

module.exports = router;
