const crypto = require('crypto');
const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { obtenerIp, parsearIdEntero } = require('../utils/validadores');
const { enviarMensajeSoporte } = require('../services/email.service');

// POST /api/soporte/contacto
exports.enviarContacto = async (req, res) => {
  try {
    const { categoria, mensaje, id_solicitud_asociada, id_reporte_asociado } = req.body || {};
    const categoriaLimpia = String(categoria || 'Consulta general').trim().slice(0, 80);
    const mensajeLimpio = String(mensaje || '').trim();

    if (mensajeLimpio.length < 10) {
      return enviarRespuesta(
        res,
        400,
        'Por favor describe tu inconveniente con al menos 10 caracteres para poder ayudarte.',
        null
      );
    }

    if (mensajeLimpio.length > 1500) {
      return enviarRespuesta(res, 400, 'El mensaje no puede superar los 1500 caracteres.', null);
    }

    const { rows } = await db.query(
      'SELECT nombre_usuario, correo_usuario, rut FROM USUARIO WHERE id_usuario = $1',
      [req.user.id]
    );
    const u = rows[0];
    if (!u) return enviarRespuesta(res, 404, 'Usuario no encontrado.', null);

    // Validar opcionalmente el ID de solicitud o reporte asociado al usuario
    let idSolValido = null;
    let idRepValido = null;
    let referenciaCaso = null;

    if (id_solicitud_asociada) {
      const parsed = parsearIdEntero(id_solicitud_asociada);
      if (parsed) {
        const sCheck = await db.query(
          'SELECT id_solicitud FROM SOLICITUD_APERTURA WHERE id_solicitud = $1 AND id_usuario = $2',
          [parsed, req.user.id]
        );
        if (sCheck.rows[0]) {
          idSolValido = parsed;
          referenciaCaso = `Solicitud de apertura #${parsed}`;
        }
      }
    }

    if (id_reporte_asociado) {
      const parsed = parsearIdEntero(id_reporte_asociado);
      if (parsed) {
        const rCheck = await db.query(
          'SELECT id_reporte FROM REPORTE_FAMILIAR WHERE id_reporte = $1 AND id_titular_encontrado = $2',
          [parsed, req.user.id]
        );
        if (rCheck.rows[0]) {
          idRepValido = parsed;
          referenciaCaso = `Reporte familiar #${parsed}`;
        }
      }
    }

    // Generar código único legible para el ticket (ej. TK-2026-A3F9)
    const anio = new Date().getFullYear();
    const sufijo = crypto.randomBytes(2).toString('hex').toUpperCase();
    const codigoTicket = `TK-${anio}-${sufijo}`;

    const insertRes = await db.query(
      `INSERT INTO TICKET_SOPORTE
         (codigo_ticket, id_usuario, categoria, mensaje, estado_ticket, id_solicitud_asociada, id_reporte_asociado)
       VALUES ($1, $2, $3, $4, 'ABIERTO', $5, $6)
       RETURNING id_ticket, codigo_ticket, categoria, estado_ticket, id_solicitud_asociada, id_reporte_asociado, fecha_creacion`,
      [codigoTicket, req.user.id, categoriaLimpia, mensajeLimpio, idSolValido, idRepValido]
    );

    const ticket = insertRes.rows[0];

    await enviarMensajeSoporte({
      codigoTicket: ticket.codigo_ticket,
      nombreUsuario: u.nombre_usuario,
      correoUsuario: u.correo_usuario,
      rutUsuario: u.rut,
      categoria: categoriaLimpia,
      mensaje: mensajeLimpio,
      referenciaCaso,
    });

    await registrarAuditoria(
      `[SOPORTE ${ticket.codigo_ticket}] ${categoriaLimpia}${referenciaCaso ? ` (${referenciaCaso})` : ''}: ${mensajeLimpio.slice(0, 90)}`,
      obtenerIp(req),
      req.user.id
    );

    return enviarRespuesta(
      res,
      201,
      `Ticket ${ticket.codigo_ticket} creado correctamente. Enviamos confirmación a tu correo y notificamos a soporte.`,
      ticket
    );
  } catch (error) {
    console.error('Error en soporte.enviarContacto:', error);
    return enviarRespuesta(res, 500, 'No se pudo registrar el ticket de soporte. Intenta nuevamente.', null);
  }
};

// GET /api/soporte/mis-tickets
exports.misTickets = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id_ticket, codigo_ticket, categoria, mensaje, estado_ticket, respuesta_admin,
              id_solicitud_asociada, id_reporte_asociado, fecha_creacion, fecha_actualizacion
       FROM TICKET_SOPORTE
       WHERE id_usuario = $1
       ORDER BY fecha_creacion DESC`,
      [req.user.id]
    );
    return enviarRespuesta(res, 200, 'Tickets de soporte obtenidos correctamente.', rows);
  } catch (error) {
    console.error('Error en soporte.misTickets:', error);
    return enviarRespuesta(res, 500, 'Error al obtener tus tickets de soporte.', null);
  }
};
