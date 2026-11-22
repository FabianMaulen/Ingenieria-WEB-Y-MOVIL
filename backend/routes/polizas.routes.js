const router = require('express').Router();
const { verificarToken } = require('../middlewares/auth');
const polizasController = require('../controllers/polizas.controller');

// Modelo dual: todo usuario autenticado puede gestionar sus propias pólizas
router.use(verificarToken);

// Extracción asistida por IA (antes de /:id para evitar colisión de ruta)
router.post('/extraer', polizasController.subirArchivoPoliza, polizasController.extraerDesdeArchivo);

// Bóveda documental cifrada en reposo (subida, descarga descifrada y eliminación)
router.post('/:id/documento', polizasController.subirArchivoPoliza, polizasController.adjuntarDocumento);
router.get('/:id/documento', polizasController.descargarDocumento);
router.delete('/:id/documento', polizasController.eliminarDocumento);

router.get('/', polizasController.listar);
router.get('/:id', polizasController.obtener);
router.post('/', polizasController.crear);
router.put('/:id', polizasController.actualizar);
router.delete('/:id', polizasController.eliminar);

module.exports = router;
