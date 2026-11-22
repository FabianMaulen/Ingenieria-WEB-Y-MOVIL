const { describe, test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const request = require('supertest');

const app = require('../../app');
const db = require('../../db');

const crearToken = (payload = { id: 10, rol: 'TITULAR' }) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('Diagnóstico, errores JSON y seguridad global', () => {
  test('GET /api/test responde 200 con contrato uniforme', async () => {
    const res = await request(app).get('/api/test');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'ok');
    assert.ok(res.body.mensaje);
  });

  test('ruta inexistente responde 404 en formato JSON (no HTML)', async () => {
    const res = await request(app).get('/api/ruta-que-no-existe');
    assert.equal(res.status, 404);
    assert.match(res.body.mensaje, /Ruta no encontrada/);
  });

  test('JSON mal formado en el body responde 400 limpio', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ "correo_usuario": "test@cl", }');

    assert.equal(res.status, 400);
    assert.match(res.body.mensaje, /JSON mal formado/);
  });

  test('rechaza origen no autorizado por CORS con 403', async () => {
    const res = await request(app)
      .get('/api/test')
      .set('Origin', 'https://sitio-malicioso.example.com');

    assert.equal(res.status, 403);
  });
});

describe('Autenticación JWT y OAuth 2.0 (state + PKCE)', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('GET /api/auth/perfil sin token responde 401', async () => {
    const res = await request(app).get('/api/auth/perfil');
    assert.equal(res.status, 401);
  });

  test('GET /api/auth/perfil con token alterado responde 401', async () => {
    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', 'Bearer token.falso.alterado');
    assert.equal(res.status, 401);
  });

  test('POST /api/auth/login rechaza petición sin credenciales (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    assert.equal(res.status, 400);
  });

  test('POST /api/auth/login bloquea cuentas suspendidas con 403', async () => {
    const hash = await bcrypt.hash('Password123', 4);
    mock.method(db, 'query', async () => ({
      rows: [
        {
          id_usuario: 99,
          rut: '12345678-5',
          nombre_usuario: 'Usuario Suspendido',
          correo_usuario: 'suspendido@test.cl',
          contrasena_hash: hash,
          rol: 'TITULAR',
          activo: false,
        },
      ],
    }));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo_usuario: 'suspendido@test.cl', password: 'Password123' });

    assert.equal(res.status, 403);
    assert.match(res.body.mensaje, /suspendida/i);
  });

  test('POST /api/auth/login emite JWT válido para cuenta activa', async () => {
    const hash = await bcrypt.hash('ClaveSegura123', 4);
    let llamada = 0;
    mock.method(db, 'query', async () => {
      llamada += 1;
      if (llamada === 1) {
        return {
          rows: [
            {
              id_usuario: 10,
              rut: '12345678-5',
              nombre_usuario: 'Titular Demo',
              correo_usuario: 'titular@test.cl',
              contrasena_hash: hash,
              rol: 'TITULAR',
              activo: true,
              correo_verificado: true,
              frecuencia_checkin_dias: 180,
              plazo_gracia_dias: 7,
              notificar_recordatorios: true,
            },
          ],
        };
      }
      if (llamada === 2) return { rows: [], rowCount: 0 };
      return { rows: [{ total: 1, pendientes: 0, validadas: 1 }] };
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo_usuario: 'titular@test.cl', password: 'ClaveSegura123' });

    assert.equal(res.status, 200);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.usuario.rol, 'TITULAR');
    assert.equal(res.body.data.usuario.es_albacea, true);
  });

  test('GET /api/auth/google/url genera state aleatorio (32 hex) y PKCE S256', async () => {
    const res = await request(app).get('/api/auth/google/url');
    assert.equal(res.status, 200);
    const url = new URL(res.body.data.url);
    assert.equal(url.hostname, 'accounts.google.com');
    assert.match(url.searchParams.get('state'), /^[0-9a-f]{32}$/);
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
    assert.ok(url.searchParams.get('code_challenge'));
  });

  test('POST /api/auth/google rechaza un state inventado con 400', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ code: 'codigo-falso', state: 'state-inexistente-123' });

    assert.equal(res.status, 400);
    assert.match(res.body.mensaje, /state/i);
  });
});

describe('Reglas de negocio: Pólizas, Albaceas (máx. 5), Mensajes externos, Contingencia, Admin y Soporte', () => {
  const tokenTitular = crearToken({ id: 10, rol: 'TITULAR' });
  const tokenAdmin = crearToken({ id: 1, rol: 'ADMIN' });

  beforeEach(() => {
    mock.restoreAll();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  test('DELETE /api/polizas/abc rechaza ID no numérico con 400', async () => {
    const res = await request(app)
      .delete('/api/polizas/abc')
      .set('Authorization', `Bearer ${tokenTitular}`);

    assert.equal(res.status, 400);
  });

  test('POST /api/albaceas aplica el límite máximo de 5 albaceas', async () => {
    let paso = 0;
    mock.method(db, 'query', async () => {
      paso += 1;
      if (paso === 1) return { rows: [{ rut: '12345678-5', nombre_usuario: 'Titular' }] };
      return { rows: [{ total: 5 }] };
    });

    const res = await request(app)
      .post('/api/albaceas')
      .set('Authorization', `Bearer ${tokenTitular}`)
      .send({
        rut_invitado: '11111111-1',
        nombre_albacea: 'Sexto Albacea',
        email_albacea: 'sexto@correo.cl',
        parentesco: 'Amigo/a',
      });

    assert.equal(res.status, 400);
    assert.match(res.body.mensaje, /5 albaceas/i);
  });

  test('POST /api/mensajes permite crear carta cifrada para destinatario externo por correo', async () => {
    let paso = 0;
    mock.method(db, 'query', async (sql, params) => {
      paso += 1;
      if (paso === 1) {
        // Verifica que el contenido enviado a la BD esté cifrado (IV:hex) y no en texto plano
        assert.notEqual(params[0], 'Gracias por todo mamá');
        assert.match(params[0], /^[0-9a-f]{32}:[0-9a-f]+$/);
        return {
          rows: [
            {
              id_mensaje: 77,
              fecha_creacion: '2026-11-22',
              rut_destinatario: null,
              nombre_destinatario: 'Mamá',
              correo_destinatario: 'mama@correo.cl',
              es_externo: true,
              enviado_por_correo: false,
            },
          ],
        };
      }
      return { rows: [], rowCount: 1 };
    });

    const res = await request(app)
      .post('/api/mensajes')
      .set('Authorization', `Bearer ${tokenTitular}`)
      .send({
        tipo_destinatario: 'EXTERNO',
        nombre_destinatario: 'Mamá',
        correo_destinatario: 'mama@correo.cl',
        contenido: 'Gracias por todo mamá',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.es_externo, true);
    assert.equal(res.body.data.correo_destinatario, 'mama@correo.cl');
  });

  test('POST /api/contingencia/reportar rechaza cuando el familiar ingresa el mismo RUT del titular', async () => {
    const res = await request(app)
      .post('/api/contingencia/reportar')
      .field('rut_titular', '12345678-5')
      .field('rut_familiar', '12.345.678-5')
      .field('nombre_familiar', 'Mismo Titular')
      .field('correo_familiar', 'familiar@correo.cl')
      .field('parentesco', 'Hijo/a')
      .attach('certificado', Buffer.from('%PDF-1.4 fake'), {
        filename: 'cert.pdf',
        contentType: 'application/pdf',
      });

    assert.equal(res.status, 400);
    assert.match(res.body.mensaje, /no puede ser el mismo/i);
  });

  test('GET /api/admin/resumen rechaza rol TITULAR con 403', async () => {
    const res = await request(app)
      .get('/api/admin/resumen')
      .set('Authorization', `Bearer ${tokenTitular}`);

    assert.equal(res.status, 403);
  });

  test('GET /api/admin/resumen permite acceso al rol ADMIN (200)', async () => {
    mock.method(db, 'query', async () => ({
      rows: [{ total: 1, admins: 1, suspendidos: 0, monto_total: '0', validados: 0, pendientes: 0, invitados: 0, aprobadas: 0, canceladas: 0, activos: 0, abiertos: 0 }],
    }));

    const res = await request(app)
      .get('/api/admin/resumen')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.usuarios);
    assert.ok(res.body.data.tickets);
  });

  test('POST /api/soporte/contacto genera ticket con código único TK-YYYY-XXXX', async () => {
    let paso = 0;
    mock.method(db, 'query', async (sql, params) => {
      paso += 1;
      if (paso === 1) {
        return { rows: [{ nombre_usuario: 'Titular Demo', correo_usuario: 'titular@test.cl', rut: '12345678-5' }] };
      }
      if (paso === 2) {
        return {
          rows: [
            {
              id_ticket: 5,
              codigo_ticket: params[0],
              categoria: params[2],
              estado_ticket: 'ABIERTO',
              id_solicitud_asociada: null,
              id_reporte_asociado: null,
              fecha_creacion: new Date().toISOString(),
            },
          ],
        };
      }
      return { rows: [], rowCount: 1 };
    });

    const res = await request(app)
      .post('/api/soporte/contacto')
      .set('Authorization', `Bearer ${tokenTitular}`)
      .send({
        categoria: 'Error en apertura de bóveda',
        mensaje: 'Mi bóveda apareció liberada por error y necesito revertirla.',
      });

    assert.equal(res.status, 201);
    assert.match(res.body.data.codigo_ticket, /^TK-\d{4}-[0-9A-F]{4}$/);
    assert.equal(res.body.data.estado_ticket, 'ABIERTO');
  });

  test('POST /api/auth/activar-boveda rechaza si no acepta condiciones o falta configuración mínima (400)', async () => {
    const resSinCond = await request(app)
      .post('/api/auth/activar-boveda')
      .set('Authorization', `Bearer ${tokenTitular}`)
      .send({ acepta_condiciones: false });
    assert.equal(resSinCond.status, 400);

    mock.method(db, 'query', async () => ({
      rows: [{ correo_verificado: false, total_albaceas: 0, total_polizas: 0, total_inventario: 0, total_mensajes: 0 }],
    }));

    const resSinItems = await request(app)
      .post('/api/auth/activar-boveda')
      .set('Authorization', `Bearer ${tokenTitular}`)
      .send({ acepta_condiciones: true });
    assert.equal(resSinItems.status, 400);
    assert.match(resSinItems.body.mensaje, /confirmar tu correo/i);
  });

  test('POST /api/auth/activar-boveda activa la bóveda cuando cumple requisitos mínimos y acepta condiciones (200)', async () => {
    let paso = 0;
    mock.method(db, 'query', async () => {
      paso += 1;
      if (paso === 1) {
        return { rows: [{ correo_verificado: true, total_albaceas: 1, total_polizas: 1, total_inventario: 0, total_mensajes: 0 }] };
      }
      if (paso === 2) {
        return {
          rows: [
            {
              id: 10,
              boveda_activa: true,
              terminos_aceptados_en: new Date().toISOString(),
              fecha_ultimo_checkin: new Date().toISOString(),
              frecuencia_checkin_dias: 180,
              plazo_gracia_dias: 7,
            },
          ],
        };
      }
      return { rows: [], rowCount: 1 };
    });

    const res = await request(app)
      .post('/api/auth/activar-boveda')
      .set('Authorization', `Bearer ${tokenTitular}`)
      .send({ acepta_condiciones: true });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.boveda_activa, true);
  });

  test('GET /api/boveda/kit-emergencia genera y entrega un PDF válido con cabecera %PDF-', async () => {
    let paso = 0;
    mock.method(db, 'query', async () => {
      paso += 1;
      if (paso === 1) {
        return {
          rows: [
            {
              id_usuario: 10,
              rut: '12345678-5',
              nombre_usuario: 'Roberto Morales',
              correo_usuario: 'roberto@correo.cl',
              correo_verificado: true,
              correo_alternativo: null,
              nombre_contacto_confianza: null,
              correo_contacto_confianza: null,
              boveda_activa: true,
              terminos_aceptados_en: new Date().toISOString(),
              frecuencia_checkin_dias: 180,
              plazo_gracia_dias: 7,
              fecha_ultimo_checkin: new Date().toISOString(),
            },
          ],
        };
      }
      if (paso === 2) return { rows: [{ nombre: 'Camila', correo: 'camila@cl', rut_albacea: '19876543-0', parentesco: 'Hijo/a', estado_validacion: 'VALIDADO' }] };
      if (paso === 3) return { rows: [{ tipo_seguro: 'Vida', aseguradora: 'Consorcio', numero_poliza: 'POL-1', ubicacion_fisica: 'Escritorio', monto_referencial: '50000000', tiene_documento: true }] };
      if (paso === 4) return { rows: [{ plataforma: 'Drive', categoria: 'Digital', instruccion: 'Descargar fotos' }] };
      if (paso === 5) return { rows: [{ total_cartas: 2 }] };
      return { rows: [], rowCount: 1 };
    });

    const res = await request(app)
      .get('/api/boveda/kit-emergencia')
      .set('Authorization', `Bearer ${tokenTitular}`)
      .buffer(true)
      .parse((resStream, cb) => {
        const chunks = [];
        resStream.on('data', (c) => chunks.push(c));
        resStream.on('end', () => cb(null, Buffer.concat(chunks)));
      });

    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /application\/pdf/);
    assert.ok(Buffer.isBuffer(res.body));
    assert.equal(res.body.subarray(0, 5).toString('utf8'), '%PDF-');
  });

  test('GET /api/polizas/:id/documento rechaza con 403 a usuarios no autorizados', async () => {
    mock.method(db, 'query', async () => ({
      rows: [
        {
          id_poliza: 7,
          id_usuario: 99,
          documento_cifrado: 'poliza-7.enc',
          documento_nombre: 'seguro.pdf',
          documento_mime: 'application/pdf',
          autorizado: false,
        },
      ],
    }));

    const res = await request(app)
      .get('/api/polizas/7/documento')
      .set('Authorization', `Bearer ${tokenTitular}`);

    assert.equal(res.status, 403);
    assert.match(res.body.mensaje, /no tienes autorización/i);
  });
});
