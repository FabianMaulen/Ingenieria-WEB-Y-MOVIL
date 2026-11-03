const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, soloRol } = require('../middlewares/auth');
const { registrarAuditoria } = require('../utils/auditoria'); // RNF-05
const { aprobarVencidas } = require('../utils/solicitudes');
const { contactoAseguradora } = require('../utils/aseguradoras');

// Solo albaceas autenticados; antes de cada consulta se aprueban las solicitudes vencidas
router.use(verificarToken, soloRol('ALBACEA'));
router.use(async (req, res, next) => {
    try {
        await aprobarVencidas();
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

const ipDe = (req) => req.ip || req.connection.remoteAddress;

// RF-07: pólizas liberadas con contacto de cada compañía
// GET /api/guia
// Solo devuelve datos si existe una solicitud APROBADA hecha por este albacea.
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT p.id_poliza, p.tipo_seguro, p.aseguradora, p.numero_poliza,
                    p.ubicacion_fisica, p.monto_referencial, p.tramitada,
                    t.id_usuario AS id_titular, t.nombre_usuario AS nombre_titular
             FROM SOLICITUD_APERTURA s
             JOIN DIRECTORIO_ALBACEAS d ON d.id_directorio = s.id_albacea
             JOIN USUARIO t ON t.id_usuario = s.id_usuario
             JOIN POLIZA p ON p.id_usuario = s.id_usuario
             WHERE d.id_usuario_invitado = $1 AND s.estado_solicitud = 'APROBADA'
             ORDER BY t.id_usuario, p.id_poliza`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.json({
                polizas: [],
                resumen: { total: 0, tramitadas: 0 },
                mensaje: 'Aún no tienes una apertura aprobada o el titular no registró pólizas.'
            });
        }

        const polizas = rows.map((p) => ({ ...p, contacto: contactoAseguradora(p.aseguradora) }));

        await registrarAuditoria(
            `Consultó la guía de cobro de seguros (${polizas.length} pólizas)`,
            ipDe(req),
            req.user.id
        );

        res.json({
            polizas,
            resumen: { total: polizas.length, tramitadas: polizas.filter((p) => p.tramitada).length }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// RF-07: marcar o desmarcar una póliza como tramitada (checklist)
// PUT /api/guia/polizas/:id/tramitada   body: { "tramitada": true }
router.put('/polizas/:id/tramitada', async (req, res) => {
    const id = Number(req.params.id);
    const { tramitada } = req.body || {};

    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID inválido.' });
    if (typeof tramitada !== 'boolean')
        return res.status(400).json({ error: 'tramitada debe ser true o false.' });

    try {
        const { rows } = await db.query(
            `UPDATE POLIZA p
             SET tramitada = $1
             FROM SOLICITUD_APERTURA s
             JOIN DIRECTORIO_ALBACEAS d ON d.id_directorio = s.id_albacea
             WHERE p.id_poliza = $2
               AND p.id_usuario = s.id_usuario
               AND s.estado_solicitud = 'APROBADA'
               AND d.id_usuario_invitado = $3
             RETURNING p.id_poliza, p.aseguradora, p.numero_poliza, p.tramitada`,
            [tramitada, id, req.user.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Póliza no encontrada o sin acceso autorizado.' });
        }

        await registrarAuditoria(
            `Marcó la póliza ${id} como ${tramitada ? 'tramitada' : 'pendiente'}`,
            ipDe(req),
            req.user.id
        );
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;