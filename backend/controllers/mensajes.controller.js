const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { cifrarTexto } = require('../utils/cifrado'); // RNF-03
const { registrarAuditoria } = require('../utils/auditoria'); // RNF-05
const {
  normalizarRut,
  validarRut,
  validarEmail,
  parsearIdEntero,
  parsearPaginacion,
  obtenerIp,
} = require('../utils/validadores');

// GET /api/mensajes?limit=20&offset=0
// Solo metadatos; el contenido permanece cifrado y sellado hasta la apertura.
exports.listar = async (req, res) => {
  try {
    const paginacion = parsearPaginacion(req.query);
    if (paginacion.error) {
      return enviarRespuesta(res, 400, paginacion.error, null);
    }

    const { limit, offset } = paginacion;

    const [datosRes, totalRes] = await Promise.all([
      db.query(
        `SELECT m.id_mensaje, m.fecha_creacion, m.rut_destinatario,
                m.correo_destinatario, m.enviado_por_correo,
                (m.rut_destinatario IS NULL) AS es_externo,
                COALESCE(m.nombre_destinatario_externo, u.nombre_usuario, d.nombre_albacea) AS nombre_destinatario
         FROM MENSAJE_POSTUMO m
         LEFT JOIN USUARIO u ON m.rut_destinatario IS NOT NULL AND UPPER(u.rut) = UPPER(m.rut_destinatario)
         LEFT JOIN DIRECTORIO_ALBACEAS d
           ON m.rut_destinatario IS NOT NULL
          AND d.id_titular = m.id_usuario
          AND UPPER(d.rut_albacea) = UPPER(m.rut_destinatario)
         WHERE m.id_usuario = $1
         ORDER BY m.id_mensaje DESC
         LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      ),
      db.query('SELECT COUNT(*)::int AS total FROM MENSAJE_POSTUMO WHERE id_usuario = $1', [req.user.id]),
    ]);

    const total = totalRes.rows[0]?.total ?? 0;

    return enviarRespuesta(res, 200, 'Mensajes póstumos obtenidos correctamente.', datosRes.rows, {
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error al listar mensajes:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al obtener los mensajes.', null);
  }
};

// POST /api/mensajes
// Soporta destinatario ALBACEA (por RUT) o EXTERNO (por nombre + correo, sin necesidad de cuenta).
exports.crear = async (req, res) => {
  try {
    const {
      tipo_destinatario,
      rut_destinatario,
      nombre_destinatario,
      correo_destinatario,
      contenido,
    } = req.body || {};

    const id_titular = req.user.id;
    const ip = obtenerIp(req);

    if (!contenido || !String(contenido).trim()) {
      return enviarRespuesta(res, 400, 'El contenido del mensaje es obligatorio.', null);
    }

    const esExterno =
      String(tipo_destinatario || '').toUpperCase() === 'EXTERNO' ||
      (!rut_destinatario && Boolean(correo_destinatario));

    const contenidoCifrado = cifrarTexto(String(contenido).trim());

    if (esExterno) {
      const nombreLimpio = String(nombre_destinatario || '').trim();
      const correoLimpio = String(correo_destinatario || '').trim().toLowerCase();

      if (nombreLimpio.length < 2) {
        return enviarRespuesta(res, 400, 'Ingresa el nombre del destinatario externo.', null);
      }
      if (!correoLimpio || !validarEmail(correoLimpio)) {
        return enviarRespuesta(res, 400, 'Ingresa un correo electrónico válido para el destinatario.', null);
      }

      const { rows } = await db.query(
        `INSERT INTO MENSAJE_POSTUMO
           (contenido_cifrado, rut_destinatario, nombre_destinatario_externo, correo_destinatario, id_usuario)
         VALUES ($1, NULL, $2, $3, $4)
         RETURNING id_mensaje, fecha_creacion, rut_destinatario,
                   nombre_destinatario_externo AS nombre_destinatario,
                   correo_destinatario, TRUE AS es_externo, enviado_por_correo`,
        [contenidoCifrado, nombreLimpio, correoLimpio, id_titular]
      );

      await registrarAuditoria(
        `Redactó un mensaje sellado (#${rows[0].id_mensaje}) para destinatario externo (${nombreLimpio} · ${correoLimpio})`,
        ip,
        id_titular
      );

      return enviarRespuesta(
        res,
        201,
        'Mensaje sellado y cifrado con éxito. Se enviará automáticamente al correo indicado cuando se libere tu bóveda.',
        rows[0]
      );
    }

    // Modo ALBACEA (por RUT del directorio)
    if (!rut_destinatario) {
      return enviarRespuesta(res, 400, 'Debes indicar un albacea o un correo externo como destinatario.', null);
    }

    const rutNormalizado = normalizarRut(rut_destinatario);
    if (!validarRut(rutNormalizado)) {
      return enviarRespuesta(res, 400, 'El RUT del destinatario no es válido.', null);
    }

    const albaceaQuery = await db.query(
      `SELECT id_directorio, nombre_albacea, email_albacea
       FROM DIRECTORIO_ALBACEAS
       WHERE id_titular = $1 AND UPPER(rut_albacea) = UPPER($2) AND estado_validacion <> 'RECHAZADO'`,
      [id_titular, rutNormalizado]
    );
    if (albaceaQuery.rows.length === 0) {
      return enviarRespuesta(
        res,
        403,
        'Solo puedes asignar mensajes por RUT a contactos activos de tu Directorio de Albaceas.',
        null
      );
    }

    const { rows } = await db.query(
      `INSERT INTO MENSAJE_POSTUMO
         (contenido_cifrado, rut_destinatario, correo_destinatario, id_usuario)
       VALUES ($1, $2, $3, $4)
       RETURNING id_mensaje, fecha_creacion, rut_destinatario, correo_destinatario,
                 FALSE AS es_externo, enviado_por_correo`,
      [contenidoCifrado, rutNormalizado, albaceaQuery.rows[0].email_albacea || null, id_titular]
    );

    await registrarAuditoria(
      `Redactó un mensaje sellado (ID Mensaje: ${rows[0].id_mensaje}) para el RUT ${rutNormalizado}`,
      ip,
      id_titular
    );

    return enviarRespuesta(
      res,
      201,
      'Mensaje sellado y cifrado con éxito. Se mantendrá oculto hasta la apertura.',
      {
        ...rows[0],
        nombre_destinatario: albaceaQuery.rows[0].nombre_albacea,
      }
    );
  } catch (error) {
    console.error('Error al guardar el mensaje:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al procesar el mensaje.', null);
  }
};

// PUT /api/mensajes/:id
exports.actualizar = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador del mensaje debe ser un entero positivo válido.', null);
    }

    const { contenido } = req.body || {};
    const id_titular = req.user.id;
    const ip = obtenerIp(req);

    if (!contenido || !String(contenido).trim()) {
      return enviarRespuesta(res, 400, 'El contenido del mensaje es obligatorio.', null);
    }

    const { rows } = await db.query(
      `UPDATE MENSAJE_POSTUMO
       SET contenido_cifrado = $1
       WHERE id_mensaje = $2 AND id_usuario = $3
       RETURNING id_mensaje, fecha_creacion, rut_destinatario, correo_destinatario`,
      [cifrarTexto(String(contenido).trim()), id, id_titular]
    );

    if (!rows[0]) {
      return enviarRespuesta(res, 404, 'Mensaje no encontrado.', null);
    }

    await registrarAuditoria(`Modificó el mensaje sellado (ID Mensaje: ${id})`, ip, id_titular);

    return enviarRespuesta(res, 200, 'Mensaje actualizado y sellado de nuevo.', rows[0]);
  } catch (error) {
    console.error('Error al actualizar mensaje:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al actualizar el mensaje.', null);
  }
};

// DELETE /api/mensajes/:id
exports.eliminar = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador del mensaje debe ser un entero positivo válido.', null);
    }

    const id_titular = req.user.id;
    const ip = obtenerIp(req);

    const r = await db.query(
      'DELETE FROM MENSAJE_POSTUMO WHERE id_mensaje = $1 AND id_usuario = $2',
      [id, id_titular]
    );

    if (r.rowCount === 0) {
      return enviarRespuesta(res, 404, 'Mensaje no encontrado.', null);
    }

    await registrarAuditoria(`Eliminó el mensaje sellado (ID Mensaje: ${id})`, ip, id_titular);

    return enviarRespuesta(res, 200, 'Mensaje póstumo eliminado correctamente.', { id_mensaje: id });
  } catch (error) {
    console.error('Error al eliminar mensaje:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al eliminar el mensaje.', null);
  }
};
