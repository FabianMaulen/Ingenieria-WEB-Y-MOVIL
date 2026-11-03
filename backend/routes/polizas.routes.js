const router = require('express').Router();
const { verificarToken, soloRol } = require('../middlewares/auth');
const c = require('../controllers/polizas.controller');

router.use(verificarToken, soloRol('TITULAR'));

router.get('/', c.listar);
router.get('/:id', c.obtener);
router.post('/', c.crear);
router.put('/:id', c.actualizar);
router.delete('/:id', c.eliminar);

module.exports = router;

