const db = require('../db');

// GET /api/polizas
exports.listar = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM POLIZA WHERE id_usuario = $1 ORDER BY id_poliza',
      [req.user.id]);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
};

// GET /api/polizas/:id
exports.obtener = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM POLIZA WHERE id_poliza = $1 AND id_usuario = $2',
      [req.params.id, req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Póliza no encontrada' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
};

// POST /api/polizas
exports.crear = async (req, res) => {
  const { tipo_seguro, aseguradora, numero_poliza, ubicacion_fisica, monto_referencial } = req.body || {};

  if (!tipo_seguro || !aseguradora || !numero_poliza || !ubicacion_fisica || monto_referencial == null)
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  if (isNaN(monto_referencial) || Number(monto_referencial) < 0)
    return res.status(400).json({ error: 'Monto inválido' });

  try {
    const { rows } = await db.query(
      `INSERT INTO POLIZA (tipo_seguro, aseguradora, numero_poliza, ubicacion_fisica, monto_referencial, id_usuario)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [tipo_seguro, aseguradora, numero_poliza, ubicacion_fisica, monto_referencial, req.user.id]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
};

// PUT /api/polizas/:id
exports.actualizar = async (req, res) => {
  const { tipo_seguro, aseguradora, numero_poliza, ubicacion_fisica, monto_referencial } = req.body || {};

  if (!tipo_seguro || !aseguradora || !numero_poliza || !ubicacion_fisica || monto_referencial == null)
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  if (isNaN(monto_referencial) || Number(monto_referencial) < 0)
    return res.status(400).json({ error: 'Monto inválido' });

  try {
    const { rows } = await db.query(
      `UPDATE POLIZA
       SET tipo_seguro=$1, aseguradora=$2, numero_poliza=$3,
           ubicacion_fisica=$4, monto_referencial=$5
       WHERE id_poliza=$6 AND id_usuario=$7
       RETURNING *`,
      [tipo_seguro, aseguradora, numero_poliza, ubicacion_fisica, monto_referencial,
       req.params.id, req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Póliza no encontrada' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
};

// DELETE /api/polizas/:id
exports.eliminar = async (req, res) => {
  try {
    const r = await db.query(
      'DELETE FROM POLIZA WHERE id_poliza = $1 AND id_usuario = $2',
      [req.params.id, req.user.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Póliza no encontrada' });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
};