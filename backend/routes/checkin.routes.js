const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, soloRol } = require('../middlewares/auth');
const { registrarAuditoria } = require('../utils/auditoria');

// Exigimos token válido y rol TITULAR
router.use(verificarToken, soloRol('TITULAR'));

// GET /api/checkin: Consultar estado de presencia del titular
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT fecha_ultimo_checkin,
                   EXTRACT(DAY FROM (NOW() - fecha_ultimo_checkin))::int AS dias_desde_ultimo
            FROM USUARIO
            WHERE id_usuario = $1
        `;
        const { rows } = await db.query(query, [req.user.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener check-in:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// RF-04: Realizar Check-in de vigencia y anular aperturas pendientes
router.post('/', async (req, res) => {
    const id_titular = req.user.id;
    const ip = req.ip || req.connection.remoteAddress;

    try {
        // 1. Actualizamos la fecha del último check-in
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

        // 2. Si existía alguna solicitud de apertura PENDIENTE, se cancela automáticamente al confirmar presencia
        await db.query(
            `UPDATE SOLICITUD_APERTURA 
             SET estado_solicitud = 'CANCELADA' 
             WHERE id_usuario = $1 AND estado_solicitud = 'PENDIENTE'`,
            [id_titular]
        );

        // RNF-05: Auditoría
        await registrarAuditoria('Realizó check-in de vigencia en la bóveda', ip, id_titular);

        res.status(200).json({ 
            mensaje: 'Check-in realizado con éxito. Bóveda renovada por 180 días.', 
            fecha_checkin: resultado.rows[0].fecha_ultimo_checkin 
        });

    } catch (error) {
        console.error('Error en check-in:', error);
        res.status(500).json({ error: 'Error interno del servidor al realizar el check-in.' });
    }
});

module.exports = router;