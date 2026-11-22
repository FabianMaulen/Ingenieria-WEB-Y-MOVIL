const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { aprobarVencidas } = require('../utils/solicitudes');
const { contactoAseguradora } = require('../utils/aseguradoras');
const { descifrarTexto } = require('../utils/cifrado');
const { parsearIdEntero, obtenerIp } = require('../utils/validadores');
const { enviarRespuestaDesignacion } = require('../services/email.service');

// Condición SQL reutilizable: la bóveda de un titular está liberada GLOBALMENTE si existe
// cualquier solicitud de albacea APROBADA o cualquier reporte familiar VALIDADO.
const SQL_BOVEDA_LIBERADA = `(
  EXISTS (
    SELECT 1 FROM SOLICITUD_APERTURA sa
    WHERE sa.id_usuario = d.id_titular AND sa.estado_solicitud = 'APROBADA'
  )
  OR EXISTS (
    SELECT 1 FROM REPORTE_FAMILIAR rf
    WHERE rf.id_titular_encontrado = d.id_titular AND rf.estado_reporte = 'VALIDADO'
  )
)`;

const SQL_APERTURA_EN_CURSO = `(
  EXISTS (
    SELECT 1 FROM SOLICITUD_APERTURA sa
    WHERE sa.id_usuario = d.id_titular AND sa.estado_solicitud = 'PENDIENTE'
  )
  OR EXISTS (
    SELECT 1 FROM REPORTE_FAMILIAR rf
    WHERE rf.id_titular_encontrado = d.id_titular AND rf.estado_reporte IN ('RECIBIDO', 'EN_REVISION')
  )
)`;

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

// GET /api/guia (RF-07: pólizas, inventario y mensajes liberados GLOBALMENTE para todo albacea VALIDADO)
exports.obtenerGuia = async (req, res) => {
  try {
    // 1. Obtener todos los titulares cuya bóveda está liberada y donde el usuario actual es albacea VALIDADO
    const titularesRes = await db.query(
      `SELECT DISTINCT d.id_titular, t.nombre_usuario AS nombre_titular, t.rut AS rut_titular
       FROM DIRECTORIO_ALBACEAS d
       JOIN USUARIO t ON t.id_usuario = d.id_titular
       WHERE d.id_usuario_invitado = $1
         AND d.estado_validacion = 'VALIDADO'
         AND ${SQL_BOVEDA_LIBERADA}
       ORDER BY d.id_titular`,
      [req.user.id]
    );

    if (titularesRes.rows.length === 0) {
      return enviarRespuesta(
        res,
        200,
        'Aún no tienes bóvedas liberadas bajo tu custodia.',
        {
          titulares_liberados: [],
          polizas: [],
          inventario: [],
          mensajes: [],
          cartas_otros_por_titular: {},
          resumen: { total: 0, tramitadas: 0 },
        }
      );
    }

    const idsTitulares = titularesRes.rows.map((t) => t.id_titular);
    const albaceaUserRes = await db.query('SELECT rut FROM USUARIO WHERE id_usuario = $1', [req.user.id]);
    const rutAlbacea = albaceaUserRes.rows[0]?.rut || null;

    const [polizasRes, inventarioRes, mensajesRes, cartasOtrosRes] = await Promise.all([
      db.query(
        `SELECT p.id_poliza, p.tipo_seguro, p.aseguradora, p.numero_poliza,
                p.ubicacion_fisica, p.monto_referencial, p.tramitada,
                t.id_usuario AS id_titular, t.nombre_usuario AS nombre_titular
         FROM POLIZA p
         JOIN USUARIO t ON t.id_usuario = p.id_usuario
         WHERE p.id_usuario = ANY($1::int[])
         ORDER BY t.id_usuario, p.id_poliza`,
        [idsTitulares]
      ),
      db.query(
        `SELECT i.id_inventario, i.plataforma, i.instruccion, i.categoria, i.fecha_creacion,
                t.id_usuario AS id_titular, t.nombre_usuario AS nombre_titular
         FROM INVENTARIO i
         JOIN USUARIO t ON t.id_usuario = i.id_usuario
         WHERE i.id_usuario = ANY($1::int[])
         ORDER BY t.id_usuario, i.id_inventario`,
        [idsTitulares]
      ),
      rutAlbacea
        ? db.query(
            `SELECT m.id_mensaje, m.fecha_creacion, m.contenido_cifrado, m.rut_destinatario,
                    t.id_usuario AS id_titular, t.nombre_usuario AS nombre_titular
             FROM MENSAJE_POSTUMO m
             JOIN USUARIO t ON t.id_usuario = m.id_usuario
             WHERE m.id_usuario = ANY($1::int[])
               AND UPPER(m.rut_destinatario) = UPPER($2)
             ORDER BY m.id_mensaje`,
            [idsTitulares, rutAlbacea]
          )
        : Promise.resolve({ rows: [] }),
      db.query(
        `SELECT m.id_usuario AS id_titular, COUNT(*)::int AS total
         FROM MENSAJE_POSTUMO m
         WHERE m.id_usuario = ANY($1::int[])
           AND ($2::text IS NULL OR m.rut_destinatario IS NULL OR UPPER(m.rut_destinatario) <> UPPER($2))
         GROUP BY m.id_usuario`,
        [idsTitulares, rutAlbacea]
      ),
    ]);

    const cartasOtrosPorTitular = {};
    for (const row of cartasOtrosRes.rows) {
      cartasOtrosPorTitular[row.id_titular] = Number(row.total) || 0;
    }

    const polizas = polizasRes.rows.map((p) => ({
      ...p,
      contacto: contactoAseguradora(p.aseguradora),
    }));

    const mensajes = mensajesRes.rows.map((m) => {
      let contenido = '';
      try {
        contenido = descifrarTexto(m.contenido_cifrado);
      } catch {
        contenido = '(No fue posible descifrar el contenido de este mensaje)';
      }
      return {
        id_mensaje: m.id_mensaje,
        fecha_creacion: m.fecha_creacion,
        id_titular: m.id_titular,
        nombre_titular: m.nombre_titular,
        contenido,
      };
    });

    await registrarAuditoria(
      `Consultó el contenido liberado de bóveda(s) (${polizas.length} pólizas, ${inventarioRes.rows.length} activos, ${mensajes.length} mensajes)`,
      obtenerIp(req),
      req.user.id
    );

    return enviarRespuesta(res, 200, 'Guía de cobro y legado liberado obtenidos correctamente.', {
      titulares_liberados: titularesRes.rows,
      polizas,
      inventario: inventarioRes.rows,
      mensajes,
      cartas_otros_por_titular: cartasOtrosPorTitular,
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

    // Permite marcar tramitada a CUALQUIER albacea VALIDADO de un titular cuya bóveda fue liberada globalmente
    const { rows } = await db.query(
      `UPDATE POLIZA p
       SET tramitada = $1
       FROM DIRECTORIO_ALBACEAS d
       WHERE p.id_poliza = $2
         AND p.id_usuario = d.id_titular
         AND d.id_usuario_invitado = $3
         AND d.estado_validacion = 'VALIDADO'
         AND ${SQL_BOVEDA_LIBERADA}
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
// Lista los titulares que han designado al usuario autenticado como albacea + estado global de cada bóveda.
exports.listarDesignaciones = async (req, res) => {
  try {
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
              d.fecha_designacion,
              ${SQL_BOVEDA_LIBERADA} AS boveda_liberada,
              ${SQL_APERTURA_EN_CURSO} AS apertura_en_curso
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

    const mensaje =
      nuevoEstado === 'VALIDADO'
        ? 'Designación aceptada correctamente. Ahora figuras como albacea validado.'
        : 'Designación rechazada correctamente.';

    return enviarRespuesta(res, 200, mensaje, rows[0]);
  } catch (error) {
    console.error('Error al responder designación:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al responder la designación.', null);
  }
};
