const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { normalizarRut, validarRut, validarEmail, obtenerIp } = require('../utils/validadores');
const { analizarCertificadoDefuncion } = require('../services/gemini.service');
const { enviarAlertaApertura } = require('../services/email.service');
const { PLAZO_HORAS } = require('../utils/solicitudes');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'certificados');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXTENSIONES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
};

const PORTAL_REGISTRO_CIVIL =
  'https://www.registrocivil.cl/OficinaInternet/verificacion/verificacioncertificado.srcei';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    EXTENSIONES[file.mimetype] ? cb(null, true) : cb(new Error('FORMATO')),
}).single('certificado');

exports.subirCertificadoFamiliar = (req, res, next) => {
  upload(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return enviarRespuesta(res, 400, 'El certificado supera el límite de 5 MB.', null);
    }
    if (err.message === 'FORMATO') {
      return enviarRespuesta(res, 400, 'Formato no permitido. Adjunta PDF, JPG o PNG.', null);
    }
    return enviarRespuesta(res, 400, 'No se pudo procesar el archivo adjunto.', null);
  });
};

// POST /api/contingencia/consultar (público con privacidad estricta: nunca devuelve datos personales)
exports.consultarExistencia = async (req, res) => {
  try {
    const { rut_titular } = req.body || {};
    if (!rut_titular) {
      return enviarRespuesta(res, 400, 'Debes ingresar el RUT del titular a consultar.', null);
    }

    const rutNormalizado = normalizarRut(rut_titular);
    if (!validarRut(rutNormalizado)) {
      return enviarRespuesta(res, 400, 'El RUT ingresado no es válido. Verifica el dígito verificador.', null);
    }

    const { rows } = await db.query(
      'SELECT id_usuario FROM USUARIO WHERE UPPER(rut) = $1',
      [rutNormalizado]
    );

    const existe = rows.length > 0;
    const mensaje = existe
      ? 'Confirmamos que existe un Baúl Eterno activo asociado a ese RUT. Por privacidad no mostramos datos personales; puedes reportar el fallecimiento adjuntando el certificado oficial.'
      : 'No encontramos un Baúl Eterno registrado para el RUT consultado.';

    return enviarRespuesta(res, 200, mensaje, {
      existe_baul: existe,
      rut_consultado: rutNormalizado,
      portal_registro_civil: PORTAL_REGISTRO_CIVIL,
    });
  } catch (error) {
    console.error('Error en contingencia.consultarExistencia:', error);
    return enviarRespuesta(res, 500, 'Error interno al consultar el RUT.', null);
  }
};

// POST /api/contingencia/reportar (público multipart: familiares no registrados reportan contingencia)
exports.crearReporteFamiliar = async (req, res) => {
  let nombreArchivo = null;
  try {
    const { rut_titular, nombre_familiar, rut_familiar, correo_familiar, parentesco } = req.body || {};

    if (!rut_titular || !nombre_familiar || !rut_familiar || !correo_familiar || !parentesco || !req.file) {
      return enviarRespuesta(
        res,
        400,
        'Todos los campos del familiar, el RUT del titular y el certificado (PDF, JPG o PNG) son obligatorios.',
        null
      );
    }

    const rutTitularNorm = normalizarRut(rut_titular);
    const rutFamiliarNorm = normalizarRut(rut_familiar);
    const correoLimpio = String(correo_familiar).trim().toLowerCase();

    if (!validarRut(rutTitularNorm) || !validarRut(rutFamiliarNorm)) {
      return enviarRespuesta(res, 400, 'Verifica que tanto el RUT del titular como tu RUT sean válidos.', null);
    }

    if (!validarEmail(correoLimpio)) {
      return enviarRespuesta(res, 400, 'Ingresa un correo electrónico válido de contacto.', null);
    }

    // Buscar si el titular existe en BD
    const titularRes = await db.query(
      'SELECT id_usuario, nombre_usuario, correo_usuario FROM USUARIO WHERE UPPER(rut) = $1',
      [rutTitularNorm]
    );
    const titular = titularRes.rows[0] || null;
    if (!titular) {
      return enviarRespuesta(res, 404, 'No existe una bóveda registrada para el RUT consultado.', null);
    }

    // Calcular SHA-256 del documento y guardarlo
    const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    nombreArchivo = `familiar-${crypto.randomUUID()}${EXTENSIONES[req.file.mimetype]}`;
    await fs.promises.writeFile(path.join(UPLOAD_DIR, nombreArchivo), req.file.buffer);

    // Extracción opcional de folio vía Gemini (no bloqueante)
    const analisis = await analizarCertificadoDefuncion({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
    });
    const folioExtraido = analisis?.folio || null;

    const { rows } = await db.query(
      `INSERT INTO REPORTE_FAMILIAR
         (rut_titular_consultado, id_titular_encontrado, nombre_familiar, rut_familiar,
          correo_familiar, parentesco, certificado_archivo, hash_documento, folio_extraido)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id_reporte, rut_titular_consultado, estado_reporte, hash_documento, folio_extraido, fecha_reporte`,
      [
        rutTitularNorm,
        titular.id_usuario,
        String(nombre_familiar).trim(),
        rutFamiliarNorm,
        correoLimpio,
        String(parentesco).trim(),
        nombreArchivo,
        hash,
        folioExtraido,
      ]
    );

    await registrarAuditoria(
      `Reporte familiar externo (#${rows[0].id_reporte}) ingresado por ${String(nombre_familiar).trim()} (${rutFamiliarNorm}) para titular RUT ${rutTitularNorm}`,
      obtenerIp(req),
      titular.id_usuario
    );

    // Alerta preventiva al titular por correo electrónico
    enviarAlertaApertura({
      correoTitular: titular.correo_usuario,
      nombreTitular: titular.nombre_usuario,
      nombreAlbacea: `${String(nombre_familiar).trim()} (Familiar externo - ${String(parentesco).trim()})`,
      plazoHoras: PLAZO_HORAS,
    }).catch(() => {});

    return enviarRespuesta(
      res,
      201,
      'Reporte recibido correctamente. Nuestro equipo de soporte verificará el certificado en el Registro Civil y te contactará por correo.',
      {
        ...rows[0],
        portal_registro_civil: PORTAL_REGISTRO_CIVIL,
      }
    );
  } catch (error) {
    if (nombreArchivo) {
      fs.promises.unlink(path.join(UPLOAD_DIR, nombreArchivo)).catch(() => {});
    }
    console.error('Error en contingencia.crearReporteFamiliar:', error);
    return enviarRespuesta(res, 500, 'Error interno al registrar el reporte familiar.', null);
  }
};
