const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { cifrarBuffer, descifrarBuffer } = require('../utils/cifrado');
const { parsearIdEntero, parsearPaginacion, obtenerIp } = require('../utils/validadores');
const { extraerDatosPoliza } = require('../services/gemini.service');

const MIME_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const DIR_BOVEDA_CIFRADA = path.join(__dirname, '..', 'uploads', 'boveda_cifrada');

const CAMPOS_POLIZA = `
  id_poliza, tipo_seguro, aseguradora, numero_poliza, ubicacion_fisica,
  monto_referencial, tramitada, id_usuario, documento_nombre, documento_mime,
  (documento_cifrado IS NOT NULL) AS tiene_documento
`;

const asegurarDirectorioCifrado = () => {
  if (!fs.existsSync(DIR_BOVEDA_CIFRADA)) {
    fs.mkdirSync(DIR_BOVEDA_CIFRADA, { recursive: true });
  }
};

const eliminarArchivoSeguro = (nombreArchivo) => {
  if (!nombreArchivo) return;
  try {
    const ruta = path.join(DIR_BOVEDA_CIFRADA, path.basename(nombreArchivo));
    if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
  } catch (err) {
    console.warn('[BOVEDA CIFRADA] No se pudo eliminar archivo antiguo:', err.message);
  }
};

const sanitizarNombreDescarga = (nombreOriginal, mimetype) => {
  const extPorMime = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  };
  const base = String(nombreOriginal || 'documento_poliza')
    .replace(/[^\w.\-\s()]/g, '_')
    .trim()
    .slice(0, 140);
  if (!base) return `documento_poliza${extPorMime[mimetype] || ''}`;
  return base;
};

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
        `SELECT ${CAMPOS_POLIZA}
         FROM POLIZA
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
      `SELECT ${CAMPOS_POLIZA} FROM POLIZA WHERE id_poliza = $1 AND id_usuario = $2`,
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
       RETURNING ${CAMPOS_POLIZA}`,
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
       RETURNING ${CAMPOS_POLIZA}`,
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
      'DELETE FROM POLIZA WHERE id_poliza = $1 AND id_usuario = $2 RETURNING documento_cifrado',
      [id, req.user.id]
    );

    if (r.rowCount === 0) {
      return enviarRespuesta(res, 404, 'Póliza no encontrada.', null);
    }

    eliminarArchivoSeguro(r.rows[0]?.documento_cifrado);

    return enviarRespuesta(res, 200, 'Póliza eliminada correctamente.', { id_poliza: id });
  } catch (e) {
    console.error('Error al eliminar póliza:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor al eliminar la póliza.', null);
  }
};

// POST /api/polizas/:id/documento
// Cifra el archivo binario en reposo (AES-256-CBC) antes de almacenarlo en disco.
exports.adjuntarDocumento = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador de póliza debe ser un entero positivo válido.', null);
    }

    if (!req.file || !req.file.buffer) {
      return enviarRespuesta(res, 400, 'Debes adjuntar un archivo PDF o imagen (máx. 5 MB).', null);
    }

    const existente = await db.query(
      'SELECT id_poliza, documento_cifrado FROM POLIZA WHERE id_poliza = $1 AND id_usuario = $2',
      [id, req.user.id]
    );

    if (!existente.rows[0]) {
      return enviarRespuesta(res, 404, 'Póliza no encontrada.', null);
    }

    asegurarDirectorioCifrado();
    const archivoCifradoNombre = `poliza-${id}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.enc`;
    const rutaDestino = path.join(DIR_BOVEDA_CIFRADA, archivoCifradoNombre);
    const bufferCifrado = cifrarBuffer(req.file.buffer);
    fs.writeFileSync(rutaDestino, bufferCifrado);

    const nombreSeguro = sanitizarNombreDescarga(req.file.originalname, req.file.mimetype);

    const { rows } = await db.query(
      `UPDATE POLIZA
       SET documento_cifrado = $1,
           documento_nombre = $2,
           documento_mime = $3
       WHERE id_poliza = $4 AND id_usuario = $5
       RETURNING ${CAMPOS_POLIZA}`,
      [archivoCifradoNombre, nombreSeguro, req.file.mimetype, id, req.user.id]
    );

    // Limpiar respaldo previo si se reemplazó el archivo
    eliminarArchivoSeguro(existente.rows[0].documento_cifrado);

    await registrarAuditoria(
      `Resguardó documento cifrado (${nombreSeguro}) en póliza #${id}`,
      obtenerIp(req),
      req.user.id
    );

    return enviarRespuesta(
      res,
      200,
      'Documento cifrado y resguardado correctamente en tu bóveda.',
      rows[0]
    );
  } catch (e) {
    console.error('Error al adjuntar documento cifrado:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor al cifrar y guardar el documento.', null);
  }
};

// GET /api/polizas/:id/documento
// Permite descarga descifrada en memoria al titular dueño O a un albacea VALIDADO si la bóveda fue liberada.
exports.descargarDocumento = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador de póliza debe ser un entero positivo válido.', null);
    }

    const { rows } = await db.query(
      `SELECT p.id_poliza, p.id_usuario, p.documento_cifrado, p.documento_nombre, p.documento_mime,
              (
                p.id_usuario = $2
                OR EXISTS (
                  SELECT 1
                  FROM DIRECTORIO_ALBACEAS d
                  WHERE d.id_titular = p.id_usuario
                    AND d.id_usuario_invitado = $2
                    AND d.estado_validacion = 'VALIDADO'
                    AND (
                      EXISTS (
                        SELECT 1 FROM SOLICITUD_APERTURA sa
                        WHERE sa.id_usuario = p.id_usuario AND sa.estado_solicitud = 'APROBADA'
                      )
                      OR EXISTS (
                        SELECT 1 FROM REPORTE_FAMILIAR rf
                        WHERE rf.id_titular_encontrado = p.id_usuario AND rf.estado_reporte = 'VALIDADO'
                      )
                    )
                )
              ) AS autorizado
       FROM POLIZA p
       WHERE p.id_poliza = $1`,
      [id, req.user.id]
    );

    const poliza = rows[0];
    if (!poliza) {
      return enviarRespuesta(res, 404, 'Póliza no encontrada.', null);
    }

    if (!poliza.autorizado) {
      return enviarRespuesta(
        res,
        403,
        'No tienes autorización para descargar este documento (solo el titular o un albacea validado tras la liberación).',
        null
      );
    }

    if (!poliza.documento_cifrado) {
      return enviarRespuesta(res, 404, 'Esta póliza no posee un documento de respaldo adjunto.', null);
    }

    const rutaArchivo = path.join(DIR_BOVEDA_CIFRADA, path.basename(poliza.documento_cifrado));
    if (!fs.existsSync(rutaArchivo)) {
      return enviarRespuesta(res, 404, 'El archivo cifrado ya no se encuentra disponible en almacenamiento.', null);
    }

    const bufferCifrado = fs.readFileSync(rutaArchivo);
    const bufferPlano = descifrarBuffer(bufferCifrado);
    const nombreDescarga = sanitizarNombreDescarga(poliza.documento_nombre, poliza.documento_mime);

    await registrarAuditoria(
      `Descargó documento descifrado de póliza #${id} (${nombreDescarga})`,
      obtenerIp(req),
      req.user.id
    );

    res.setHeader('Content-Type', poliza.documento_mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreDescarga}"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(bufferPlano);
  } catch (e) {
    console.error('Error al descargar documento cifrado:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor al descifrar el documento.', null);
  }
};

// DELETE /api/polizas/:id/documento
exports.eliminarDocumento = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador de póliza debe ser un entero positivo válido.', null);
    }

    const existente = await db.query(
      'SELECT documento_cifrado, documento_nombre FROM POLIZA WHERE id_poliza = $1 AND id_usuario = $2',
      [id, req.user.id]
    );
    if (!existente.rows[0]) {
      return enviarRespuesta(res, 404, 'Póliza no encontrada.', null);
    }

    await db.query(
      `UPDATE POLIZA
       SET documento_cifrado = NULL, documento_nombre = NULL, documento_mime = NULL
       WHERE id_poliza = $1 AND id_usuario = $2`,
      [id, req.user.id]
    );

    eliminarArchivoSeguro(existente.rows[0].documento_cifrado);

    await registrarAuditoria(
      `Eliminó documento de respaldo de póliza #${id}`,
      obtenerIp(req),
      req.user.id
    );

    return enviarRespuesta(res, 200, 'Documento de respaldo eliminado correctamente.', { id_poliza: id });
  } catch (e) {
    console.error('Error al eliminar documento de póliza:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor al eliminar el documento.', null);
  }
};
