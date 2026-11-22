const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { enviarRespuesta } = require('../utils/respuesta');
const { registrarAuditoria } = require('../utils/auditoria');
const { obtenerIp } = require('../utils/validadores');
const { enviarBienvenida } = require('../services/email.service');

const DIEZ_MINUTOS = 10 * 60 * 1000;
const estadosOAuth = new Map();

// Limpieza periódica de estados expirados cada minuto (Taller 10 - Desafío 2)
const intervaloLimpieza = setInterval(() => {
  const ahora = Date.now();
  for (const [clave, valor] of estadosOAuth.entries()) {
    if (valor.expira < ahora) {
      estadosOAuth.delete(clave);
    }
  }
}, 60 * 1000);
if (typeof intervaloLimpieza.unref === 'function') {
  intervaloLimpieza.unref();
}

function oauthConfigurado() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI
  );
}

// GET /api/auth/google/url
// Genera URL de autorización de Google OAuth 2.0 con state (CSRF) y PKCE S256
exports.obtenerUrlGoogle = (req, res) => {
  if (!oauthConfigurado()) {
    return enviarRespuesta(
      res,
      503,
      'El inicio de sesión con Google aún no está configurado en el servidor (faltan variables GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI).',
      null
    );
  }

  const state = crypto.randomBytes(16).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  // Permitir redirect_uri dinámico si coincide con uno de los orígenes permitidos en FRONTEND_URL
  let redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const originHeader = req.headers.origin;
  const origenesPermitidos = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:8100')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (originHeader && origenesPermitidos.includes(originHeader)) {
    const urisConfiguradas = process.env.GOOGLE_REDIRECT_URI.split(',').map((u) => u.trim());
    const coincidente = urisConfiguradas.find((u) => u.startsWith(originHeader));
    redirectUri = coincidente || urisConfiguradas[0];
  } else {
    redirectUri = process.env.GOOGLE_REDIRECT_URI.split(',')[0].trim();
  }

  estadosOAuth.set(state, {
    codeVerifier,
    redirectUri,
    expira: Date.now() + DIEZ_MINUTOS,
  });

  const parametros = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${parametros.toString()}`;
  return enviarRespuesta(res, 200, 'URL de autorización de Google generada.', { url });
};

// POST /api/auth/google
// Intercambia code + state + PKCE server-to-server, crea/vincula cuenta y emite nuestro JWT
exports.callbackGoogle = async (req, res) => {
  try {
    if (!oauthConfigurado()) {
      return enviarRespuesta(res, 503, 'Google OAuth no está configurado en el servidor.', null);
    }

    const { code, state } = req.body || {};
    if (!code || !state) {
      return enviarRespuesta(res, 400, 'Debes enviar los parámetros code y state.', null);
    }

    // 1. Verificar state (existe, no expiró y se consume una sola vez)
    const guardado = estadosOAuth.get(state);
    estadosOAuth.delete(state);
    if (!guardado || guardado.expira < Date.now()) {
      return enviarRespuesta(
        res,
        400,
        'El parámetro state no es válido o expiró. Vuelve a presionar Continuar con Google.',
        null
      );
    }

    // 2. Intercambiar el code por access_token en Google (petición servidor a servidor)
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: guardado.redirectUri,
        grant_type: 'authorization_code',
        code_verifier: guardado.codeVerifier,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      return enviarRespuesta(
        res,
        401,
        `Google rechazó el código de autorización: ${tokenData.error_description || tokenData.error || 'código inválido'}.`,
        null
      );
    }

    // 3. Consultar OpenID Connect userinfo de Google
    const perfilRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/json',
      },
    });

    if (!perfilRes.ok) {
      return enviarRespuesta(res, 502, 'No se pudo obtener el perfil verificado desde Google.', null);
    }

    const perfil = await perfilRes.json();
    if (!perfil.sub || !perfil.email) {
      return enviarRespuesta(res, 502, 'Google no entregó un identificador o correo electrónico válido.', null);
    }

    const googleId = String(perfil.sub);
    const correo = String(perfil.email).trim().toLowerCase();
    const nombre = String(perfil.name || correo.split('@')[0]).trim();
    const avatarUrl = perfil.picture ? String(perfil.picture) : null;

    // 4. Buscar por google_id; si no existe, vincular por correo o crear cuenta nueva sin contraseña
    let user = null;
    const porGoogle = await db.query('SELECT * FROM USUARIO WHERE google_id = $1', [googleId]);
    user = porGoogle.rows[0] || null;

    if (!user) {
      const porCorreo = await db.query(
        'SELECT * FROM USUARIO WHERE LOWER(correo_usuario) = $1',
        [correo]
      );
      if (porCorreo.rows[0]) {
        const actualizado = await db.query(
          `UPDATE USUARIO
           SET google_id = $1,
               avatar_url = COALESCE($2, avatar_url)
           WHERE id_usuario = $3
           RETURNING *`,
          [googleId, avatarUrl, porCorreo.rows[0].id_usuario]
        );
        user = actualizado.rows[0];
        await registrarAuditoria('Vinculó su cuenta existente con Google OAuth 2.0', obtenerIp(req), user.id_usuario);
      } else {
        const insertado = await db.query(
          `INSERT INTO USUARIO (rut, nombre_usuario, contrasena_hash, google_id, avatar_url, rol, correo_usuario)
           VALUES (NULL, $1, NULL, $2, $3, 'TITULAR', $4)
           RETURNING *`,
          [nombre, googleId, avatarUrl, correo]
        );
        user = insertado.rows[0];
        await registrarAuditoria('Creó cuenta mediante Google OAuth 2.0', obtenerIp(req), user.id_usuario);

        enviarBienvenida({ correo, nombre, designacionesVinculadas: 0 }).catch(() => {});
      }
    } else if (avatarUrl && user.avatar_url !== avatarUrl) {
      await db.query('UPDATE USUARIO SET avatar_url = $1 WHERE id_usuario = $2', [avatarUrl, user.id_usuario]);
      user.avatar_url = avatarUrl;
    }

    // 5. Vinculación defensiva de albacea si el usuario ya tiene RUT
    if (user.rut) {
      await db.query(
        `UPDATE DIRECTORIO_ALBACEAS
         SET id_usuario_invitado = $1,
             estado_validacion = CASE WHEN estado_validacion = 'INVITADO' THEN 'PENDIENTE' ELSE estado_validacion END
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

    // 6. Emitir NUESTRO JWT (idéntico al flujo de contraseña)
    const token = jwt.sign(
      { id: user.id_usuario, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    return enviarRespuesta(res, 200, 'Inicio de sesión con Google exitoso.', {
      token,
      usuario: {
        id: user.id_usuario,
        rut: user.rut,
        nombre: user.nombre_usuario,
        correo: user.correo_usuario,
        rol: user.rol,
        avatar_url: user.avatar_url || null,
        requiere_rut: !user.rut,
        tiene_password: Boolean(user.contrasena_hash),
        es_albacea: resumenDesig.total > 0,
        designaciones_pendientes: resumenDesig.pendientes,
        designaciones_validadas: resumenDesig.validadas,
        total_designaciones: resumenDesig.total,
      },
    });
  } catch (error) {
    console.error('Error en callbackGoogle:', error);
    return enviarRespuesta(res, 500, 'Error interno del servidor al autenticar con Google.', null);
  }
};

exports._estadosOAuth = estadosOAuth;
