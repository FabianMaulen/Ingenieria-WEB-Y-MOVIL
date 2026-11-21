const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { aprobarVencidas } = require('../utils/solicitudes');
const { contactoAseguradora } = require('../utils/aseguradoras');
const { parsearIdEntero, obtenerIp } = require('../utils/validadores');
const { enviarRespuestaDesignacion } = require('../services/email.service');

// Middleware de sincronización de solicitudes vencidas
exports.sincronizarVencidas = async (req, res, next) => {
  try {
    await aprobarVencidas();
    return next();
  } catch (error) {
    console.error('Error al aprobar solicitudes vencidas:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor.', null);
  }
};

// GET /api/guia (RF-07: pólizas liberadas con contacto de aseguradoras)
exports.obtenerGuia = async (req, res) => {
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
      return enviarRespuesta(
        res,
        200,
        'Aún no tienes una apertura aprobada o el titular no registró pólizas.',
        {
          polizas: [],
          resumen: { total: 0, tramitadas: 0 },
        }
      );
    }

    const polizas = rows.map((p) => ({
      ...p,
      contacto: contactoAseguradora(p.aseguradora),
    }));

    await registrarAuditoria(
      `Consultó la guía de cobro de seguros (${polizas.length} pólizas)`,
      obtenerIp(req),
      req.user.id
    );

    return enviarRespuesta(res, 200, 'Guía de cobro obtenida correctamente.', {
      polizas,
      resumen: {
        total: polizas.length,
        tramitadas: polizas.filter((p) => p.tramitada).length,
      },
    });
  } catch (error) {
    console.error('Error al obtener guía:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al obtener la guía.', null);
  }
};

// PUT /api/guia/polizas/:id/tramitada
exports.marcarTramitada = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador de póliza debe ser un entero positivo válido.', null);
    }

    const { tramitada } = req.body || {};
    if (typeof tramitada !== 'boolean') {
      return enviarRespuesta(res, 400, 'El campo tramitada debe ser booleano (true o false).', null);
    }

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
      return enviarRespuesta(res, 404, 'Póliza no encontrada o sin acceso autorizado.', null);
    }

    await registrarAuditoria(
      `Marcó la póliza ${id} como ${tramitada ? 'tramitada' : 'pendiente'}`,
      obtenerIp(req),
      req.user.id
    );

    return enviarRespuesta(res, 200, 'Estado de trámite actualizado correctamente.', rows[0]);
  } catch (error) {
    console.error('Error al actualizar estado de póliza:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor.', null);
  }
};

// GET /api/guia/designaciones
// Lista los titulares que han designado al usuario autenticado como albacea.
exports.listarDesignaciones = async (req, res) => {
  try {
    // Vinculación defensiva si existían invitaciones pendientes por el RUT del usuario actual
    const userRes = await db.query('SELECT rut FROM USUARIO WHERE id_usuario = $1', [req.user.id]);
    if (userRes.rows[0]?.rut) {
      await db.query(
        `UPDATE DIRECTORIO_ALBACEAS
         SET id_usuario_invitado = $1,
             estado_validacion = CASE
               WHEN estado_validacion = 'INVITADO' THEN 'PENDIENTE'
               ELSE estado_validacion
             END
         WHERE rut_albacea = $2 AND id_usuario_invitado IS NULL`,
        [req.user.id, userRes.rows[0].rut]
      );
    }

    const { rows } = await db.query(
      `SELECT d.id_directorio,
              d.id_titular,
              t.nombre_usuario AS nombre_titular,
              t.rut AS rut_titular,
              t.correo_usuario AS correo_titular,
              d.parentesco,
              d.estado_validacion,
              d.fecha_designacion
       FROM DIRECTORIO_ALBACEAS d
       JOIN USUARIO t ON t.id_usuario = d.id_titular
       WHERE d.id_usuario_invitado = $1
       ORDER BY d.fecha_designacion DESC, d.id_directorio DESC`,
      [req.user.id]
    );

    const meta = {
      total: rows.length,
      pendientes: rows.filter((r) => r.estado_validacion === 'PENDIENTE').length,
      validadas: rows.filter((r) => r.estado_validacion === 'VALIDADO').length,
      rechazadas: rows.filter((r) => r.estado_validacion === 'RECHAZADO').length,
    };

    return enviarRespuesta(res, 200, 'Designaciones obtenidas correctamente.', rows, meta);
  } catch (error) {
    console.error('Error al listar designaciones:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al obtener designaciones.', null);
  }
};

// PUT /api/guia/designaciones/:id/responder
// Permite al albacea aceptar ('VALIDADO') o rechazar ('RECHAZADO') una designación.
exports.responderDesignacion = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador de designación debe ser un entero positivo válido.', null);
    }

    const { estado, respuesta } = req.body || {};
    const valorBruto = String(estado || respuesta || '').trim().toUpperCase();

    const mapaEstados = {
      VALIDADO: 'VALIDADO',
      ACEPTADA: 'VALIDADO',
      ACEPTAR: 'VALIDADO',
      RECHAZADO: 'RECHAZADO',
      RECHAZADA: 'RECHAZADO',
      RECHAZAR: 'RECHAZADO',
    };

    const nuevoEstado = mapaEstados[valorBruto];
    if (!nuevoEstado) {
      return enviarRespuesta(res, 400, "Estado inválido. Debe enviar 'VALIDADO' o 'RECHAZADO'.", null);
    }

    const { rows } = await db.query(
      `UPDATE DIRECTORIO_ALBACEAS
       SET estado_validacion = $1
       WHERE id_directorio = $2 AND id_usuario_invitado = $3
       RETURNING id_directorio, id_titular, parentesco, estado_validacion, fecha_designacion`,
      [nuevoEstado, id, req.user.id]
    );

    if (rows.length === 0) {
      return enviarRespuesta(res, 404, 'Designación no encontrada o no pertenece a tu cuenta.', null);
    }

    await registrarAuditoria(
      `Respondió designación de albacea (ID directorio: ${id}) con estado ${nuevoEstado}`,
      obtenerIp(req),
      req.user.id
    );

    // Notificar por correo al titular sobre la decisión del albacea
    const notifInfo = await db.query(
      `SELECT t.correo_usuario, t.nombre_usuario AS nombre_titular, a.nombre_usuario AS nombre_albacea
       FROM USUARIO t
       JOIN USUARIO a ON a.id_usuario = $2
       WHERE t.id_usuario = $1`,
      [rows[0].id_titular, req.user.id]
    );
    if (notifInfo.rows[0]) {
      enviarRespuestaDesignacion({
        correoTitular: notifInfo.rows[0].correo_usuario,
        nombreTitular: notifInfo.rows[0].nombre_titular,
        nombreAlbacea: notifInfo.rows[0].nombre_albacea,
        estado: nuevoEstado,
      }).catch(() => {});
    }

    const mensaje = nuevoEstado === 'VALIDADO'
      ? 'Designación aceptada correctamente. Ahora figuras como albacea validado.'
      : 'Designación rechazada correctamente.';

    return enviarRespuesta(res, 200, mensaje, rows[0]);
  } catch (error) {
    console.error('Error al responder designación:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al responder la designación.', null);
  }
};
