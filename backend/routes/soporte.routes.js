const router = require('express').Router();
const { verificarToken } = require('../middlewares/auth');
const soporteController = require('../controllers/soporte.controller');

router.use(verificarToken);
router.post('/contacto', soporteController.enviarContacto);
router.get('/mis-tickets', soporteController.misTickets);

module.exports = router;
