const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { PLAZO_HORAS, aprobarVencidas } = require('../utils/solicitudes');
const { normalizarRut, validarRut, parsearIdEntero, obtenerIp } = require('../utils/validadores');
const { enviarAlertaApertura } = require('../services/email.service');

// ---------- Subida del certificado de defunción ----------
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'certificados');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXTENSIONES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) =>
    EXTENSIONES[file.mimetype] ? cb(null, true) : cb(new Error('FORMATO')),
}).single('certificado');

exports.subirCertificado = (req, res, next) => {
  upload(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return enviarRespuesta(res, 400, 'El archivo supera el límite permitido de 5 MB.', null);
    }
    if (err.message === 'FORMATO') {
      return enviarRespuesta(res, 400, 'Formato no permitido. Usa PDF, JPG o PNG.', null);
    }
    console.error('Error al subir certificado:', err);
    return enviarRespuesta(res, 400, 'No se pudo procesar el archivo adjunto.', null);
  });
};

// POST /api/solicitudes (RF-05: multipart/form-data: rut_titular + certificado)
exports.crear = async (req, res) => {
  let nombreArchivo = null;
  try {
    const { rut_titular } = req.body || {};

    if (!rut_titular || !req.file) {
      return enviarRespuesta(
        res,
        400,
        'El RUT del titular y el archivo certificado (PDF, JPG o PNG) son obligatorios.',
        null
      );
    }

    const rutNormalizado = normalizarRut(rut_titular);
    if (!validarRut(rutNormalizado)) {
      return enviarRespuesta(res, 400, 'El RUT del titular no tiene un formato o dígito verificador válido.', null);
    }

    await aprobarVencidas();

    // 1. Verificar que el solicitante figure en DIRECTORIO_ALBACEAS de ese titular
    const dir = await db.query(
      `SELECT d.id_directorio, d.id_titular, d.estado_validacion
       FROM DIRECTORIO_ALBACEAS d
       JOIN USUARIO t ON t.id_usuario = d.id_titular
       WHERE t.rut = $1 AND d.id_usuario_invitado = $2`,
      [rutNormalizado, req.user.id]
    );

    if (dir.rows.length === 0) {
      return enviarRespuesta(res, 403, 'No figuras como albacea designado de ese titular.', null);
    }

    const { id_directorio, id_titular, estado_validacion } = dir.rows[0];
    if (estado_validacion !== 'VALIDADO') {
      return enviarRespuesta(
        res,
        403,
        'Debes aceptar previamente la designación de este titular en tu Panel Albacea antes de solicitar una apertura.',
        null
      );
    }

    // 2. Una sola solicitud activa por titular
    const activa = await db.query(
      `SELECT estado_solicitud
       FROM SOLICITUD_APERTURA
       WHERE id_usuario = $1 AND estado_solicitud IN ('PENDIENTE', 'APROBADA')`,
      [id_titular]
    );
    if (activa.rows.length > 0) {
      return enviarRespuesta(res, 409, 'Ya existe una solicitud de apertura activa para este titular.', null);
    }

    // 3. Hash SHA-256 del documento (RNF-02) y guardado del archivo
    const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    nombreArchivo = `${crypto.randomUUID()}${EXTENSIONES[req.file.mimetype]}`;
    await fs.promises.writeFile(path.join(UPLOAD_DIR, nombreArchivo), req.file.buffer);

    // 4. Registrar la solicitud
    const { rows } = await db.query(
      `INSERT INTO SOLICITUD_APERTURA
         (certificado_defuncion, hash_documento, estado_solicitud, id_usuario, id_albacea)
       VALUES ($1, $2, 'PENDIENTE', $3, $4)
       RETURNING id_solicitud, estado_solicitud, fecha_solicitud,
                 fecha_solicitud + make_interval(hours => $5::int) AS fecha_limite_cancelacion`,
      [nombreArchivo, hash, id_titular, id_directorio, PLAZO_HORAS]
    );

    await registrarAuditoria(
      `Solicitó la apertura del baúl del titular ID ${id_titular} (solicitud ${rows[0].id_solicitud}, SHA-256 ${hash.slice(0, 12)}...)`,
      obtenerIp(req),
      req.user.id
    );

    // Enviar alerta crítica de apertura al correo del titular
    const infoAlerta = await db.query(
      `SELECT t.correo_usuario, t.nombre_usuario AS nombre_titular, a.nombre_usuario AS nombre_albacea
       FROM USUARIO t
       JOIN USUARIO a ON a.id_usuario = $2
       WHERE t.id_usuario = $1`,
      [id_titular, req.user.id]
    );
    if (infoAlerta.rows[0]) {
      enviarAlertaApertura({
        correoTitular: infoAlerta.rows[0].correo_usuario,
        nombreTitular: infoAlerta.rows[0].nombre_titular,
        nombreAlbacea: infoAlerta.rows[0].nombre_albacea,
        plazoHoras: PLAZO_HORAS,
      }).catch(() => {});
    }

    return enviarRespuesta(
      res,
      201,
      `Solicitud registrada. El titular dispone de ${PLAZO_HORAS} horas para cancelarla.`,
      rows[0]
    );
  } catch (error) {
    if (nombreArchivo) {
      fs.promises.unlink(path.join(UPLOAD_DIR, nombreArchivo)).catch(() => {});
    }
    console.error('Error al crear solicitud de apertura:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al procesar la solicitud.', null);
  }
};

// GET /api/solicitudes/mias (RF-05: solicitudes iniciadas por el albacea)
exports.mias = async (req, res) => {
  try {
    await aprobarVencidas();
    const { rows } = await db.query(
      `SELECT s.id_solicitud, s.estado_solicitud, s.fecha_solicitud,
              s.fecha_solicitud + make_interval(hours => $2::int) AS fecha_limite,
              t.nombre_usuario AS nombre_titular,
              t.rut AS rut_titular
       FROM SOLICITUD_APERTURA s
       JOIN DIRECTORIO_ALBACEAS d ON d.id_directorio = s.id_albacea
       JOIN USUARIO t ON t.id_usuario = s.id_usuario
       WHERE d.id_usuario_invitado = $1
       ORDER BY s.fecha_solicitud DESC`,
      [req.user.id, PLAZO_HORAS]
    );

    return enviarRespuesta(res, 200, 'Solicitudes del albacea obtenidas correctamente.', rows);
  } catch (error) {
    console.error('Error al obtener solicitudes del albacea:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor.', null);
  }
};

// GET /api/solicitudes/alertas (RF-06: alertas de apertura sobre la bóveda del titular)
exports.alertas = async (req, res) => {
  try {
    await aprobarVencidas();
    const { rows } = await db.query(
      `SELECT s.id_solicitud, s.estado_solicitud, s.fecha_solicitud,
              s.fecha_solicitud + make_interval(hours => $2::int) AS fecha_limite,
              (s.estado_solicitud = 'PENDIENTE') AS puede_cancelar,
              COALESCE(u.nombre_usuario, d.nombre_albacea) AS nombre_albacea,
              d.rut_albacea,
              d.parentesco
       FROM SOLICITUD_APERTURA s
       JOIN DIRECTORIO_ALBACEAS d ON d.id_directorio = s.id_albacea
       LEFT JOIN USUARIO u ON u.id_usuario = d.id_usuario_invitado
       WHERE s.id_usuario = $1
       ORDER BY s.fecha_solicitud DESC`,
      [req.user.id, PLAZO_HORAS]
    );

    return enviarRespuesta(res, 200, 'Alertas de apertura obtenidas correctamente.', rows);
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor.', null);
  }
};

// PUT /api/solicitudes/:id/cancelar (RF-06: cancelación en periodo de gracia)
exports.cancelar = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador de solicitud debe ser un entero positivo válido.', null);
    }

    await aprobarVencidas();

    const { rows } = await db.query(
      `UPDATE SOLICITUD_APERTURA
       SET estado_solicitud = 'CANCELADA'
       WHERE id_solicitud = $1 AND id_usuario = $2 AND estado_solicitud = 'PENDIENTE'
       RETURNING id_solicitud, estado_solicitud`,
      [id, req.user.id]
    );

    if (rows.length === 0) {
      const existe = await db.query(
        'SELECT estado_solicitud FROM SOLICITUD_APERTURA WHERE id_solicitud = $1 AND id_usuario = $2',
        [id, req.user.id]
      );
      if (existe.rows.length === 0) {
        return enviarRespuesta(res, 404, 'Solicitud no encontrada.', null);
      }
      return enviarRespuesta(
        res,
        409,
        `La solicitud ya está ${existe.rows[0].estado_solicitud.toLowerCase()} y no se puede cancelar.`,
        null
      );
    }

    await registrarAuditoria(
      `Canceló la solicitud de apertura ${id} dentro del plazo de gracia`,
      obtenerIp(req),
      req.user.id
    );

    return enviarRespuesta(res, 200, 'Solicitud cancelada. El baúl permanece sellado.', rows[0]);
  } catch (error) {
    console.error('Error al cancelar solicitud:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor.', null);
  }
};
