const jwt = require('jsonwebtoken');
const { enviarRespuesta } = require('../utils/respuesta');

exports.verificarToken = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return enviarRespuesta(res, 401, 'Token de autenticación requerido.', null);
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return enviarRespuesta(res, 401, 'Token inválido o expirado.', null);
  }
};

exports.soloRol = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol)) {
    return enviarRespuesta(res, 403, 'No tienes permiso para realizar esta acción.', null);
  }
  return next();
};
