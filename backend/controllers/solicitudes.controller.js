const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { PLAZO_HORAS, aprobarVencidas } = require('../utils/solicitudes');
const { normalizarRut, validarRut, parsearIdEntero, obtenerIp } = require('../utils/validadores');
const { enviarAlertaApertura, enviarNotificacionSolicitante } = require('../services/email.service');

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
      `SELECT d.id_directorio, d.id_titular, d.estado_validacion,
              t.nombre_usuario AS nombre_titular, t.correo_usuario AS correo_titular,
              t.correo_alternativo, t.plazo_gracia_dias
       FROM DIRECTORIO_ALBACEAS d
       JOIN USUARIO t ON t.id_usuario = d.id_titular
       WHERE UPPER(t.rut) = $1 AND d.id_usuario_invitado = $2`,
      [rutNormalizado, req.user.id]
    );

    if (dir.rows.length === 0) {
      return enviarRespuesta(res, 403, 'No figuras como albacea designado de ese titular.', null);
    }

    const {
      id_directorio,
      id_titular,
      estado_validacion,
      nombre_titular,
      correo_titular,
      correo_alternativo,
      plazo_gracia_dias,
    } = dir.rows[0];

    if (estado_validacion !== 'VALIDADO') {
      return enviarRespuesta(
        res,
        403,
        'Debes aceptar previamente la designación de este titular en tu Panel Albacea antes de solicitar una apertura.',
        null
      );
    }

    // 2. Verificar que no exista solicitud ni reporte familiar activo o ya liberado globalmente
    const [activaSol, activoRep] = await Promise.all([
      db.query(
        `SELECT estado_solicitud
         FROM SOLICITUD_APERTURA
         WHERE id_usuario = $1 AND estado_solicitud IN ('PENDIENTE', 'APROBADA')
         LIMIT 1`,
        [id_titular]
      ),
      db.query(
        `SELECT estado_reporte
         FROM REPORTE_FAMILIAR
         WHERE id_titular_encontrado = $1 AND estado_reporte IN ('RECIBIDO', 'EN_REVISION', 'VALIDADO')
         LIMIT 1`,
        [id_titular]
      ),
    ]);

    const yaLiberada =
      activaSol.rows[0]?.estado_solicitud === 'APROBADA' ||
      activoRep.rows[0]?.estado_reporte === 'VALIDADO';

    if (yaLiberada) {
      return enviarRespuesta(
        res,
        409,
        'La bóveda de este titular ya se encuentra liberada. Puedes revisar su contenido directamente en tu Guía y Designaciones.',
        null
      );
    }

    if (activaSol.rows.length > 0 || activoRep.rows.length > 0) {
      return enviarRespuesta(
        res,
        409,
        'Ya existe una solicitud de apertura en curso para este titular (en periodo de gracia).',
        null
      );
    }

    const plazoDias = Number(plazo_gracia_dias) || Math.round(PLAZO_HORAS / 24) || 7;
    const plazoHoras = plazoDias * 24;

    // 3. Hash SHA-256 del documento (RNF-02) y guardado del archivo
    const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    nombreArchivo = `${crypto.randomUUID()}${EXTENSIONES[req.file.mimetype]}`;
    await fs.promises.writeFile(path.join(UPLOAD_DIR, nombreArchivo), req.file.buffer);

    // 4. Registrar la solicitud usando el plazo de gracia configurado por el titular
    const { rows } = await db.query(
      `INSERT INTO SOLICITUD_APERTURA
         (certificado_defuncion, hash_documento, estado_solicitud, plazo_gracia_horas, ultimo_aviso_etapa, id_usuario, id_albacea)
       VALUES ($1, $2, 'PENDIENTE', $3, 'INICIAL', $4, $5)
       RETURNING id_solicitud, estado_solicitud, fecha_solicitud, plazo_gracia_horas,
                 fecha_solicitud + make_interval(hours => $3::int) AS fecha_limite_cancelacion`,
      [nombreArchivo, hash, plazoHoras, id_titular, id_directorio]
    );

    await registrarAuditoria(
      `Solicitó la apertura del baúl del titular ID ${id_titular} (solicitud #${rows[0].id_solicitud}, plazo ${plazoDias} días)`,
      obtenerIp(req),
      req.user.id
    );

    const albRes = await db.query(
      'SELECT nombre_usuario, correo_usuario FROM USUARIO WHERE id_usuario = $1',
      [req.user.id]
    );
    const albacea = albRes.rows[0];

    // 1) Alerta crítica al titular (correo principal + alternativo)
    enviarAlertaApertura({
      correoTitular: correo_titular,
      correoAlternativo: correo_alternativo,
      nombreTitular: nombre_titular,
      nombreAlbacea: albacea?.nombre_usuario || 'Albacea designado',
      plazoHoras,
      esReintento: false,
    }).catch(() => {});

    // 2) Confirmación al albacea solicitante
    if (albacea?.correo_usuario) {
      enviarNotificacionSolicitante({
        correoSolicitante: albacea.correo_usuario,
        nombreSolicitante: albacea.nombre_usuario,
        nombreTitular: nombre_titular,
        estado: 'RECIBIDA',
        detalle: `Tu solicitud de apertura (#${rows[0].id_solicitud}) para la bóveda de ${nombre_titular} fue registrada. Se inició un plazo de gracia de ${plazoDias} días durante el cual notificaremos al titular para confirmar su actividad.`,
      }).catch(() => {});
    }

    return enviarRespuesta(
      res,
      201,
      `Solicitud registrada. El titular dispone de ${plazoDias} días (${plazoHoras} horas) para cancelarla mediante Check-in.`,
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
              COALESCE(s.plazo_gracia_horas, $2::int) AS plazo_gracia_horas,
              s.fecha_solicitud + make_interval(hours => COALESCE(s.plazo_gracia_horas, $2::int)) AS fecha_limite,
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

// GET /api/solicitudes/alertas (RF-06: alertas unificadas de apertura — albaceas + familiares externos)
exports.alertas = async (req, res) => {
  try {
    await aprobarVencidas();

    const [solRes, repRes] = await Promise.all([
      db.query(
        `SELECT s.id_solicitud,
                'ALBACEA' AS origen,
                s.estado_solicitud,
                s.fecha_solicitud,
                COALESCE(s.plazo_gracia_horas, $2::int) AS plazo_gracia_horas,
                s.fecha_solicitud + make_interval(hours => COALESCE(s.plazo_gracia_horas, $2::int)) AS fecha_limite,
                GREATEST(0, EXTRACT(EPOCH FROM ((s.fecha_solicitud + make_interval(hours => COALESCE(s.plazo_gracia_horas, $2::int))) - NOW())) / 3600.0)::int AS horas_restantes,
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
      ),
      db.query(
        `SELECT r.id_reporte AS id_solicitud,
                'FAMILIAR' AS origen,
                CASE
                  WHEN r.estado_reporte IN ('RECIBIDO', 'EN_REVISION') THEN 'PENDIENTE'
                  WHEN r.estado_reporte = 'VALIDADO' THEN 'APROBADA'
                  ELSE 'CANCELADA'
                END AS estado_solicitud,
                r.fecha_reporte AS fecha_solicitud,
                COALESCE(r.plazo_gracia_horas, $2::int) AS plazo_gracia_horas,
                r.fecha_reporte + make_interval(hours => COALESCE(r.plazo_gracia_horas, $2::int)) AS fecha_limite,
                GREATEST(0, EXTRACT(EPOCH FROM ((r.fecha_reporte + make_interval(hours => COALESCE(r.plazo_gracia_horas, $2::int))) - NOW())) / 3600.0)::int AS horas_restantes,
                (r.estado_reporte IN ('RECIBIDO', 'EN_REVISION')) AS puede_cancelar,
                r.nombre_familiar AS nombre_albacea,
                r.rut_familiar AS rut_albacea,
                r.parentesco
         FROM REPORTE_FAMILIAR r
         WHERE r.id_titular_encontrado = $1
         ORDER BY r.fecha_reporte DESC`,
        [req.user.id, PLAZO_HORAS]
      ),
    ]);

    const combinadas = [...solRes.rows, ...repRes.rows].sort(
      (a, b) => new Date(b.fecha_solicitud).getTime() - new Date(a.fecha_solicitud).getTime()
    );

    return enviarRespuesta(res, 200, 'Alertas de apertura obtenidas correctamente.', combinadas);
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor.', null);
  }
};

// PUT /api/solicitudes/:id/cancelar (RF-06: cancelación de solicitud de albacea en periodo de gracia)
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
       RETURNING id_solicitud, estado_solicitud, id_albacea`,
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

    // Renovar check-in al anular solicitud
    await db.query(
      'UPDATE USUARIO SET fecha_ultimo_checkin = NOW(), ultimo_recordatorio_enviado = NULL WHERE id_usuario = $1',
      [req.user.id]
    );

    await registrarAuditoria(
      `Canceló la solicitud de apertura #${id} dentro del plazo de gracia y renovó vigencia`,
      obtenerIp(req),
      req.user.id
    );

    // Notificar por correo al albacea solicitante que el titular confirmó estar activo
    const infoNotif = await db.query(
      `SELECT t.nombre_usuario AS nombre_titular,
              COALESCE(a.nombre_usuario, d.nombre_albacea) AS nombre_albacea,
              COALESCE(a.correo_usuario, d.email_albacea) AS correo_albacea
       FROM DIRECTORIO_ALBACEAS d
       JOIN USUARIO t ON t.id_usuario = d.id_titular
       LEFT JOIN USUARIO a ON a.id_usuario = d.id_usuario_invitado
       WHERE d.id_directorio = $1`,
      [rows[0].id_albacea]
    );

    if (infoNotif.rows[0]?.correo_albacea) {
      enviarNotificacionSolicitante({
        correoSolicitante: infoNotif.rows[0].correo_albacea,
        nombreSolicitante: infoNotif.rows[0].nombre_albacea,
        nombreTitular: infoNotif.rows[0].nombre_titular,
        estado: 'CANCELADA_TITULAR',
        detalle: `El titular (${infoNotif.rows[0].nombre_titular}) confirmó que se encuentra activo y anuló la solicitud de apertura #${id}. Su bóveda permanece sellada.`,
      }).catch(() => {});
    }

    return enviarRespuesta(res, 200, 'Solicitud cancelada y vigencia renovada. El baúl permanece sellado.', rows[0]);
  } catch (error) {
    console.error('Error al cancelar solicitud:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor.', null);
  }
};

// PUT /api/solicitudes/reportes-familiares/:id/cancelar (titular anula un reporte familiar externo)
exports.cancelarReporteFamiliar = async (req, res) => {
  try {
    const id = parsearIdEntero(req.params.id);
    if (!id) {
      return enviarRespuesta(res, 400, 'El identificador de reporte debe ser un entero positivo válido.', null);
    }

    await aprobarVencidas();

    const { rows } = await db.query(
      `UPDATE REPORTE_FAMILIAR
       SET estado_reporte = 'CANCELADO_TITULAR'
       WHERE id_reporte = $1 AND id_titular_encontrado = $2 AND estado_reporte IN ('RECIBIDO', 'EN_REVISION')
       RETURNING id_reporte, estado_reporte, nombre_familiar, correo_familiar`,
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return enviarRespuesta(res, 404, 'No se encontró un reporte familiar activo para cancelar.', null);
    }

    await db.query(
      'UPDATE USUARIO SET fecha_ultimo_checkin = NOW(), ultimo_recordatorio_enviado = NULL WHERE id_usuario = $1',
      [req.user.id]
    );

    const titularRes = await db.query('SELECT nombre_usuario FROM USUARIO WHERE id_usuario = $1', [req.user.id]);
    const nombreTitular = titularRes.rows[0]?.nombre_usuario || 'el titular';

    await registrarAuditoria(
      `Anuló el reporte familiar externo #${id} confirmando presencia activa`,
      obtenerIp(req),
      req.user.id
    );

    // Notificar al familiar solicitante que el titular confirmó estar activo
    enviarNotificacionSolicitante({
      correoSolicitante: rows[0].correo_familiar,
      nombreSolicitante: rows[0].nombre_familiar,
      nombreTitular,
      estado: 'CANCELADA_TITULAR',
      detalle: `Te informamos que ${nombreTitular} ingresó a Baúl Eterno, confirmó que se encuentra activo y anuló el reporte de apertura #${id}. La bóveda continúa protegida.`,
    }).catch(() => {});

    return enviarRespuesta(
      res,
      200,
      'Reporte familiar anulado y vigencia renovada. Tu bóveda continúa protegida.',
      rows[0]
    );
  } catch (error) {
    console.error('Error al cancelar reporte familiar:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor.', null);
  }
};
