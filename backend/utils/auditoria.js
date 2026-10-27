const db = require('../db');

// RNF-05: registra eventos críticos. Un fallo aquí no debe tumbar la petición principal.
exports.registrarAuditoria = async (accion, ip, id_usuario) => {
    try {
        await db.query(
            'INSERT INTO AUDITORIA (accion, direccion_ip, id_usuario) VALUES ($1, $2, $3)',
            [accion, ip || 'desconocida', id_usuario || null]
        );
    } catch (e) {
        console.error('Error al registrar auditoría:', e);
    }
};