const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const db = require('../db');
const { verificarToken, soloRol } = require('../middlewares/auth');
const { registrarAuditoria } = require('../utils/auditoria'); // RNF-05
const { PLAZO_HORAS, aprobarVencidas } = require('../utils/solicitudes');

// ---------- Subida del certificado de defunción ----------
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'certificados');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXTENSIONES = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png' };

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) =>
        EXTENSIONES[file.mimetype] ? cb(null, true) : cb(new Error('FORMATO'))
}).single('certificado');

const subirCertificado = (req, res, next) => {
    upload(req, res, (err) => {
        if (!err) return next();
        if (err.code === 'LIMIT_FILE_SIZE')
            return res.status(400).json({ error: 'El archivo supera los 5 MB.' });
        if (err.message === 'FORMATO')
            return res.status(400).json({ error: 'Formato no permitido. Usa PDF, JPG o PNG.' });
        console.error(err);
        res.status(400).json({ error: 'No se pudo procesar el archivo.' });
    });
};

const ipDe = (req) => req.ip || req.connection.remoteAddress;

// ---------- RF-05: el albacea solicita la apertura ----------
// POST /api/solicitudes  (multipart/form-data: rut_titular + certificado)
router.post('/', verificarToken, soloRol('ALBACEA'), subirCertificado, async (req, res) => {
    const { rut_titular } = req.body || {};
    let nombreArchivo = null;

    if (!rut_titular || !req.file) {
        return res.status(400).json({
            error: 'rut_titular y el archivo certificado (PDF, JPG o PNG) son obligatorios.'
        });
    }

    try {
        await aprobarVencidas();

        // 1. El solicitante debe estar en el directorio de albaceas de ese titular.
        //    Mismo mensaje si el RUT no existe o no lo designó (no revela cuál).
        const dir = await db.query(
            `SELECT d.id_directorio, d.id_titular
             FROM DIRECTORIO_ALBACEAS d
             JOIN USUARIO t ON t.id_usuario = d.id_titular
             WHERE t.rut = $1 AND d.id_usuario_invitado = $2`,
            [rut_titular, req.user.id]
        );
        if (dir.rows.length === 0) {
            return res.status(403).json({
                error: 'No figuras como albacea designado de ese titular.'
            });
        }
        const { id_directorio, id_titular } = dir.rows[0];

        // 2. Una sola solicitud activa por titular
        const activa = await db.query(
            `SELECT estado_solicitud FROM SOLICITUD_APERTURA
             WHERE id_usuario = $1 AND estado_solicitud IN ('PENDIENTE', 'APROBADA')`,
            [id_titular]
        );
        if (activa.rows.length > 0) {
            return res.status(409).json({
                error: 'Ya existe una solicitud de apertura activa para este titular.'
            });
        }

        // 3. Hash SHA-256 del documento (RNF-02) y guardado del archivo
        const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
        nombreArchivo = `${crypto.randomUUID()}${EXTENSIONES[req.file.mimetype]}`;
        await fs.promises.writeFile(path.join(UPLOAD_DIR, nombreArchivo), req.file.buffer);

        // 4. Registrar la solicitud
        const { rows } = await db.query(
            `INSERT INTO SOLICITUD_APERTURA
               (certificado_defuncion, hash_documento, estado_solicitud, id_usuario, id_albacea)
             VALUES ($1, $2, 'PENDIENTE', $3, $4)
             RETURNING id_solicitud, estado_solicitud, fecha_solicitud,
                       fecha_solicitud + make_interval(hours => $5::int) AS fecha_limite_cancelacion`,
            [nombreArchivo, hash, id_titular, id_directorio, PLAZO_HORAS]
        );

        await registrarAuditoria(
            `Solicitó la apertura del baúl del titular ID ${id_titular} (solicitud ${rows[0].id_solicitud}, SHA-256 ${hash.slice(0, 12)}...)`,
            ipDe(req),
            req.user.id
        );

        res.status(201).json({
            mensaje: `Solicitud registrada. El titular dispone de ${PLAZO_HORAS} horas para cancelarla.`,
            data: rows[0]
        });
    } catch (error) {
        if (nombreArchivo) fs.promises.unlink(path.join(UPLOAD_DIR, nombreArchivo)).catch(() => {});
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ---------- RF-05: el albacea revisa el estado de sus solicitudes ----------
// GET /api/solicitudes/mias
router.get('/mias', verificarToken, soloRol('ALBACEA'), async (req, res) => {
    try {
        await aprobarVencidas();
        const { rows } = await db.query(
            `SELECT s.id_solicitud, s.estado_solicitud, s.fecha_solicitud,
                    s.fecha_solicitud + make_interval(hours => $2::int) AS fecha_limite,
                    t.nombre_usuario AS nombre_titular
             FROM SOLICITUD_APERTURA s
             JOIN DIRECTORIO_ALBACEAS d ON d.id_directorio = s.id_albacea
             JOIN USUARIO t ON t.id_usuario = s.id_usuario
             WHERE d.id_usuario_invitado = $1
             ORDER BY s.fecha_solicitud DESC`,
            [req.user.id, PLAZO_HORAS]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ---------- RF-06: el titular ve las alertas de apertura ----------
// GET /api/solicitudes/alertas
router.get('/alertas', verificarToken, soloRol('TITULAR'), async (req, res) => {
    try {
        await aprobarVencidas();
        const { rows } = await db.query(
            `SELECT s.id_solicitud, s.estado_solicitud, s.fecha_solicitud,
                    s.fecha_solicitud + make_interval(hours => $2::int) AS fecha_limite,
                    (s.estado_solicitud = 'PENDIENTE') AS puede_cancelar,
                    u.nombre_usuario AS nombre_albacea, u.rut AS rut_albacea, d.parentesco
             FROM SOLICITUD_APERTURA s
             JOIN DIRECTORIO_ALBACEAS d ON d.id_directorio = s.id_albacea
             JOIN USUARIO u ON u.id_usuario = d.id_usuario_invitado
             WHERE s.id_usuario = $1
             ORDER BY s.fecha_solicitud DESC`,
            [req.user.id, PLAZO_HORAS]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ---------- RF-06: cancelación por gracia (un solo clic) ----------
// PUT /api/solicitudes/:id/cancelar
router.put('/:id/cancelar', verificarToken, soloRol('TITULAR'), async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID inválido.' });

    try {
        // Las vencidas pasan a APROBADA primero, así que ya no se pueden cancelar
        await aprobarVencidas();

        const { rows } = await db.query(
            `UPDATE SOLICITUD_APERTURA
             SET estado_solicitud = 'CANCELADA'
             WHERE id_solicitud = $1 AND id_usuario = $2 AND estado_solicitud = 'PENDIENTE'
             RETURNING id_solicitud, estado_solicitud`,
            [id, req.user.id]
        );

        if (rows.length === 0) {
            const existe = await db.query(
                'SELECT estado_solicitud FROM SOLICITUD_APERTURA WHERE id_solicitud = $1 AND id_usuario = $2',
                [id, req.user.id]
            );
            if (existe.rows.length === 0)
                return res.status(404).json({ error: 'Solicitud no encontrada.' });
            return res.status(409).json({
                error: `La solicitud ya está ${existe.rows[0].estado_solicitud.toLowerCase()} y no se puede cancelar.`
            });
        }

        await registrarAuditoria(
            `Canceló la solicitud de apertura ${id} dentro del plazo de gracia`,
            ipDe(req),
            req.user.id
        );
        res.json({ mensaje: 'Solicitud cancelada. El baúl permanece sellado.', data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;