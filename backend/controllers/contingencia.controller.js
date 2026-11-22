const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { normalizarRut, validarRut, validarEmail, obtenerIp } = require('../utils/validadores');
const { analizarCertificadoDefuncion } = require('../services/gemini.service');
const { enviarAlertaApertura, enviarNotificacionSolicitante } = require('../services/email.service');
const { PLAZO_HORAS, aprobarVencidas } = require('../utils/solicitudes');

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
      ? 'Confirmamos que existe un Baúl Eterno activo asociado a ese RUT. Por privacidad no mostramos datos personales; puedes iniciar una solicitud de apertura que notificará al titular durante su plazo de gracia.'
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
    const nombreFamiliarLimpio = String(nombre_familiar).trim();
    const parentescoLimpio = String(parentesco).trim();

    if (!validarRut(rutTitularNorm) || !validarRut(rutFamiliarNorm)) {
      return enviarRespuesta(res, 400, 'Verifica que tanto el RUT del titular como tu RUT sean válidos.', null);
    }

    if (rutFamiliarNorm === rutTitularNorm) {
      return enviarRespuesta(
        res,
        400,
        'Tu RUT de solicitante no puede ser el mismo que el RUT del titular de la bóveda.',
        null
      );
    }

    if (!validarEmail(correoLimpio)) {
      return enviarRespuesta(res, 400, 'Ingresa un correo electrónico válido de contacto.', null);
    }

    await aprobarVencidas();

    // Buscar si el titular existe en BD y obtener su plazo de gracia y correo alternativo
    const titularRes = await db.query(
      `SELECT id_usuario, nombre_usuario, correo_usuario, correo_alternativo, plazo_gracia_dias
       FROM USUARIO
       WHERE UPPER(rut) = $1`,
      [rutTitularNorm]
    );
    const titular = titularRes.rows[0] || null;
    if (!titular) {
      return enviarRespuesta(res, 404, 'No existe una bóveda registrada para el RUT consultado.', null);
    }

    // Evitar duplicados si ya existe una solicitud/reporte activo o la bóveda ya fue liberada
    const [repActivo, solActiva] = await Promise.all([
      db.query(
        `SELECT estado_reporte FROM REPORTE_FAMILIAR
         WHERE id_titular_encontrado = $1 AND estado_reporte IN ('RECIBIDO', 'EN_REVISION', 'VALIDADO')
         LIMIT 1`,
        [titular.id_usuario]
      ),
      db.query(
        `SELECT estado_solicitud FROM SOLICITUD_APERTURA
         WHERE id_usuario = $1 AND estado_solicitud IN ('PENDIENTE', 'APROBADA')
         LIMIT 1`,
        [titular.id_usuario]
      ),
    ]);

    const yaLiberada =
      repActivo.rows[0]?.estado_reporte === 'VALIDADO' ||
      solActiva.rows[0]?.estado_solicitud === 'APROBADA';

    if (yaLiberada) {
      return enviarRespuesta(
        res,
        409,
        'La bóveda asociada a este RUT ya fue liberada previamente para los albaceas y beneficiarios designados.',
        null
      );
    }

    if (repActivo.rows.length > 0 || solActiva.rows.length > 0) {
      return enviarRespuesta(
        res,
        409,
        'Ya existe una solicitud de apertura en curso para este titular. El titular ya fue notificado y se encuentra dentro de su plazo de gracia.',
        null
      );
    }

    const plazoDias = Number(titular.plazo_gracia_dias) || Math.round(PLAZO_HORAS / 24) || 7;
    const plazoHoras = plazoDias * 24;

    // Calcular SHA-256 del documento y guardarlo en disco
    const bufferArchivo = req.file.buffer;
    const mimeArchivo = req.file.mimetype;
    const hash = crypto.createHash('sha256').update(bufferArchivo).digest('hex');
    nombreArchivo = `familiar-${crypto.randomUUID()}${EXTENSIONES[mimeArchivo]}`;
    await fs.promises.writeFile(path.join(UPLOAD_DIR, nombreArchivo), bufferArchivo);

    // Registrar reporte INMEDIATAMENTE sin bloquear la respuesta por llamadas externas
    const { rows } = await db.query(
      `INSERT INTO REPORTE_FAMILIAR
         (rut_titular_consultado, id_titular_encontrado, nombre_familiar, rut_familiar,
          correo_familiar, parentesco, certificado_archivo, hash_documento, folio_extraido,
          plazo_gracia_horas, ultimo_aviso_etapa)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, $9, 'INICIAL')
       RETURNING id_reporte, rut_titular_consultado, estado_reporte, hash_documento,
                 folio_extraido, plazo_gracia_horas, fecha_reporte,
                 fecha_reporte + make_interval(hours => $9::int) AS fecha_limite`,
      [
        rutTitularNorm,
        titular.id_usuario,
        nombreFamiliarLimpio,
        rutFamiliarNorm,
        correoLimpio,
        parentescoLimpio,
        nombreArchivo,
        hash,
        plazoHoras,
      ]
    );

    const reporte = rows[0];

    await registrarAuditoria(
      `Reporte familiar externo (#${reporte.id_reporte}) ingresado por ${nombreFamiliarLimpio} (${rutFamiliarNorm}) para titular RUT ${rutTitularNorm} — plazo de gracia ${plazoDias} días`,
      obtenerIp(req),
      titular.id_usuario
    );

    // Extracción de folio vía Gemini en segundo plano (NUNCA retrasa ni provoca timeout en el envío)
    analizarCertificadoDefuncion({ buffer: bufferArchivo, mimetype: mimeArchivo })
      .then((analisis) => {
        if (analisis?.folio) {
          return db.query(
            'UPDATE REPORTE_FAMILIAR SET folio_extraido = $1 WHERE id_reporte = $2',
            [analisis.folio, reporte.id_reporte]
          );
        }
        return null;
      })
      .catch(() => {});

    // 1) Alerta crítica al titular (correo principal + alternativo si existe)
    enviarAlertaApertura({
      correoTitular: titular.correo_usuario,
      correoAlternativo: titular.correo_alternativo,
      nombreTitular: titular.nombre_usuario,
      nombreAlbacea: `${nombreFamiliarLimpio} (Familiar externo - ${parentescoLimpio})`,
      plazoHoras,
      esReintento: false,
    }).catch(() => {});

    // 2) Confirmación al familiar solicitante
    enviarNotificacionSolicitante({
      correoSolicitante: correoLimpio,
      nombreSolicitante: nombreFamiliarLimpio,
      nombreTitular: `RUT ${rutTitularNorm}`,
      estado: 'RECIBIDA',
      detalle: `Recibimos tu solicitud de apertura (#${reporte.id_reporte}). Por seguridad, notificamos al titular e iniciamos un plazo de gracia de ${plazoDias} días para que confirme si continúa activo. Si no responde al finalizar el plazo (o si es validado), te informaremos de inmediato por este correo.`,
    }).catch(() => {});

    return enviarRespuesta(
      res,
      201,
      `Solicitud registrada (#${reporte.id_reporte}). Notificamos al titular e iniciamos un plazo de gracia de ${plazoDias} días; te avisaremos por correo cualquier actualización.`,
      {
        ...reporte,
        plazo_dias: plazoDias,
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
