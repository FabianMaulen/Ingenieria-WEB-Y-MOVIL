const multer = require('multer');
const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { parsearIdEntero, parsearPaginacion } = require('../utils/validadores');
const { extraerDatosPoliza } = require('../services/gemini.service');

const MIME_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const uploadPoliza = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) =>
    MIME_PERMITIDOS.includes(file.mimetype) ? cb(null, true) : cb(new Error('FORMATO_POLIZA')),
}).single('archivo');

exports.subirArchivoPoliza = (req, res, next) => {
  uploadPoliza(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return enviarRespuesta(res, 400, 'El archivo supera el tamaño máximo de 5 MB.', null);
    }
    if (err.message === 'FORMATO_POLIZA') {
      return enviarRespuesta(res, 400, 'Formato no permitido. Sube un archivo PDF, JPG, PNG o WEBP.', null);
    }
    return enviarRespuesta(res, 400, 'No se pudo procesar el archivo subido.', null);
  });
};

// POST /api/polizas/extraer (multipart: campo "archivo")
exports.extraerDesdeArchivo = async (req, res) => {
  try {
    if (!req.file) {
      return enviarRespuesta(res, 400, 'Debes adjuntar el archivo de tu póliza (PDF o imagen).', null);
    }

    const extraido = await extraerDatosPoliza({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
    });

    return enviarRespuesta(
      res,
      200,
      'Datos extraídos correctamente. Revisa los campos antes de guardar tu póliza.',
      extraido
    );
  } catch (error) {
    if (error.message === 'GEMINI_NO_CONFIGURADO') {
      return enviarRespuesta(
        res,
        503,
        'El servicio de extracción con IA no está configurado (falta GEMINI_API_KEY en el servidor).',
        null
      );
    }
    console.error('Error al extraer póliza con Gemini:', error);
    return enviarRespuesta(
      res,
      502,
      'No pudimos leer automáticamente ese documento. Puedes completar los campos de forma manual.',
      null
    );
  }
};

// GET /api/polizas?limit=20&offset=0
exports.listar = async (req, res) => {
  try {
    const paginacion = parsearPaginacion(req.query);
    if (paginacion.error) {
      return enviarRespuesta(res, 400, paginacion.error, null);
    }

    const { limit, offset } = paginacion;

    const [datosRes, totalRes] = await Promise.all([
      db.query(
        `SELECT * FROM POLIZA
         WHERE id_usuario = $1
         ORDER BY id_poliza
         LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      ),
      db.query('SELECT COUNT(*)::int AS total FROM POLIZA WHERE id_usuario = $1', [req.user.id]),
    ]);

    const total = totalRes.rows[0]?.total ?? 0;

    return enviarRespuesta(res, 200, 'Pólizas obtenidas correctamente.', datosRes.rows, {
      total,
      limit,
      offset,
    });
  } catch (e) {
    console.error('Error al listar pólizas:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor al listar pólizas.', null);
  }
};

// GET /api/polizas/:id
exports.obtener = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador de póliza debe ser un entero positivo válido.', null);
    }

    const { rows } = await db.query(
      'SELECT * FROM POLIZA WHERE id_poliza = $1 AND id_usuario = $2',
      [id, req.user.id]
    );
    if (!rows[0]) {
      return enviarRespuesta(res, 404, 'Póliza no encontrada.', null);
    }
    return enviarRespuesta(res, 200, 'Póliza obtenida correctamente.', rows[0]);
  } catch (e) {
    console.error('Error al obtener póliza:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor al obtener la póliza.', null);
  }
};

// POST /api/polizas
exports.crear = async (req, res) => {
  try {
    const { tipo_seguro, aseguradora, numero_poliza, ubicacion_fisica, monto_referencial } = req.body || {};

    if (!tipo_seguro || !aseguradora || !numero_poliza || !ubicacion_fisica || monto_referencial == null) {
      return enviarRespuesta(res, 400, 'Faltan campos obligatorios para registrar la póliza.', null);
    }

    const monto = Number(monto_referencial);
    if (Number.isNaN(monto) || monto < 0) {
      return enviarRespuesta(res, 400, 'El monto referencial debe ser un número mayor o igual a 0.', null);
    }

    const { rows } = await db.query(
      `INSERT INTO POLIZA (tipo_seguro, aseguradora, numero_poliza, ubicacion_fisica, monto_referencial, id_usuario)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        String(tipo_seguro).trim(),
        String(aseguradora).trim(),
        String(numero_poliza).trim(),
        String(ubicacion_fisica).trim(),
        monto,
        req.user.id,
      ]
    );

    return enviarRespuesta(res, 201, 'Póliza registrada con éxito.', rows[0]);
  } catch (e) {
    console.error('Error al crear póliza:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor al registrar la póliza.', null);
  }
};

// PUT /api/polizas/:id
exports.actualizar = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador de póliza debe ser un entero positivo válido.', null);
    }

    const { tipo_seguro, aseguradora, numero_poliza, ubicacion_fisica, monto_referencial } = req.body || {};

    if (!tipo_seguro || !aseguradora || !numero_poliza || !ubicacion_fisica || monto_referencial == null) {
      return enviarRespuesta(res, 400, 'Faltan campos obligatorios para actualizar la póliza.', null);
    }

    const monto = Number(monto_referencial);
    if (Number.isNaN(monto) || monto < 0) {
      return enviarRespuesta(res, 400, 'El monto referencial debe ser un número mayor o igual a 0.', null);
    }

    const { rows } = await db.query(
      `UPDATE POLIZA
       SET tipo_seguro = $1, aseguradora = $2, numero_poliza = $3,
           ubicacion_fisica = $4, monto_referencial = $5
       WHERE id_poliza = $6 AND id_usuario = $7
       RETURNING *`,
      [
        String(tipo_seguro).trim(),
        String(aseguradora).trim(),
        String(numero_poliza).trim(),
        String(ubicacion_fisica).trim(),
        monto,
        id,
        req.user.id,
      ]
    );

    if (!rows[0]) {
      return enviarRespuesta(res, 404, 'Póliza no encontrada.', null);
    }

    return enviarRespuesta(res, 200, 'Póliza actualizada con éxito.', rows[0]);
  } catch (e) {
    console.error('Error al actualizar póliza:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor al actualizar la póliza.', null);
  }
};

// DELETE /api/polizas/:id
exports.eliminar = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador de póliza debe ser un entero positivo válido.', null);
    }

    const r = await db.query(
      'DELETE FROM POLIZA WHERE id_poliza = $1 AND id_usuario = $2',
      [id, req.user.id]
    );

    if (r.rowCount === 0) {
      return enviarRespuesta(res, 404, 'Póliza no encontrada.', null);
    }

    return enviarRespuesta(res, 200, 'Póliza eliminada correctamente.', { id_poliza: id });
  } catch (e) {
    console.error('Error al eliminar póliza:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor al eliminar la póliza.', null);
  }
};
