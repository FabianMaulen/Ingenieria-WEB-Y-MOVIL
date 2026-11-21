const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { parsearIdEntero, parsearPaginacion, obtenerIp } = require('../utils/validadores');

const CATEGORIAS_PERMITIDAS = [
  'General',
  'Financiero',
  'Familiar Directo',
  'Público',
  'Digital',
  'Físico',
];

// GET /api/inventario?limit=20&offset=0
exports.listar = async (req, res) => {
  try {
    const paginacion = parsearPaginacion(req.query);
    if (paginacion.error) {
      return enviarRespuesta(res, 400, paginacion.error, null);
    }

    const { limit, offset } = paginacion;

    const [datosRes, totalRes] = await Promise.all([
      db.query(
        `SELECT id_inventario, plataforma, instruccion, categoria, fecha_creacion
         FROM INVENTARIO
         WHERE id_usuario = $1
         ORDER BY id_inventario DESC
         LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      ),
      db.query('SELECT COUNT(*)::int AS total FROM INVENTARIO WHERE id_usuario = $1', [req.user.id]),
    ]);

    const total = totalRes.rows[0]?.total ?? 0;

    return enviarRespuesta(res, 200, 'Inventario obtenido correctamente.', datosRes.rows, {
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error al listar inventario:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al obtener el inventario.', null);
  }
};

// GET /api/inventario/:id
exports.obtener = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador de inventario debe ser un entero positivo válido.', null);
    }

    const { rows } = await db.query(
      `SELECT id_inventario, plataforma, instruccion, categoria, fecha_creacion
       FROM INVENTARIO
       WHERE id_inventario = $1 AND id_usuario = $2`,
      [id, req.user.id]
    );

    if (!rows[0]) {
      return enviarRespuesta(res, 404, 'Activo de inventario no encontrado.', null);
    }

    return enviarRespuesta(res, 200, 'Activo obtenido correctamente.', rows[0]);
  } catch (error) {
    console.error('Error al obtener activo de inventario:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor.', null);
  }
};

// POST /api/inventario
exports.crear = async (req, res) => {
  try {
    const { plataforma, instruccion, categoria } = req.body || {};

    if (!plataforma || !String(plataforma).trim() || !instruccion || !String(instruccion).trim()) {
      return enviarRespuesta(res, 400, 'La plataforma y la instrucción póstuma son obligatorias.', null);
    }

    const categoriaFinal = categoria ? String(categoria).trim() : 'General';
    if (!CATEGORIAS_PERMITIDAS.includes(categoriaFinal)) {
      return enviarRespuesta(
        res,
        400,
        `Categoría inválida. Valores permitidos: ${CATEGORIAS_PERMITIDAS.join(', ')}.`,
        null
      );
    }

    const { rows } = await db.query(
      `INSERT INTO INVENTARIO (plataforma, instruccion, categoria, id_usuario)
       VALUES ($1, $2, $3, $4)
       RETURNING id_inventario, plataforma, instruccion, categoria, fecha_creacion`,
      [String(plataforma).trim(), String(instruccion).trim(), categoriaFinal, req.user.id]
    );

    await registrarAuditoria(
      `Agregó activo al inventario (${rows[0].plataforma})`,
      obtenerIp(req),
      req.user.id
    );

    return enviarRespuesta(res, 201, 'Activo agregado al inventario con éxito.', rows[0]);
  } catch (error) {
    console.error('Error al crear activo de inventario:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al registrar el activo.', null);
  }
};

// PUT /api/inventario/:id
exports.actualizar = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador de inventario debe ser un entero positivo válido.', null);
    }

    const { plataforma, instruccion, categoria } = req.body || {};
    if (!plataforma || !String(plataforma).trim() || !instruccion || !String(instruccion).trim()) {
      return enviarRespuesta(res, 400, 'La plataforma y la instrucción póstuma son obligatorias.', null);
    }

    const categoriaFinal = categoria ? String(categoria).trim() : 'General';
    if (!CATEGORIAS_PERMITIDAS.includes(categoriaFinal)) {
      return enviarRespuesta(
        res,
        400,
        `Categoría inválida. Valores permitidos: ${CATEGORIAS_PERMITIDAS.join(', ')}.`,
        null
      );
    }

    const { rows } = await db.query(
      `UPDATE INVENTARIO
       SET plataforma = $1, instruccion = $2, categoria = $3
       WHERE id_inventario = $4 AND id_usuario = $5
       RETURNING id_inventario, plataforma, instruccion, categoria, fecha_creacion`,
      [String(plataforma).trim(), String(instruccion).trim(), categoriaFinal, id, req.user.id]
    );

    if (!rows[0]) {
      return enviarRespuesta(res, 404, 'Activo de inventario no encontrado.', null);
    }

    return enviarRespuesta(res, 200, 'Activo actualizado correctamente.', rows[0]);
  } catch (error) {
    console.error('Error al actualizar activo de inventario:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor.', null);
  }
};

// DELETE /api/inventario/:id
exports.eliminar = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador de inventario debe ser un entero positivo válido.', null);
    }

    const r = await db.query(
      'DELETE FROM INVENTARIO WHERE id_inventario = $1 AND id_usuario = $2',
      [id, req.user.id]
    );

    if (r.rowCount === 0) {
      return enviarRespuesta(res, 404, 'Activo de inventario no encontrado.', null);
    }

    await registrarAuditoria(`Eliminó activo del inventario (ID: ${id})`, obtenerIp(req), req.user.id);

    return enviarRespuesta(res, 200, 'Activo eliminado del inventario correctamente.', {
      id_inventario: id,
    });
  } catch (error) {
    console.error('Error al eliminar activo de inventario:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor.', null);
  }
};
