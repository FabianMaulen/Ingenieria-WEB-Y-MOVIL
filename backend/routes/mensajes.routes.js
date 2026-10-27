const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, soloRol } = require('../middlewares/auth');
const { cifrarTexto } = require('../utils/cifrado'); // RNF-03
const { registrarAuditoria } = require('../utils/auditoria'); // RNF-05

// Exigimos token válido y rol TITULAR
router.use(verificarToken, soloRol('TITULAR'));

// RF-03: Listar mensajes del titular (solo metadatos; el contenido permanece sellado)
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT m.id_mensaje, m.fecha_creacion, m.rut_destinatario, u.nombre_usuario AS nombre_destinatario
             FROM MENSAJE_POSTUMO m
             LEFT JOIN USUARIO u ON u.rut = m.rut_destinatario
             WHERE m.id_usuario = $1
             ORDER BY m.id_mensaje`,
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los mensajes.' });
    }
});

// RF-03: Redactar un nuevo mensaje póstumo sellado
router.post('/', async (req, res) => {
    const { rut_destinatario, contenido } = req.body || {};
    const id_titular = req.user.id;
    const ip = req.ip || req.connection.remoteAddress;

    if (!rut_destinatario || !contenido) {
        return res.status(400).json({ error: 'El RUT del destinatario y el contenido son obligatorios.' });
    }

    try {
        // 1. Verificar si el destinatario existe en la BD
        const userQuery = await db.query(
            'SELECT id_usuario FROM USUARIO WHERE rut = $1', [rut_destinatario]
        );
        if (userQuery.rows.length === 0) {
            return res.status(404).json({
                error: 'El RUT ingresado no corresponde a un usuario registrado.'
            });
        }
        const id_destinatario = userQuery.rows[0].id_usuario;

        // 2. Verificar que el destinatario sea un albacea del titular
        const albaceaQuery = await db.query(
            'SELECT id_directorio FROM DIRECTORIO_ALBACEAS WHERE id_titular = $1 AND id_usuario_invitado = $2',
            [id_titular, id_destinatario]
        );
        if (albaceaQuery.rows.length === 0) {
            return res.status(403).json({
                error: 'Solo puedes enviar mensajes a contactos de tu Directorio de Albaceas.'
            });
        }

        // 3. Cifrar el mensaje con AES-256 (RNF-03)
        const contenidoCifrado = cifrarTexto(contenido);

        // 4. Insertar (columnas reales de MENSAJE_POSTUMO)
        const { rows } = await db.query(
            `INSERT INTO MENSAJE_POSTUMO (contenido_cifrado, rut_destinatario, id_usuario)
             VALUES ($1, $2, $3)
             RETURNING id_mensaje, fecha_creacion, rut_destinatario`,
            [contenidoCifrado, rut_destinatario, id_titular]
        );

        // 5. Auditoría (RNF-05)
        await registrarAuditoria(
            `Redactó un mensaje sellado (ID Mensaje: ${rows[0].id_mensaje}) para el RUT ${rut_destinatario}`,
            ip,
            id_titular
        );

        res.status(201).json({
            mensaje: 'Mensaje sellado y cifrado con éxito. Se mantendrá oculto hasta la apertura.',
            data: rows[0]
        });
    } catch (error) {
        console.error('Error al guardar el mensaje:', error);
        res.status(500).json({ error: 'Error interno del servidor al procesar el mensaje.' });
    }
});

// RF-03: Reescribir el contenido de un mensaje propio
router.put('/:id', async (req, res) => {
    const { contenido } = req.body || {};
    const id_titular = req.user.id;
    const ip = req.ip || req.connection.remoteAddress;

    if (!contenido) {
        return res.status(400).json({ error: 'El contenido es obligatorio.' });
    }

    try {
        const { rows } = await db.query(
            `UPDATE MENSAJE_POSTUMO SET contenido_cifrado = $1
             WHERE id_mensaje = $2 AND id_usuario = $3
             RETURNING id_mensaje, fecha_creacion, rut_destinatario`,
            [cifrarTexto(contenido), req.params.id, id_titular]
        );
        if (!rows[0]) return res.status(404).json({ error: 'Mensaje no encontrado.' });

        await registrarAuditoria(`Modificó el mensaje sellado (ID Mensaje: ${req.params.id})`, ip, id_titular);
        res.json({ mensaje: 'Mensaje actualizado y sellado de nuevo.', data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// RF-03: Eliminar un mensaje propio
router.delete('/:id', async (req, res) => {
    const id_titular = req.user.id;
    const ip = req.ip || req.connection.remoteAddress;

    try {
        const r = await db.query(
            'DELETE FROM MENSAJE_POSTUMO WHERE id_mensaje = $1 AND id_usuario = $2',
            [req.params.id, id_titular]
        );
        if (r.rowCount === 0) return res.status(404).json({ error: 'Mensaje no encontrado.' });

        await registrarAuditoria(`Eliminó el mensaje sellado (ID Mensaje: ${req.params.id})`, ip, id_titular);
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;