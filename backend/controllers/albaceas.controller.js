const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { enviarInvitacionAlbacea } = require('../services/email.service');
const {
  normalizarRut,
  validarRut,
  validarEmail,
  parsearIdEntero,
  parsearPaginacion,
  obtenerIp,
} = require('../utils/validadores');

// GET /api/albaceas?limit=20&offset=0
exports.listar = async (req, res) => {
  try {
    const paginacion = parsearPaginacion(req.query);
    if (paginacion.error) {
      return enviarRespuesta(res, 400, paginacion.error, null);
    }

    const { limit, offset } = paginacion;
    const id_titular = req.user.id;

    const [datosRes, totalRes] = await Promise.all([
      db.query(
        `SELECT d.id_directorio,
                COALESCE(u.nombre_usuario, d.nombre_albacea) AS nombre_usuario,
                d.rut_albacea AS rut,
                COALESCE(u.correo_usuario, d.email_albacea) AS correo_usuario,
                d.parentesco,
                d.estado_validacion,
                d.fecha_designacion,
                (d.id_usuario_invitado IS NOT NULL) AS registrado
         FROM DIRECTORIO_ALBACEAS d
         LEFT JOIN USUARIO u ON d.id_usuario_invitado = u.id_usuario
         WHERE d.id_titular = $1
         ORDER BY d.id_directorio
         LIMIT $2 OFFSET $3`,
        [id_titular, limit, offset]
      ),
      db.query('SELECT COUNT(*)::int AS total FROM DIRECTORIO_ALBACEAS WHERE id_titular = $1', [id_titular]),
    ]);

    const total = totalRes.rows[0]?.total ?? 0;

    return enviarRespuesta(res, 200, 'Directorio de albaceas obtenido correctamente.', datosRes.rows, {
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error al listar albaceas:', error);
    return enviarRespuesta(res, 500, 'Error al obtener el directorio de albaceas.', null);
  }
};

// POST /api/albaceas
// Permite designar tanto usuarios registrados (estado PENDIENTE) como personas aún no registradas (estado INVITADO).
exports.crear = async (req, res) => {
  try {
    const {
      rut_invitado,
      rut_albacea,
      nombre_albacea,
      nombre,
      email_albacea,
      email,
      parentesco,
    } = req.body || {};

    const id_titular = req.user.id;
    const ip = obtenerIp(req);

    const rutEntrada = rut_albacea || rut_invitado;
    if (!rutEntrada || !parentesco) {
      return enviarRespuesta(res, 400, 'El RUT del albacea y el parentesco son obligatorios.', null);
    }

    const rutNormalizado = normalizarRut(rutEntrada);
    if (!validarRut(rutNormalizado)) {
      return enviarRespuesta(res, 400, 'El RUT ingresado no es válido. Verifica el formato y dígito verificador.', null);
    }

    // 1. Verificar que el titular no se designe a sí mismo
    const titularRes = await db.query('SELECT rut, nombre_usuario FROM USUARIO WHERE id_usuario = $1', [id_titular]);
    if (!titularRes.rows[0]) {
      return enviarRespuesta(res, 404, 'Usuario titular no encontrado.', null);
    }
    if (titularRes.rows[0].rut === rutNormalizado) {
      return enviarRespuesta(res, 400, 'No puedes designarte a ti mismo como albacea.', null);
    }

    // 2. Límite máximo de 3 albaceas activos por titular
    const countQuery = await db.query(
      `SELECT COUNT(*)::int AS total
       FROM DIRECTORIO_ALBACEAS
       WHERE id_titular = $1 AND estado_validacion <> 'RECHAZADO'`,
      [id_titular]
    );
    if ((countQuery.rows[0]?.total ?? 0) >= 3) {
      return enviarRespuesta(res, 400, 'Ya has alcanzado el límite máximo de 3 albaceas permitidos.', null);
    }

    // 3. Buscar si el RUT ya existe en USUARIO (vinculación directa o invitación externa)
    const userQuery = await db.query(
      'SELECT id_usuario, nombre_usuario, correo_usuario FROM USUARIO WHERE rut = $1',
      [rutNormalizado]
    );
    const usuarioExistente = userQuery.rows[0] || null;

    const nombreFinal = String(nombre_albacea || nombre || usuarioExistente?.nombre_usuario || '').trim();
    const emailFinal = String(email_albacea || email || usuarioExistente?.correo_usuario || '').trim().toLowerCase();

    if (!nombreFinal || nombreFinal.length < 2) {
      return enviarRespuesta(res, 400, 'El nombre completo del albacea es obligatorio.', null);
    }
    if (!emailFinal || !validarEmail(emailFinal)) {
      return enviarRespuesta(res, 400, 'Debes ingresar un correo electrónico válido para el albacea.', null);
    }

    const id_usuario_invitado = usuarioExistente ? usuarioExistente.id_usuario : null;
    const estadoInicial = usuarioExistente ? 'PENDIENTE' : 'INVITADO';

    // 4. Insertar la designación en DIRECTORIO_ALBACEAS
    const insertQuery = `
      INSERT INTO DIRECTORIO_ALBACEAS
        (nombre_albacea, rut_albacea, email_albacea, parentesco, estado_validacion, id_titular, id_usuario_invitado)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_directorio, nombre_albacea AS nombre_usuario, rut_albacea AS rut,
                email_albacea AS correo_usuario, parentesco, estado_validacion,
                fecha_designacion, (id_usuario_invitado IS NOT NULL) AS registrado
    `;

    const nuevo = await db.query(insertQuery, [
      nombreFinal,
      rutNormalizado,
      emailFinal,
      String(parentesco).trim(),
      estadoInicial,
      id_titular,
      id_usuario_invitado,
    ]);

    // 5. Registrar evento crítico en Auditoría (RNF-05)
    await registrarAuditoria(
      `Designó un nuevo albacea (${nombreFinal}, RUT ${rutNormalizado}, estado ${estadoInicial})`,
      ip,
      id_titular
    );

    // 6. Notificar por correo electrónico al albacea designado
    enviarInvitacionAlbacea({
      correoAlbacea: emailFinal,
      nombreAlbacea: nombreFinal,
      nombreTitular: titularRes.rows[0].nombre_usuario,
      parentesco: String(parentesco).trim(),
      registrado: Boolean(usuarioExistente),
    }).catch(() => {});

    const mensaje = usuarioExistente
      ? 'Albacea designado con éxito. Queda pendiente de aceptación en su Panel Albacea.'
      : 'Invitación registrada. Cuando esta persona cree su cuenta con este RUT, la designación se vinculará automáticamente.';

    return enviarRespuesta(res, 201, mensaje, nuevo.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return enviarRespuesta(res, 409, 'Este RUT ya está registrado en tu directorio de albaceas.', null);
    }
    if (error.code === '23514') {
      return enviarRespuesta(res, 400, 'Los datos del albacea no cumplen con las restricciones de validación.', null);
    }
    console.error('Error al crear albacea:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al designar albacea.', null);
  }
};

// DELETE /api/albaceas/:id
exports.eliminar = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador del albacea debe ser un entero positivo válido.', null);
    }

    const id_titular = req.user.id;
    const ip = obtenerIp(req);

    const r = await db.query(
      'DELETE FROM DIRECTORIO_ALBACEAS WHERE id_directorio = $1 AND id_titular = $2',
      [id, id_titular]
    );
    if (r.rowCount === 0) {
      return enviarRespuesta(res, 404, 'Albacea no encontrado.', null);
    }

    await registrarAuditoria(
      `Eliminó un albacea del directorio (ID directorio: ${id})`,
      ip,
      id_titular
    );

    return enviarRespuesta(res, 200, 'Albacea eliminado del directorio correctamente.', {
      id_directorio: id,
    });
  } catch (error) {
    if (error.code === '23503') {
      return enviarRespuesta(res, 409, 'No se puede eliminar: el albacea tiene solicitudes de apertura asociadas.', null);
    }
    console.error('Error al eliminar albacea:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al eliminar albacea.', null);
  }
};
