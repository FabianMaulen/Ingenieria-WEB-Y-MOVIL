const router = require('express').Router();
const { verificarToken } = require('../middlewares/auth');
const checkinController = require('../controllers/checkin.controller');

// Modelo dual: todo usuario autenticado gestiona el check-in de su propia bóveda
router.use(verificarToken);

router.get('/', checkinController.obtener);
router.post('/', checkinController.confirmar);

module.exports = router;
