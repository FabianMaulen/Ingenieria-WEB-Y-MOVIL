const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./db');
const { verificarToken } = require('./middlewares/auth');
const { perfil } = require('./controllers/auth.controller');
const { enviarRespuesta } = require('./utils/respuesta');

const app = express();

// ============================================================================
// Seguridad y Middlewares Globales
// ============================================================================
app.use(helmet());
app.use(morgan('tiny'));

// Política estricta de CORS basada en FRONTEND_URL (soporta múltiples orígenes separados por coma)
const origenesPermitidos = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:8100')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite peticiones sin cabecera Origin (ej. Postman, curl, healthchecks locales)
      if (!origin || origenesPermitidos.includes(origin)) {
        return callback(null, true);
      }
      const err = new Error(`Origen no permitido por política CORS: ${origin}`);
      err.status = 403;
      return callback(err);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));

// ============================================================================
// Rutas de Diagnóstico
// ============================================================================
app.get('/api/test', (req, res) => {
  return enviarRespuesta(res, 200, 'El servidor Express está funcionando correctamente.', {
    status: 'ok',
  });
});

app.get('/api/health', async (req, res) => {
  try {
    const r = await db.query('SELECT NOW()');
    return enviarRespuesta(res, 200, 'Base de datos operativa.', {
      ok: true,
      hora: r.rows[0].now,
    });
  } catch (e) {
    console.error('Error en /api/health:', e);
    return enviarRespuesta(res, 500, 'Error de conexión con la base de datos.', null);
  }
});

// ============================================================================
// Rutas de la API REST
// ============================================================================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/polizas', require('./routes/polizas.routes'));
app.use('/api/albaceas', require('./routes/albaceas.routes'));
app.use('/api/checkin', require('./routes/checkin.routes'));
app.use('/api/mensajes', require('./routes/mensajes.routes'));
app.use('/api/solicitudes', require('./routes/solicitudes.routes'));
app.use('/api/guia', require('./routes/guia.routes'));
app.use('/api/inventario', require('./routes/inventario.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/asistente', require('./routes/asistente.routes'));
app.use('/api/contingencia', require('./routes/contingencia.routes'));

// Alias protegido de perfil
app.get('/api/perfil', verificarToken, perfil);

// ============================================================================
// Manejo de Rutas No Encontradas (404) y Middleware Global de Errores JSON
// ============================================================================
app.use((req, res) => {
  return enviarRespuesta(res, 404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`, null);
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // Error de sintaxis en JSON mal formado en el cuerpo de la petición
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return enviarRespuesta(res, 400, 'El cuerpo de la petición contiene JSON mal formado.', null);
  }

  // Error de payload demasiado grande
  if (err.type === 'entity.too.large') {
    return enviarRespuesta(res, 413, 'El cuerpo de la petición excede el tamaño máximo permitido.', null);
  }

  const status = err.status || err.statusCode || 500;
  const mensaje = status >= 500 ? 'Error interno del servidor.' : err.message || 'Solicitud inválida.';

  if (status >= 500) {
    console.error('Error no controlado:', err);
  }

  return enviarRespuesta(res, status, mensaje, null);
});

// ============================================================================
// Inicio del Servidor
// ============================================================================
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor Baúl Eterno corriendo en el puerto ${PORT}`);
  });
}

module.exports = app;
