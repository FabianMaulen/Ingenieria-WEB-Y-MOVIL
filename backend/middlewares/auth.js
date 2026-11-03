const jwt = require('jsonwebtoken');

exports.verificarToken = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

exports.soloRol = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.rol))
    return res.status(403).json({ error: 'No tienes permiso para esta acción' });
  next();
};