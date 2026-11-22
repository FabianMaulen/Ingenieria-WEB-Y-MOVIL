const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { normalizarRut, validarRut, validarEmail, obtenerIp } = require('../utils/validadores');
const {
  enviarBienvenida,
  enviarRecuperacionPassword,
  enviarConfirmacionCorreo,
  enviarAlertaCambioPassword,
  obtenerUrlFrontend,
} = require('../services/email.service');

async function generarYEnviarVerificacion({ idUsuario, nombre, correo, tipo }) {
  const codigo = String(crypto.randomInt(100000, 1000000));
  const tokenHash = crypto.createHash('sha256').update(codigo).digest('hex');

  await db.query(
    `UPDATE EMAIL_VERIFICACION_TOKEN
     SET usado = TRUE
     WHERE id_usuario = $1 AND tipo = $2 AND usado = FALSE`,
    [idUsuario, tipo]
  );

  await db.query(
    `INSERT INTO EMAIL_VERIFICACION_TOKEN (id_usuario, tipo, correo_destino, token_hash, expira_en)
     VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')`,
    [idUsuario, tipo, correo, tokenHash]
  );

  const urlBase = obtenerUrlFrontend();
  const enlaceConfirmacion = `${urlBase}/verificar-correo?correo=${encodeURIComponent(correo)}&tipo=${tipo}&codigo=${codigo}`;

  return enviarConfirmacionCorreo({
    correo,
    nombre,
    tipo,
    codigo,
    enlaceConfirmacion,
  });
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { rut, nombre_usuario, correo_usuario, password } = req.body || {};

    if (!rut || !nombre_usuario || !correo_usuario || !password) {
      return enviarRespuesta(
        res,
        400,
        'Todos los campos obligatorios (rut, nombre_usuario, correo_usuario, password) son requeridos.',
        null
      );
    }

    const rutNormalizado = normalizarRut(rut);
    if (!validarRut(rutNormalizado)) {
      return enviarRespuesta(
        res,
        400,
        'El RUT ingresado no es válido. Usa formato chileno con dígito verificador correcto (Ej: 12345678-5).',
        null
      );
    }

    const nombreLimpio = String(nombre_usuario).trim();
    if (nombreLimpio.length < 2) {
      return enviarRespuesta(res, 400, 'El nombre de usuario debe tener al menos 2 caracteres.', null);
    }

    const correoNormalizado = String(correo_usuario).trim().toLowerCase();
    if (!validarEmail(correoNormalizado)) {
      return enviarRespuesta(res, 400, 'El formato del correo electrónico no es válido.', null);
    }

    if (typeof password !== 'string' || password.length < 8) {
      return enviarRespuesta(res, 400, 'La contraseña debe tener al menos 8 caracteres.', null);
    }

    const rolFinal = 'TITULAR';
    const hash = await bcrypt.hash(password, 10);

    const { rows } = await db.query(
      `INSERT INTO USUARIO (rut, nombre_usuario, contrasena_hash, rol, correo_usuario, correo_verificado)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       RETURNING id_usuario, rut, nombre_usuario, rol, correo_usuario, correo_verificado`,
      [rutNormalizado, nombreLimpio, hash, rolFinal, correoNormalizado]
    );
    const nuevoUsuario = rows[0];

    // Vincular automáticamente designaciones pendientes/invitadas asociadas a este RUT
    const vinculadas = await db.query(
      `UPDATE DIRECTORIO_ALBACEAS
       SET id_usuario_invitado = $1,
           nombre_albacea = $2,
           email_albacea = $3,
           estado_validacion = CASE
             WHEN estado_validacion = 'INVITADO' THEN 'PENDIENTE'
             ELSE estado_validacion
           END
       WHERE rut_albacea = $4 AND id_usuario_invitado IS NULL
       RETURNING id_directorio`,
      [nuevoUsuario.id_usuario, nombreLimpio, correoNormalizado, rutNormalizado]
    );

    const cantidadVinculadas = vinculadas.rowCount || 0;

    await registrarAuditoria(
      `Registró cuenta de usuario (${rutNormalizado})${cantidadVinculadas > 0 ? ` con ${cantidadVinculadas} designación(es) de albacea vinculada(s)` : ''}`,
      obtenerIp(req),
      nuevoUsuario.id_usuario
    );

    // Envío de bienvenida + correo de confirmación (no bloqueantes)
    enviarBienvenida({
      correo: correoNormalizado,
      nombre: nombreLimpio,
      designacionesVinculadas: cantidadVinculadas,
    }).catch(() => {});

    generarYEnviarVerificacion({
      idUsuario: nuevoUsuario.id_usuario,
      nombre: nombreLimpio,
      correo: correoNormalizado,
      tipo: 'PRINCIPAL',
    }).catch(() => {});

    const mensaje = cantidadVinculadas > 0
      ? `Usuario registrado con éxito. Enviamos un código de confirmación a tu correo y vinculamos ${cantidadVinculadas} invitación(es) de albacea.`
      : 'Usuario registrado con éxito. Enviamos un enlace y código de confirmación a tu correo.';

    return enviarRespuesta(res, 201, mensaje, {
      ...nuevoUsuario,
      designaciones_vinculadas: cantidadVinculadas,
    });
  } catch (e) {
    if (e.code === '23505') {
      return enviarRespuesta(res, 409, 'El RUT o correo electrónico ya se encuentra registrado.', null);
    }
    if (e.code === '23514') {
      return enviarRespuesta(res, 400, 'Los datos ingresados no cumplen con las restricciones de formato.', null);
    }
    console.error('Error en register:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor al registrar el usuario.', null);
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { correo_usuario, identificador, password } = req.body || {};
    const credencial = String(correo_usuario || identificador || '').trim();

    if (!credencial || !password || typeof password !== 'string') {
      return enviarRespuesta(res, 400, 'Correo electrónico (o RUT) y contraseña son requeridos.', null);
    }

    let user = null;
    if (credencial.includes('@')) {
      const { rows } = await db.query(
        'SELECT * FROM USUARIO WHERE LOWER(correo_usuario) = $1',
        [credencial.toLowerCase()]
      );
      user = rows[0] || null;
    } else {
      const rutNormalizado = normalizarRut(credencial);
      const { rows } = await db.query(
        'SELECT * FROM USUARIO WHERE UPPER(rut) = $1 OR LOWER(correo_usuario) = $2',
        [rutNormalizado, credencial.toLowerCase()]
      );
      user = rows[0] || null;
    }

    const passwordValida =
      user && user.contrasena_hash ? await bcrypt.compare(password, user.contrasena_hash) : false;

    if (!passwordValida) {
      return enviarRespuesta(res, 401, 'Credenciales inválidas.', null);
    }

    if (user.activo === false) {
      return enviarRespuesta(
        res,
        403,
        'Tu cuenta se encuentra suspendida por administración. Contacta a soporte para más información.',
        null
      );
    }

    // Vinculación defensiva si existían invitaciones por RUT aún sin enlazar
    if (user.rut) {
      await db.query(
        `UPDATE DIRECTORIO_ALBACEAS
         SET id_usuario_invitado = $1,
             estado_validacion = CASE
               WHEN estado_validacion = 'INVITADO' THEN 'PENDIENTE'
               ELSE estado_validacion
             END
         WHERE rut_albacea = $2 AND id_usuario_invitado IS NULL`,
        [user.id_usuario, user.rut]
      );
    }

    const desigQuery = await db.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE estado_validacion = 'PENDIENTE')::int AS pendientes,
         COUNT(*) FILTER (WHERE estado_validacion = 'VALIDADO')::int AS validadas
       FROM DIRECTORIO_ALBACEAS
       WHERE id_usuario_invitado = $1`,
      [user.id_usuario]
    );

    const resumenDesig = desigQuery.rows[0] || { total: 0, pendientes: 0, validadas: 0 };

    const token = jwt.sign(
      { id: user.id_usuario, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    return enviarRespuesta(res, 200, 'Inicio de sesión exitoso.', {
      token,
      usuario: {
        id: user.id_usuario,
        rut: user.rut,
        nombre: user.nombre_usuario,
        correo: user.correo_usuario,
        correo_verificado: Boolean(user.correo_verificado),
        correo_alternativo: user.correo_alternativo || null,
        correo_alternativo_verificado: Boolean(user.correo_alternativo_verificado),
        nombre_contacto_confianza: user.nombre_contacto_confianza || null,
        correo_contacto_confianza: user.correo_contacto_confianza || null,
        frecuencia_checkin_dias: user.frecuencia_checkin_dias || 180,
        plazo_gracia_dias: user.plazo_gracia_dias || 7,
        notificar_recordatorios: user.notificar_recordatorios !== false,
        rol: user.rol,
        boveda_activa: Boolean(user.boveda_activa),
        terminos_aceptados_en: user.terminos_aceptados_en || null,
        avatar_url: user.avatar_url || null,
        requiere_rut: !user.rut,
        tiene_password: Boolean(user.contrasena_hash),
        es_albacea: resumenDesig.total > 0,
        designaciones_pendientes: resumenDesig.pendientes,
        designaciones_validadas: resumenDesig.validadas,
        total_designaciones: resumenDesig.total,
      },
    });
  } catch (e) {
    console.error('Error en login:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor al iniciar sesión.', null);
  }
};

// GET /api/auth/perfil (y alias /api/perfil)
exports.perfil = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id_usuario AS id, rut, nombre_usuario AS nombre, correo_usuario AS correo,
              rol, activo, boveda_activa, terminos_aceptados_en,
              avatar_url, (contrasena_hash IS NOT NULL) AS tiene_password,
              (rut IS NULL) AS requiere_rut, fecha_ultimo_checkin,
              frecuencia_checkin_dias, plazo_gracia_dias,
              correo_verificado, correo_alternativo, correo_alternativo_verificado,
              nombre_contacto_confianza, correo_contacto_confianza, notificar_recordatorios
       FROM USUARIO
       WHERE id_usuario = $1`,
      [req.user.id]
    );

    if (!rows[0]) {
      return enviarRespuesta(res, 404, 'Usuario no encontrado.', null);
    }

    const [desigQuery, conteosQuery] = await Promise.all([
      db.query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE estado_validacion = 'PENDIENTE')::int AS pendientes,
           COUNT(*) FILTER (WHERE estado_validacion = 'VALIDADO')::int AS validadas
         FROM DIRECTORIO_ALBACEAS
         WHERE id_usuario_invitado = $1`,
        [req.user.id]
      ),
      db.query(
        `SELECT
           (SELECT COUNT(*)::int FROM POLIZA WHERE id_usuario = $1) AS total_polizas,
           (SELECT COUNT(*)::int FROM INVENTARIO WHERE id_usuario = $1) AS total_inventario,
           (SELECT COUNT(*)::int FROM DIRECTORIO_ALBACEAS WHERE id_titular = $1 AND estado_validacion <> 'RECHAZADO') AS total_albaceas,
           (SELECT COUNT(*)::int FROM MENSAJE_POSTUMO WHERE id_usuario = $1) AS total_mensajes`,
        [req.user.id]
      ),
    ]);

    const resumenDesig = desigQuery.rows[0] || { total: 0, pendientes: 0, validadas: 0 };
    const conteos = conteosQuery.rows[0] || {
      total_polizas: 0,
      total_inventario: 0,
      total_albaceas: 0,
      total_mensajes: 0,
    };

    return enviarRespuesta(res, 200, 'Perfil obtenido correctamente.', {
      ...rows[0],
      boveda_activa: Boolean(rows[0].boveda_activa),
      es_albacea: resumenDesig.total > 0,
      designaciones_pendientes: resumenDesig.pendientes,
      designaciones_validadas: resumenDesig.validadas,
      total_designaciones: resumenDesig.total,
      total_polizas: Number(conteos.total_polizas) || 0,
      total_inventario: Number(conteos.total_inventario) || 0,
      total_albaceas: Number(conteos.total_albaceas) || 0,
      total_mensajes: Number(conteos.total_mensajes) || 0,
    });
  } catch (e) {
    console.error('Error en perfil:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor.', null);
  }
};

// POST /api/auth/activar-boveda
// Activa formalmente la bóveda del titular tras validar configuración mínima y aceptación de condiciones.
exports.activarBoveda = async (req, res) => {
  try {
    const { acepta_condiciones } = req.body || {};
    if (acepta_condiciones !== true) {
      return enviarRespuesta(
        res,
        400,
        'Debes confirmar que comprendes y aceptas tus deberes y condiciones antes de activar tu bóveda.',
        null
      );
    }

    const conteosRes = await db.query(
      `SELECT
         u.correo_verificado,
         (SELECT COUNT(*)::int FROM DIRECTORIO_ALBACEAS WHERE id_titular = $1 AND estado_validacion <> 'RECHAZADO') AS total_albaceas,
         (SELECT COUNT(*)::int FROM POLIZA WHERE id_usuario = $1) AS total_polizas,
         (SELECT COUNT(*)::int FROM INVENTARIO WHERE id_usuario = $1) AS total_inventario,
         (SELECT COUNT(*)::int FROM MENSAJE_POSTUMO WHERE id_usuario = $1) AS total_mensajes
       FROM USUARIO u
       WHERE u.id_usuario = $1`,
      [req.user.id]
    );

    const c = conteosRes.rows[0];
    if (!c) {
      return enviarRespuesta(res, 404, 'Usuario no encontrado.', null);
    }

    const correoVerificado = Boolean(c.correo_verificado);
    const totalAlbaceas = Number(c.total_albaceas) || 0;
    const totalRegistros =
      (Number(c.total_polizas) || 0) +
      (Number(c.total_inventario) || 0) +
      (Number(c.total_mensajes) || 0);

    if (!correoVerificado || totalAlbaceas < 1 || totalRegistros < 1) {
      const faltantes = [];
      if (!correoVerificado) faltantes.push('confirmar tu correo electrónico principal');
      if (totalAlbaceas < 1) faltantes.push('designar al menos 1 albacea');
      if (totalRegistros < 1) faltantes.push('guardar al menos 1 registro (póliza, activo digital o carta póstuma)');
      return enviarRespuesta(
        res,
        400,
        `Para activar tu bóveda necesitas completar la configuración mínima: ${faltantes.join(', ')}.`,
        {
          correo_verificado: correoVerificado,
          total_albaceas: totalAlbaceas,
          total_registros: totalRegistros,
        }
      );
    }

    const { rows } = await db.query(
      `UPDATE USUARIO
       SET boveda_activa = TRUE,
           terminos_aceptados_en = NOW(),
           fecha_ultimo_checkin = NOW(),
           ultimo_recordatorio_enviado = NULL
       WHERE id_usuario = $1
       RETURNING id_usuario AS id, boveda_activa, terminos_aceptados_en,
                 fecha_ultimo_checkin, frecuencia_checkin_dias, plazo_gracia_dias`,
      [req.user.id]
    );

    if (!rows[0]) {
      return enviarRespuesta(res, 404, 'Usuario no encontrado.', null);
    }

    await registrarAuditoria(
      'Activó y selló su bóveda personal tras completar configuración mínima y aceptar condiciones de vigencia',
      obtenerIp(req),
      req.user.id
    );

    return enviarRespuesta(
      res,
      200,
      `¡Tu Baúl Eterno quedó sellado y activo! Tu ciclo de vigencia de ${rows[0].frecuencia_checkin_dias} días comienza hoy.`,
      rows[0]
    );
  } catch (e) {
    console.error('Error en activarBoveda:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor al activar la bóveda.', null);
  }
};

// PUT /api/auth/preferencias
exports.actualizarPreferencias = async (req, res) => {
  try {
    const {
      frecuencia_checkin_dias,
      plazo_gracia_dias,
      correo_alternativo,
      nombre_contacto_confianza,
      correo_contacto_confianza,
      notificar_recordatorios,
    } = req.body || {};

    const freq = Number(frecuencia_checkin_dias || 180);
    const gracia = Number(plazo_gracia_dias || 7);

    if (![30, 90, 180, 365].includes(freq)) {
      return enviarRespuesta(res, 400, 'La frecuencia de Check-in permitida es 30, 90, 180 o 365 días.', null);
    }

    if (![3, 7, 14].includes(gracia)) {
      return enviarRespuesta(res, 400, 'El plazo de gracia permitido es 3, 7 o 14 días.', null);
    }

    const actualRes = await db.query(
      `SELECT nombre_usuario, correo_usuario, correo_alternativo, correo_alternativo_verificado
       FROM USUARIO WHERE id_usuario = $1`,
      [req.user.id]
    );
    const actual = actualRes.rows[0];
    if (!actual) return enviarRespuesta(res, 404, 'Usuario no encontrado.', null);

    const altLimpio = correo_alternativo ? String(correo_alternativo).trim().toLowerCase() : null;
    if (altLimpio) {
      if (!validarEmail(altLimpio)) {
        return enviarRespuesta(res, 400, 'El correo alternativo ingresado no tiene un formato válido.', null);
      }
      if (altLimpio === actual.correo_usuario.toLowerCase()) {
        return enviarRespuesta(res, 400, 'El correo alternativo debe ser distinto a tu correo principal.', null);
      }
    }

    const confCorreoLimpio = correo_contacto_confianza
      ? String(correo_contacto_confianza).trim().toLowerCase()
      : null;
    if (confCorreoLimpio && !validarEmail(confCorreoLimpio)) {
      return enviarRespuesta(res, 400, 'El correo del contacto de confianza no tiene un formato válido.', null);
    }

    const confNombreLimpio = nombre_contacto_confianza
      ? String(nombre_contacto_confianza).trim().slice(0, 150)
      : null;

    const cambioAlternativo = altLimpio !== (actual.correo_alternativo || null);
    const altVerificado = altLimpio ? (cambioAlternativo ? false : Boolean(actual.correo_alternativo_verificado)) : false;

    const { rows } = await db.query(
      `UPDATE USUARIO
       SET frecuencia_checkin_dias = $1,
           plazo_gracia_dias = $2,
           correo_alternativo = $3,
           correo_alternativo_verificado = $4,
           nombre_contacto_confianza = $5,
           correo_contacto_confianza = $6,
           notificar_recordatorios = $7
       WHERE id_usuario = $8
       RETURNING id_usuario AS id, rut, nombre_usuario AS nombre, correo_usuario AS correo,
                 rol, avatar_url, frecuencia_checkin_dias, plazo_gracia_dias,
                 correo_verificado, correo_alternativo, correo_alternativo_verificado,
                 nombre_contacto_confianza, correo_contacto_confianza, notificar_recordatorios`,
      [
        freq,
        gracia,
        altLimpio,
        altVerificado,
        confNombreLimpio,
        confCorreoLimpio,
        notificar_recordatorios !== false,
        req.user.id,
      ]
    );

    await registrarAuditoria(
      `Actualizó preferencias de vigilancia (Check-in cada ${freq}d, gracia ${gracia}d)`,
      obtenerIp(req),
      req.user.id
    );

    let envioVerifAlt = false;
    if (altLimpio && cambioAlternativo) {
      await generarYEnviarVerificacion({
        idUsuario: req.user.id,
        nombre: actual.nombre_usuario,
        correo: altLimpio,
        tipo: 'ALTERNATIVO',
      }).catch(() => {});
      envioVerifAlt = true;
    }

    return enviarRespuesta(
      res,
      200,
      envioVerifAlt
        ? 'Preferencias guardadas. Enviamos un código de confirmación a tu correo alternativo.'
        : 'Preferencias de vigencia y notificaciones guardadas correctamente.',
      rows[0]
    );
  } catch (e) {
    console.error('Error en actualizarPreferencias:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor al guardar preferencias.', null);
  }
};

// POST /api/auth/verificar-correo/enviar
exports.enviarCodigoVerificacion = async (req, res) => {
  try {
    const tipo = String(req.body?.tipo || 'PRINCIPAL').trim().toUpperCase();
    if (!['PRINCIPAL', 'ALTERNATIVO'].includes(tipo)) {
      return enviarRespuesta(res, 400, "El tipo debe ser 'PRINCIPAL' o 'ALTERNATIVO'.", null);
    }

    const { rows } = await db.query(
      `SELECT nombre_usuario, correo_usuario, correo_verificado, correo_alternativo, correo_alternativo_verificado
       FROM USUARIO WHERE id_usuario = $1`,
      [req.user.id]
    );
    const u = rows[0];
    if (!u) return enviarRespuesta(res, 404, 'Usuario no encontrado.', null);

    const correoDestino = tipo === 'PRINCIPAL' ? u.correo_usuario : u.correo_alternativo;
    if (!correoDestino) {
      return enviarRespuesta(res, 400, 'Primero debes registrar un correo alternativo antes de confirmarlo.', null);
    }

    if ((tipo === 'PRINCIPAL' && u.correo_verificado) || (tipo === 'ALTERNATIVO' && u.correo_alternativo_verificado)) {
      return enviarRespuesta(res, 200, 'Este correo ya se encuentra confirmado.', { ya_verificado: true });
    }

    await generarYEnviarVerificacion({
      idUsuario: req.user.id,
      nombre: u.nombre_usuario,
      correo: correoDestino,
      tipo,
    });

    return enviarRespuesta(
      res,
      200,
      `Enviamos un código de 6 dígitos y enlace de confirmación a ${correoDestino}.`,
      { correo_destino: correoDestino, tipo }
    );
  } catch (e) {
    console.error('Error en enviarCodigoVerificacion:', e);
    return enviarRespuesta(res, 500, 'Error al enviar el correo de confirmación.', null);
  }
};

// POST /api/auth/verificar-correo/confirmar (autenticado con código de 6 dígitos)
exports.confirmarVerificacionCorreo = async (req, res) => {
  try {
    const tipo = String(req.body?.tipo || 'PRINCIPAL').trim().toUpperCase();
    const codigo = String(req.body?.codigo || '').trim();

    if (!['PRINCIPAL', 'ALTERNATIVO'].includes(tipo) || !codigo) {
      return enviarRespuesta(res, 400, 'Tipo y código de confirmación de 6 dígitos son obligatorios.', null);
    }

    const tokenHash = crypto.createHash('sha256').update(codigo).digest('hex');

    const tokenRes = await db.query(
      `SELECT id_token, correo_destino
       FROM EMAIL_VERIFICACION_TOKEN
       WHERE id_usuario = $1 AND tipo = $2 AND token_hash = $3 AND usado = FALSE AND expira_en > NOW()
       ORDER BY id_token DESC
       LIMIT 1`,
      [req.user.id, tipo, tokenHash]
    );

    if (!tokenRes.rows[0]) {
      return enviarRespuesta(res, 400, 'El código de confirmación es incorrecto o ya expiró.', null);
    }

    await db.query('UPDATE EMAIL_VERIFICACION_TOKEN SET usado = TRUE WHERE id_token = $1', [
      tokenRes.rows[0].id_token,
    ]);

    if (tipo === 'PRINCIPAL') {
      await db.query('UPDATE USUARIO SET correo_verificado = TRUE WHERE id_usuario = $1', [req.user.id]);
    } else {
      await db.query(
        'UPDATE USUARIO SET correo_alternativo_verificado = TRUE WHERE id_usuario = $1 AND LOWER(correo_alternativo) = LOWER($2)',
        [req.user.id, tokenRes.rows[0].correo_destino]
      );
    }

    await registrarAuditoria(
      `Confirmó correo ${tipo.toLowerCase()} (${tokenRes.rows[0].correo_destino})`,
      obtenerIp(req),
      req.user.id
    );

    return enviarRespuesta(res, 200, `Correo ${tipo.toLowerCase()} confirmado correctamente.`, {
      tipo,
      verificado: true,
    });
  } catch (e) {
    console.error('Error en confirmarVerificacionCorreo:', e);
    return enviarRespuesta(res, 500, 'Error al confirmar el correo electrónico.', null);
  }
};

// GET /api/auth/verificar-correo/enlace?correo=...&tipo=...&codigo=... (público desde botón del email)
exports.confirmarVerificacionPorEnlace = async (req, res) => {
  try {
    const correo = String(req.query?.correo || '').trim().toLowerCase();
    const tipo = String(req.query?.tipo || 'PRINCIPAL').trim().toUpperCase();
    const codigo = String(req.query?.codigo || '').trim();

    if (!correo || !codigo || !['PRINCIPAL', 'ALTERNATIVO'].includes(tipo)) {
      return enviarRespuesta(res, 400, 'Enlace de confirmación incompleto o inválido.', null);
    }

    const tokenHash = crypto.createHash('sha256').update(codigo).digest('hex');

    const tokenRes = await db.query(
      `SELECT id_token, id_usuario, correo_destino
       FROM EMAIL_VERIFICACION_TOKEN
       WHERE LOWER(correo_destino) = $1 AND tipo = $2 AND token_hash = $3 AND usado = FALSE AND expira_en > NOW()
       ORDER BY id_token DESC
       LIMIT 1`,
      [correo, tipo, tokenHash]
    );

    if (!tokenRes.rows[0]) {
      return enviarRespuesta(res, 400, 'El enlace de confirmación ya fue usado o expiró.', null);
    }

    const { id_token, id_usuario, correo_destino } = tokenRes.rows[0];
    await db.query('UPDATE EMAIL_VERIFICACION_TOKEN SET usado = TRUE WHERE id_token = $1', [id_token]);

    if (tipo === 'PRINCIPAL') {
      await db.query('UPDATE USUARIO SET correo_verificado = TRUE WHERE id_usuario = $1', [id_usuario]);
    } else {
      await db.query(
        'UPDATE USUARIO SET correo_alternativo_verificado = TRUE WHERE id_usuario = $1 AND LOWER(correo_alternativo) = LOWER($2)',
        [id_usuario, correo_destino]
      );
    }

    await registrarAuditoria(
      `Confirmó correo ${tipo.toLowerCase()} vía enlace (${correo_destino})`,
      obtenerIp(req),
      id_usuario
    );

    return enviarRespuesta(res, 200, `¡Listo! Tu correo ${tipo.toLowerCase()} (${correo_destino}) quedó confirmado.`, {
      tipo,
      correo: correo_destino,
      verificado: true,
    });
  } catch (e) {
    console.error('Error en confirmarVerificacionPorEnlace:', e);
    return enviarRespuesta(res, 500, 'Error al confirmar el enlace de verificación.', null);
  }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { passwordActual, nuevaPassword } = req.body || {};

    if (!passwordActual || !nuevaPassword) {
      return enviarRespuesta(res, 400, 'Debes ingresar tu contraseña actual y la nueva contraseña.', null);
    }

    if (typeof passwordActual !== 'string' || typeof nuevaPassword !== 'string') {
      return enviarRespuesta(res, 400, 'Formato de contraseñas inválido.', null);
    }

    if (nuevaPassword.length < 8) {
      return enviarRespuesta(res, 400, 'La nueva contraseña debe tener al menos 8 caracteres.', null);
    }

    if (passwordActual === nuevaPassword) {
      return enviarRespuesta(res, 400, 'La nueva contraseña debe ser diferente a la contraseña actual.', null);
    }

    const { rows } = await db.query(
      'SELECT id_usuario, nombre_usuario, correo_usuario, correo_alternativo, contrasena_hash FROM USUARIO WHERE id_usuario = $1',
      [req.user.id]
    );

    const user = rows[0];
    if (!user) {
      return enviarRespuesta(res, 404, 'Usuario no encontrado.', null);
    }

    if (!user.contrasena_hash) {
      return enviarRespuesta(
        res,
        400,
        'Tu cuenta fue creada con Google y no posee contraseña local. Usa "Olvidé mi contraseña" si deseas crear una.',
        null
      );
    }

    const coincide = await bcrypt.compare(passwordActual, user.contrasena_hash);
    if (!coincide) {
      return enviarRespuesta(res, 401, 'La contraseña actual es incorrecta.', null);
    }

    const nuevoHash = await bcrypt.hash(nuevaPassword, 10);
    await db.query(
      'UPDATE USUARIO SET contrasena_hash = $1 WHERE id_usuario = $2',
      [nuevoHash, req.user.id]
    );

    await registrarAuditoria('Actualizó su contraseña de acceso', obtenerIp(req), req.user.id);

    // Alerta de seguridad por correo (principal + alternativo si existe)
    enviarAlertaCambioPassword({
      correo: user.correo_usuario,
      correoAlternativo: user.correo_alternativo,
      nombre: user.nombre_usuario,
    }).catch(() => {});

    return enviarRespuesta(
      res,
      200,
      'Contraseña actualizada exitosamente. Enviamos una alerta de seguridad a tu correo.',
      null
    );
  } catch (e) {
    console.error('Error en changePassword:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor al cambiar la contraseña.', null);
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { correo_usuario } = req.body || {};
    const correo = String(correo_usuario || '').trim().toLowerCase();

    if (!correo || !validarEmail(correo)) {
      return enviarRespuesta(res, 400, 'Ingresa un correo electrónico válido.', null);
    }

    const { rows } = await db.query(
      'SELECT id_usuario, nombre_usuario, correo_usuario FROM USUARIO WHERE LOWER(correo_usuario) = $1',
      [correo]
    );

    const mensajeGenerico =
      'Si el correo está registrado, enviamos un código de recuperación de 6 dígitos (válido por 30 minutos).';

    const user = rows[0];
    if (!user) {
      return enviarRespuesta(res, 200, mensajeGenerico, null);
    }

    const codigo = String(crypto.randomInt(100000, 1000000));
    const tokenHash = crypto.createHash('sha256').update(codigo).digest('hex');

    await db.query(
      'UPDATE RESET_PASSWORD_TOKEN SET usado = TRUE WHERE id_usuario = $1 AND usado = FALSE',
      [user.id_usuario]
    );

    await db.query(
      `INSERT INTO RESET_PASSWORD_TOKEN (id_usuario, token_hash, expira_en)
       VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
      [user.id_usuario, tokenHash]
    );

    const urlBase = obtenerUrlFrontend();
    const enlaceReset = `${urlBase}/recuperar?correo=${encodeURIComponent(user.correo_usuario)}&codigo=${codigo}`;

    await enviarRecuperacionPassword({
      correo: user.correo_usuario,
      nombre: user.nombre_usuario,
      codigo,
      enlaceReset,
    });

    await registrarAuditoria('Solicitó código de recuperación de contraseña', obtenerIp(req), user.id_usuario);

    return enviarRespuesta(res, 200, mensajeGenerico, null);
  } catch (e) {
    console.error('Error en forgotPassword:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor al procesar la recuperación.', null);
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { correo_usuario, codigo, nuevaPassword } = req.body || {};
    const correo = String(correo_usuario || '').trim().toLowerCase();
    const codigoLimpio = String(codigo || '').trim();

    if (!correo || !validarEmail(correo) || !codigoLimpio || !nuevaPassword) {
      return enviarRespuesta(
        res,
        400,
        'Correo electrónico, código de 6 dígitos y nueva contraseña son obligatorios.',
        null
      );
    }

    if (typeof nuevaPassword !== 'string' || nuevaPassword.length < 8) {
      return enviarRespuesta(res, 400, 'La nueva contraseña debe tener al menos 8 caracteres.', null);
    }

    const userRes = await db.query(
      'SELECT id_usuario, nombre_usuario, correo_usuario, correo_alternativo FROM USUARIO WHERE LOWER(correo_usuario) = $1',
      [correo]
    );
    const user = userRes.rows[0];
    if (!user) {
      return enviarRespuesta(res, 400, 'Código de recuperación inválido o expirado.', null);
    }

    const tokenHash = crypto.createHash('sha256').update(codigoLimpio).digest('hex');

    const tokenRes = await db.query(
      `SELECT id_token
       FROM RESET_PASSWORD_TOKEN
       WHERE id_usuario = $1 AND token_hash = $2 AND usado = FALSE AND expira_en > NOW()
       ORDER BY id_token DESC
       LIMIT 1`,
      [user.id_usuario, tokenHash]
    );

    if (!tokenRes.rows[0]) {
      return enviarRespuesta(res, 400, 'El código de recuperación es incorrecto o ya expiró.', null);
    }

    const nuevoHash = await bcrypt.hash(nuevaPassword, 10);
    await db.query('UPDATE USUARIO SET contrasena_hash = $1 WHERE id_usuario = $2', [nuevoHash, user.id_usuario]);
    await db.query('UPDATE RESET_PASSWORD_TOKEN SET usado = TRUE WHERE id_token = $1', [tokenRes.rows[0].id_token]);

    await registrarAuditoria('Restableció su contraseña mediante código de recuperación', obtenerIp(req), user.id_usuario);

    enviarAlertaCambioPassword({
      correo: user.correo_usuario,
      correoAlternativo: user.correo_alternativo,
      nombre: user.nombre_usuario,
    }).catch(() => {});

    return enviarRespuesta(res, 200, 'Contraseña restablecida con éxito. Ya puedes iniciar sesión.', null);
  } catch (e) {
    console.error('Error en resetPassword:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor al restablecer la contraseña.', null);
  }
};

// PUT /api/auth/completar-rut
exports.completarRut = async (req, res) => {
  try {
    const { rut } = req.body || {};
    if (!rut) {
      return enviarRespuesta(res, 400, 'El RUT chileno es obligatorio.', null);
    }

    const rutNormalizado = normalizarRut(rut);
    if (!validarRut(rutNormalizado)) {
      return enviarRespuesta(res, 400, 'El RUT ingresado no es válido. Verifica el dígito verificador.', null);
    }

    const { rows } = await db.query(
      `UPDATE USUARIO
       SET rut = $1
       WHERE id_usuario = $2
       RETURNING id_usuario AS id, rut, nombre_usuario AS nombre, correo_usuario AS correo, rol, avatar_url`,
      [rutNormalizado, req.user.id]
    );

    if (!rows[0]) {
      return enviarRespuesta(res, 404, 'Usuario no encontrado.', null);
    }

    const vinculadas = await db.query(
      `UPDATE DIRECTORIO_ALBACEAS
       SET id_usuario_invitado = $1,
           nombre_albacea = $2,
           email_albacea = $3,
           estado_validacion = CASE WHEN estado_validacion = 'INVITADO' THEN 'PENDIENTE' ELSE estado_validacion END
       WHERE rut_albacea = $4 AND id_usuario_invitado IS NULL
       RETURNING id_directorio`,
      [req.user.id, rows[0].nombre, rows[0].correo, rutNormalizado]
    );

    const cant = vinculadas.rowCount || 0;
    await registrarAuditoria(`Completó su RUT chileno (${rutNormalizado}) en cuenta OAuth`, obtenerIp(req), req.user.id);

    const mensaje =
      cant > 0
        ? `RUT registrado con éxito. Se vincularon ${cant} designación(es) pendiente(s) como albacea.`
        : 'RUT registrado correctamente en tu perfil.';

    return enviarRespuesta(res, 200, mensaje, {
      ...rows[0],
      requiere_rut: false,
      designaciones_vinculadas: cant,
    });
  } catch (e) {
    if (e.code === '23505') {
      return enviarRespuesta(res, 409, 'Este RUT ya se encuentra asociado a otra cuenta.', null);
    }
    console.error('Error en completarRut:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor al guardar el RUT.', null);
  }
};
