const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');
const { verificarToken } = require('./middlewares/auth');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba: confirma que Express responde
app.get('/api/test', (req, res) => {
    res.json({ mensaje: 'El servidor Express está funcionando correctamente' });
});

// Ruta de salud: confirma que PostgreSQL responde
app.get('/api/health', async (req, res) => {
    try {
        const r = await db.query('SELECT NOW()');
        res.json({ ok: true, hora: r.rows[0].now });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, error: 'Error de base de datos' });
    }
});

// Rutas de autenticación (registro y login)
app.use('/api/auth', require('./routes/auth.routes'));

app.use('/api/polizas', require('./routes/polizas.routes'));

app.use('/api/albaceas', require('./routes/albaceas.routes'));

app.use('/api/checkin', require('./routes/checkin.routes'));
// Ruta protegida de prueba: verifica que el JWT funciona
app.use('/api/mensajes', require('./routes/mensajes.routes'));
app.get('/api/perfil', verificarToken, (req, res) => {
    res.json({ mensaje: 'Token válido', usuario: req.user });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
