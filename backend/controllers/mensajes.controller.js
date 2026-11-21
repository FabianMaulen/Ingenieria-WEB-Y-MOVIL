const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { cifrarTexto } = require('../utils/cifrado'); // RNF-03
const { registrarAuditoria } = require('../utils/auditoria'); // RNF-05
const {
  normalizarRut,
  validarRut,
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
                COALESCE(u.nombre_usuario, d.nombre_albacea) AS nombre_destinatario
         FROM MENSAJE_POSTUMO m
         LEFT JOIN USUARIO u ON u.rut = m.rut_destinatario
         LEFT JOIN DIRECTORIO_ALBACEAS d ON d.id_titular = m.id_usuario AND d.rut_albacea = m.rut_destinatario
         WHERE m.id_usuario = $1
         ORDER BY m.id_mensaje
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
exports.crear = async (req, res) => {
  try {
    const { rut_destinatario, contenido } = req.body || {};
    const id_titular = req.user.id;
    const ip = obtenerIp(req);

    if (!rut_destinatario || !contenido || !String(contenido).trim()) {
      return enviarRespuesta(res, 400, 'El RUT del destinatario y el contenido son obligatorios.', null);
    }

    const rutNormalizado = normalizarRut(rut_destinatario);
    if (!validarRut(rutNormalizado)) {
      return enviarRespuesta(res, 400, 'El RUT del destinatario no es válido.', null);
    }

    // 1. Verificar que el destinatario pertenezca al Directorio de Albaceas del titular
    const albaceaQuery = await db.query(
      `SELECT id_directorio, nombre_albacea
       FROM DIRECTORIO_ALBACEAS
       WHERE id_titular = $1 AND rut_albacea = $2 AND estado_validacion <> 'RECHAZADO'`,
      [id_titular, rutNormalizado]
    );
    if (albaceaQuery.rows.length === 0) {
      return enviarRespuesta(
        res,
        403,
        'Solo puedes enviar mensajes a contactos activos de tu Directorio de Albaceas.',
        null
      );
    }

    // 2. Cifrar el mensaje con AES-256 (RNF-03)
    const contenidoCifrado = cifrarTexto(String(contenido).trim());

    // 3. Insertar en MENSAJE_POSTUMO
    const { rows } = await db.query(
      `INSERT INTO MENSAJE_POSTUMO (contenido_cifrado, rut_destinatario, id_usuario)
       VALUES ($1, $2, $3)
       RETURNING id_mensaje, fecha_creacion, rut_destinatario`,
      [contenidoCifrado, rutNormalizado, id_titular]
    );

    // 4. Auditoría (RNF-05)
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
       RETURNING id_mensaje, fecha_creacion, rut_destinatario`,
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
