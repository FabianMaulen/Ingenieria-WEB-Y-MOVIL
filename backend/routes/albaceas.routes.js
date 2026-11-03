const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, soloRol } = require('../middlewares/auth');
const { registrarAuditoria } = require('../utils/auditoria'); // RNF-05

// Todas las rutas exigen token válido y rol TITULAR
router.use(verificarToken, soloRol('TITULAR'));

// RF-02: Listar albaceas del titular autenticado
router.get('/', async (req, res) => {
    try {
        const id_titular = req.user.id; // Extraído de forma consistente del token firmado
        const query = `
            SELECT d.id_directorio, u.nombre_usuario, u.rut, u.correo_usuario,
                   d.parentesco, d.estado_validacion
            FROM DIRECTORIO_ALBACEAS d
            JOIN USUARIO u ON d.id_usuario_invitado = u.id_usuario
            WHERE d.id_titular = $1
            ORDER BY d.id_directorio
        `;
        const resultado = await db.query(query, [id_titular]);
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el directorio de albaceas.' });
    }
});

// RF-02: Agregar un nuevo albacea por RUT
router.post('/', async (req, res) => {
    const { rut_invitado, parentesco } = req.body || {};
    const id_titular = req.user.id; // Extraído consistentemente
    const ip = req.ip || req.connection.remoteAddress;

    if (!rut_invitado || !parentesco) {
        return res.status(400).json({ error: 'rut_invitado y parentesco son obligatorios.' });
    }

    try {
        // 1. Verificar si el usuario invitado existe en la BD
        const userQuery = await db.query(
            'SELECT id_usuario FROM USUARIO WHERE rut = $1', [rut_invitado]);
        if (userQuery.rows.length === 0) {
            return res.status(404).json({
                error: 'El RUT ingresado no corresponde a un usuario registrado en el sistema.'
            });
        }
        const id_usuario_invitado = userQuery.rows[0].id_usuario;

        // 2. No puede designarse a sí mismo
        if (id_usuario_invitado === id_titular) {
            return res.status(400).json({ error: 'No puedes designarte a ti mismo como albacea.' });
        }

        // 3. Límite máximo de 3 albaceas
        const countQuery = await db.query(
            'SELECT COUNT(*) FROM DIRECTORIO_ALBACEAS WHERE id_titular = $1', [id_titular]);
        if (parseInt(countQuery.rows[0].count, 10) >= 3) {
            return res.status(400).json({
                error: 'Ya has alcanzado el límite máximo de 3 albaceas permitidos.'
            });
        }

        // 4. Insertar la relación en el directorio
        const insertQuery = `
            INSERT INTO DIRECTORIO_ALBACEAS (id_titular, id_usuario_invitado, parentesco, estado_validacion)
            VALUES ($1, $2, $3, 'PENDIENTE') RETURNING *
        `;
        const nuevo = await db.query(insertQuery, [id_titular, id_usuario_invitado, parentesco]);

        // 5. Registrar evento crítico en Auditoría (RNF-05)
        await registrarAuditoria(
            `Agregó un nuevo albacea (ID: ${id_usuario_invitado})`, ip, id_titular);

        res.status(201).json({ mensaje: 'Albacea agregado con éxito', data: nuevo.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Este usuario ya está registrado como tu albacea.' });
        }
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// RF-02: Quitar un albacea del directorio
router.delete('/:id', async (req, res) => {
    const id_titular = req.user.id;
    const ip = req.ip || req.connection.remoteAddress;

    try {
        const r = await db.query(
            'DELETE FROM DIRECTORIO_ALBACEAS WHERE id_directorio = $1 AND id_titular = $2',
            [req.params.id, id_titular]);
        if (r.rowCount === 0) {
            return res.status(404).json({ error: 'Albacea no encontrado.' });
        }

        // Auditoría (RNF-05)[cite: 8]
        await registrarAuditoria(
            `Eliminó un albacea del directorio (ID directorio: ${req.params.id})`, ip, id_titular);

        res.status(204).send();
    } catch (error) {
        // 23503: el albacea tiene solicitudes de apertura asociadas
        if (error.code === '23503') {
            return res.status(409).json({
                error: 'No se puede eliminar: el albacea tiene solicitudes asociadas.'
            });
        }
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;