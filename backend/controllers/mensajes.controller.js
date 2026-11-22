const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { cifrarTexto, cifrarBuffer, descifrarBuffer } = require('../utils/cifrado'); // RNF-03
const { registrarAuditoria } = require('../utils/auditoria'); // RNF-05
const {
  normalizarRut,
  validarRut,
  validarEmail,
  parsearIdEntero,
  parsearPaginacion,
  obtenerIp,
} = require('../utils/validadores');

const MIME_ADJUNTOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const DIR_BOVEDA_CIFRADA = path.join(__dirname, '..', 'uploads', 'boveda_cifrada');

const asegurarDirCifrado = () => {
  if (!fs.existsSync(DIR_BOVEDA_CIFRADA)) {
    fs.mkdirSync(DIR_BOVEDA_CIFRADA, { recursive: true });
  }
};

const eliminarAdjuntoSeguro = (nombreArchivo) => {
  if (!nombreArchivo) return;
  try {
    const ruta = path.join(DIR_BOVEDA_CIFRADA, path.basename(nombreArchivo));
    if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
  } catch (err) {
    console.warn('[MENSAJES ADJUNTO] No se pudo limpiar archivo:', err.message);
  }
};

const sanitizarNombreArchivo = (nombreOriginal, mimetype) => {
  const extPorMime = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  };
  const limpio = String(nombreOriginal || 'archivo_adjunto')
    .replace(/[^\w.\-\s()]/g, '_')
    .trim()
    .slice(0, 140);
  if (!limpio) return `archivo_adjunto${extPorMime[mimetype] || ''}`;
  return limpio;
};

const uploadAdjunto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) =>
    MIME_ADJUNTOS.includes(file.mimetype) ? cb(null, true) : cb(new Error('FORMATO_ADJUNTO')),
}).single('archivo');

// Middleware opcional: funciona tanto para JSON puro como para multipart/form-data con archivo adjunto
exports.subirAdjuntoOpcional = (req, res, next) => {
  const ct = String(req.headers['content-type'] || '');
  if (!ct.includes('multipart/form-data')) {
    return next();
  }
  uploadAdjunto(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return enviarRespuesta(res, 400, 'El archivo adjunto supera el tamaño máximo de 5 MB.', null);
    }
    if (err.message === 'FORMATO_ADJUNTO') {
      return enviarRespuesta(res, 400, 'Formato no permitido. Adjunta un archivo PDF, JPG, PNG o WEBP.', null);
    }
    return enviarRespuesta(res, 400, 'No se pudo procesar el archivo adjunto.', null);
  });
};

// GET /api/mensajes?limit=20&offset=0
// Solo metadatos; el contenido y archivo adjunto permanecen cifrados y sellados hasta la apertura.
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
                m.archivo_nombre, m.archivo_mime,
                (m.archivo_cifrado IS NOT NULL) AS tiene_archivo,
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
// Soporta destinatario ALBACEA (por RUT) o EXTERNO (por nombre + correo), texto y/o archivo adjunto cifrado.
exports.crear = async (req, res) => {
  let archivoGuardado = null;
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
    const archivoSubido = req.file || null;
    const textoLimpio = String(contenido || '').trim();

    if (!textoLimpio && !archivoSubido) {
      return enviarRespuesta(
        res,
        400,
        'Debes redactar un mensaje o adjuntar un archivo (PDF o imagen) para sellar.',
        null
      );
    }

    const esExterno =
      String(tipo_destinatario || '').toUpperCase() === 'EXTERNO' ||
      (!rut_destinatario && Boolean(correo_destinatario));

    // Preparar validación de destinatario ANTES de cifrar/escribir en disco
    let nombreExternoLimpio = null;
    let correoExternoLimpio = null;
    let rutNormalizado = null;
    let albaceaInfo = null;

    if (esExterno) {
      nombreExternoLimpio = String(nombre_destinatario || '').trim();
      correoExternoLimpio = String(correo_destinatario || '').trim().toLowerCase();

      if (nombreExternoLimpio.length < 2) {
        return enviarRespuesta(res, 400, 'Ingresa el nombre del destinatario externo.', null);
      }
      if (!correoExternoLimpio || !validarEmail(correoExternoLimpio)) {
        return enviarRespuesta(res, 400, 'Ingresa un correo electrónico válido para el destinatario.', null);
      }
    } else {
      if (!rut_destinatario) {
        return enviarRespuesta(res, 400, 'Debes indicar un albacea o un correo externo como destinatario.', null);
      }
      rutNormalizado = normalizarRut(rut_destinatario);
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
      albaceaInfo = albaceaQuery.rows[0];
    }

    // Cifrar archivo adjunto si el titular incluyó PDF/imagen
    let archivoNombre = null;
    let archivoMime = null;
    if (archivoSubido && archivoSubido.buffer) {
      asegurarDirCifrado();
      archivoGuardado = `mensaje-${id_titular}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.enc`;
      fs.writeFileSync(path.join(DIR_BOVEDA_CIFRADA, archivoGuardado), cifrarBuffer(archivoSubido.buffer));
      archivoNombre = sanitizarNombreArchivo(archivoSubido.originalname, archivoSubido.mimetype);
      archivoMime = archivoSubido.mimetype;
    }

    const textoFinal =
      textoLimpio || `Archivo confidencial resguardado especialmente para ti: ${archivoNombre}`;
    const contenidoCifrado = cifrarTexto(textoFinal);

    if (esExterno) {
      const { rows } = await db.query(
        `INSERT INTO MENSAJE_POSTUMO
           (contenido_cifrado, rut_destinatario, nombre_destinatario_externo, correo_destinatario,
            archivo_cifrado, archivo_nombre, archivo_mime, id_usuario)
         VALUES ($1, NULL, $2, $3, $4, $5, $6, $7)
         RETURNING id_mensaje, fecha_creacion, rut_destinatario,
                   nombre_destinatario_externo AS nombre_destinatario,
                   correo_destinatario, TRUE AS es_externo, enviado_por_correo,
                   archivo_nombre, archivo_mime, (archivo_cifrado IS NOT NULL) AS tiene_archivo`,
        [
          contenidoCifrado,
          nombreExternoLimpio,
          correoExternoLimpio,
          archivoGuardado,
          archivoNombre,
          archivoMime,
          id_titular,
        ]
      );

      await registrarAuditoria(
        `Selló mensaje póstumo (#${rows[0].id_mensaje})${archivoNombre ? ` con archivo cifrado (${archivoNombre})` : ''} para destinatario externo (${nombreExternoLimpio})`,
        ip,
        id_titular
      );

      return enviarRespuesta(
        res,
        201,
        'Carta y/o archivo sellados con éxito. Se despacharán automáticamente al correo indicado cuando se libere tu bóveda.',
        rows[0]
      );
    }

    // Modo ALBACEA (por RUT del directorio)
    const { rows } = await db.query(
      `INSERT INTO MENSAJE_POSTUMO
         (contenido_cifrado, rut_destinatario, correo_destinatario,
          archivo_cifrado, archivo_nombre, archivo_mime, id_usuario)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id_mensaje, fecha_creacion, rut_destinatario, correo_destinatario,
                 FALSE AS es_externo, enviado_por_correo,
                 archivo_nombre, archivo_mime, (archivo_cifrado IS NOT NULL) AS tiene_archivo`,
      [
        contenidoCifrado,
        rutNormalizado,
        albaceaInfo.email_albacea || null,
        archivoGuardado,
        archivoNombre,
        archivoMime,
        id_titular,
      ]
    );

    await registrarAuditoria(
      `Selló mensaje póstumo (ID: ${rows[0].id_mensaje})${archivoNombre ? ` con archivo cifrado (${archivoNombre})` : ''} para el RUT ${rutNormalizado}`,
      ip,
      id_titular
    );

    return enviarRespuesta(
      res,
      201,
      'Carta y/o archivo sellados con éxito. Se mantendrán ocultos hasta la liberación oficial de la bóveda.',
      {
        ...rows[0],
        nombre_destinatario: albaceaInfo.nombre_albacea,
      }
    );
  } catch (error) {
    eliminarAdjuntoSeguro(archivoGuardado);
    console.error('Error al guardar el mensaje:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al procesar el mensaje.', null);
  }
};

// GET /api/mensajes/:id/adjunto
// Descarga el archivo cifrado descifrándolo en memoria SOLO para el titular dueño
// o para el albacea destinatario por RUT una vez que la bóveda del titular fue liberada.
exports.descargarAdjunto = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador del mensaje debe ser un entero positivo válido.', null);
    }

    const { rows } = await db.query(
      `SELECT m.id_mensaje, m.id_usuario, m.archivo_cifrado, m.archivo_nombre, m.archivo_mime,
              (
                m.id_usuario = $2
                OR (
                  m.rut_destinatario IS NOT NULL
                  AND EXISTS (
                    SELECT 1 FROM USUARIO u_req
                    WHERE u_req.id_usuario = $2
                      AND UPPER(u_req.rut) = UPPER(m.rut_destinatario)
                  )
                  AND EXISTS (
                    SELECT 1 FROM DIRECTORIO_ALBACEAS d
                    WHERE d.id_titular = m.id_usuario
                      AND d.id_usuario_invitado = $2
                      AND d.estado_validacion = 'VALIDADO'
                  )
                  AND (
                    EXISTS (
                      SELECT 1 FROM SOLICITUD_APERTURA sa
                      WHERE sa.id_usuario = m.id_usuario AND sa.estado_solicitud = 'APROBADA'
                    )
                    OR EXISTS (
                      SELECT 1 FROM REPORTE_FAMILIAR rf
                      WHERE rf.id_titular_encontrado = m.id_usuario AND rf.estado_reporte = 'VALIDADO'
                    )
                  )
                )
              ) AS autorizado
       FROM MENSAJE_POSTUMO m
       WHERE m.id_mensaje = $1`,
      [id, req.user.id]
    );

    const msg = rows[0];
    if (!msg) {
      return enviarRespuesta(res, 404, 'Mensaje póstumo no encontrado.', null);
    }

    if (!msg.autorizado) {
      return enviarRespuesta(
        res,
        403,
        'No tienes autorización para descargar este archivo adjunto.',
        null
      );
    }

    if (!msg.archivo_cifrado) {
      return enviarRespuesta(res, 404, 'Esta carta no posee un archivo adjunto.', null);
    }

    const rutaArchivo = path.join(DIR_BOVEDA_CIFRADA, path.basename(msg.archivo_cifrado));
    if (!fs.existsSync(rutaArchivo)) {
      return enviarRespuesta(res, 404, 'El archivo cifrado ya no se encuentra disponible.', null);
    }

    const bufferPlano = descifrarBuffer(fs.readFileSync(rutaArchivo));
    const nombreDescarga = sanitizarNombreArchivo(msg.archivo_nombre, msg.archivo_mime);

    await registrarAuditoria(
      `Descargó archivo adjunto descifrado del mensaje #${id} (${nombreDescarga})`,
      obtenerIp(req),
      req.user.id
    );

    res.setHeader('Content-Type', msg.archivo_mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreDescarga}"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(bufferPlano);
  } catch (error) {
    console.error('Error al descargar adjunto del mensaje:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al descifrar el archivo adjunto.', null);
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
      'DELETE FROM MENSAJE_POSTUMO WHERE id_mensaje = $1 AND id_usuario = $2 RETURNING archivo_cifrado',
      [id, id_titular]
    );

    if (r.rowCount === 0) {
      return enviarRespuesta(res, 404, 'Mensaje no encontrado.', null);
    }

    eliminarAdjuntoSeguro(r.rows[0]?.archivo_cifrado);

    await registrarAuditoria(`Eliminó el mensaje sellado (ID Mensaje: ${id})`, ip, id_titular);

    return enviarRespuesta(res, 200, 'Mensaje póstumo eliminado correctamente.', { id_mensaje: id });
  } catch (error) {
    console.error('Error al eliminar mensaje:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al eliminar el mensaje.', null);
  }
};
