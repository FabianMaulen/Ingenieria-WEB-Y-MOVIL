const router = require('express').Router();
const { verificarToken } = require('../middlewares/auth');
const bovedaController = require('../controllers/boveda.controller');

router.use(verificarToken);

router.get('/kit-emergencia', bovedaController.descargarKitEmergencia);

module.exports = router;
