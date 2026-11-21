const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { normalizarRut, validarRut, validarEmail, obtenerIp } = require('../utils/validadores');
const { enviarBienvenida, enviarRecuperacionPassword } = require('../services/email.service');

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { rut, nombre_usuario, correo_usuario, password } = req.body || {};

    if (!rut || !nombre_usuario || !correo_usuario || !password) {
      return enviarRespuesta(res, 400, 'Todos los campos obligatorios (rut, nombre_usuario, correo_usuario, password) son requeridos.', null);
    }

    const rutNormalizado = normalizarRut(rut);
    if (!validarRut(rutNormalizado)) {
      return enviarRespuesta(res, 400, 'El RUT ingresado no es válido. Usa formato chileno con dígito verificador correcto (Ej: 12345678-5).', null);
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

    // Modelo dual unificado: todo usuario registrado gestiona su propia bóveda (TITULAR)
    // y puede actuar simultáneamente como albacea de terceros si su RUT figura en DIRECTORIO_ALBACEAS.
    const rolFinal = 'TITULAR';
    const hash = await bcrypt.hash(password, 10);

    const { rows } = await db.query(
      `INSERT INTO USUARIO (rut, nombre_usuario, contrasena_hash, rol, correo_usuario)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_usuario, rut, nombre_usuario, rol, correo_usuario`,
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

    // Envío de correo de bienvenida (no bloqueante)
    enviarBienvenida({
      correo: correoNormalizado,
      nombre: nombreLimpio,
      designacionesVinculadas: cantidadVinculadas,
    }).catch(() => {});

    const mensaje = cantidadVinculadas > 0
      ? `Usuario registrado con éxito. Se vincularon ${cantidadVinculadas} invitación(es) pendiente(s) como albacea.`
      : 'Usuario registrado con éxito.';

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

    // Mismo mensaje si falla el correo/RUT o la contraseña
    if (!user || !(await bcrypt.compare(password, user.contrasena_hash))) {
      return enviarRespuesta(res, 401, 'Credenciales inválidas.', null);
    }

    // Vinculación defensiva si existían invitaciones por RUT aún sin enlazar
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
        rol: user.rol,
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
              rol, fecha_ultimo_checkin
       FROM USUARIO
       WHERE id_usuario = $1`,
      [req.user.id]
    );

    if (!rows[0]) {
      return enviarRespuesta(res, 404, 'Usuario no encontrado.', null);
    }

    const desigQuery = await db.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE estado_validacion = 'PENDIENTE')::int AS pendientes,
         COUNT(*) FILTER (WHERE estado_validacion = 'VALIDADO')::int AS validadas
       FROM DIRECTORIO_ALBACEAS
       WHERE id_usuario_invitado = $1`,
      [req.user.id]
    );

    const resumenDesig = desigQuery.rows[0] || { total: 0, pendientes: 0, validadas: 0 };

    return enviarRespuesta(res, 200, 'Perfil obtenido correctamente.', {
      ...rows[0],
      es_albacea: resumenDesig.total > 0,
      designaciones_pendientes: resumenDesig.pendientes,
      designaciones_validadas: resumenDesig.validadas,
      total_designaciones: resumenDesig.total,
    });
  } catch (e) {
    console.error('Error en perfil:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor.', null);
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
      'SELECT id_usuario, contrasena_hash FROM USUARIO WHERE id_usuario = $1',
      [req.user.id]
    );

    const user = rows[0];
    if (!user) {
      return enviarRespuesta(res, 404, 'Usuario no encontrado.', null);
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

    return enviarRespuesta(res, 200, 'Contraseña actualizada exitosamente.', null);
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

    // Respuesta genérica para no revelar si un correo existe o no en el sistema
    const mensajeGenerico =
      'Si el correo está registrado, enviamos un código de recuperación de 6 dígitos (válido por 30 minutos).';

    const user = rows[0];
    if (!user) {
      return enviarRespuesta(res, 200, mensajeGenerico, null);
    }

    const codigo = String(crypto.randomInt(100000, 1000000));
    const tokenHash = crypto.createHash('sha256').update(codigo).digest('hex');

    // Invalidar códigos previos sin usar del mismo usuario
    await db.query(
      'UPDATE RESET_PASSWORD_TOKEN SET usado = TRUE WHERE id_usuario = $1 AND usado = FALSE',
      [user.id_usuario]
    );

    await db.query(
      `INSERT INTO RESET_PASSWORD_TOKEN (id_usuario, token_hash, expira_en)
       VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
      [user.id_usuario, tokenHash]
    );

    const urlBase = (process.env.FRONTEND_URL || 'http://localhost:8100').split(',')[0].trim();
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
      return enviarRespuesta(res, 400, 'Correo electrónico, código de 6 dígitos y nueva contraseña son obligatorios.', null);
    }

    if (typeof nuevaPassword !== 'string' || nuevaPassword.length < 8) {
      return enviarRespuesta(res, 400, 'La nueva contraseña debe tener al menos 8 caracteres.', null);
    }

    const userRes = await db.query(
      'SELECT id_usuario FROM USUARIO WHERE LOWER(correo_usuario) = $1',
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

    return enviarRespuesta(res, 200, 'Contraseña restablecida con éxito. Ya puedes iniciar sesión.', null);
  } catch (e) {
    console.error('Error en resetPassword:', e);
    return enviarRespuesta(res, 500, 'Error interno del servidor al restablecer la contraseña.', null);
  }
};
