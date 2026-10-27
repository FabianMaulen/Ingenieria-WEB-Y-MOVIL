const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, soloRol } = require('../middlewares/auth');
const { registrarAuditoria } = require('../utils/auditoria');

// Exigimos que el usuario tenga un token válido y sea TITULAR
router.use(verificarToken, soloRol('TITULAR'));

// RF-04: Realizar Check-in de vigencia[cite: 5]
router.post('/', async (req, res) => {
    const id_titular = req.user.id; // Extraído del token
    const ip = req.ip || req.connection.remoteAddress;

    try {
        // Actualizamos la fecha del último check-in a la fecha y hora actual 
        const query = `
            UPDATE USUARIO 
            SET fecha_ultimo_checkin = CURRENT_TIMESTAMP 
            WHERE id_usuario = $1 
            RETURNING fecha_ultimo_checkin
        `;
        const resultado = await db.query(query, [id_titular]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Usuario titular no encontrado.' });
        }

        // RNF-05: Registramos este evento crítico en la Auditoría
        await registrarAuditoria('Realizó check-in de vigencia en la bóveda', ip, id_titular);

        res.status(200).json({ 
            mensaje: 'Check-in realizado con éxito. Bóveda renovada.', 
            fecha_checkin: resultado.rows[0].fecha_ultimo_checkin 
        });

    } catch (error) {
        console.error('Error en check-in:', error);
        res.status(500).json({ error: 'Error interno del servidor al realizar el check-in.' });
    }
});

module.exports = router;