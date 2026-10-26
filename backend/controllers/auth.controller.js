const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

exports.register = async (req, res) => {
  const { rut, nombre_usuario, correo_usuario, password, rol } = req.body;

  if (!rut || !nombre_usuario || !correo_usuario || !password)
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  if (password.length < 8)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });

  // Nadie puede auto-registrarse como ADMIN
  const rolFinal = ['TITULAR', 'ALBACEA'].includes(rol) ? rol : 'TITULAR';

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      `INSERT INTO USUARIO (rut, nombre_usuario, contrasena_hash, rol, correo_usuario)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id_usuario, rut, nombre_usuario, rol, correo_usuario`,
      [rut, nombre_usuario, hash, rolFinal, correo_usuario]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505')
      return res.status(409).json({ error: 'RUT o correo ya registrado' });
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.login = async (req, res) => {
  const { correo_usuario, password } = req.body;
  if (!correo_usuario || !password)
    return res.status(400).json({ error: 'Correo y contraseña requeridos' });

  try {
    const { rows } = await db.query(
      'SELECT * FROM USUARIO WHERE correo_usuario = $1', [correo_usuario]);
    const user = rows[0];

    // Mismo mensaje si falla el correo o la clave
    if (!user || !(await bcrypt.compare(password, user.contrasena_hash)))
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: user.id_usuario, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    res.json({
      token,
      usuario: { id: user.id_usuario, nombre: user.nombre_usuario, rol: user.rol },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
};