const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const { contactoAseguradora } = require('../../utils/aseguradoras');
const { enviarRespuesta } = require('../../utils/respuesta');

describe('contactoAseguradora', () => {
  test('encuentra coincidencia exacta sin distinguir mayúsculas', () => {
    const res = contactoAseguradora('Consorcio');
    assert.ok(res);
    assert.equal(res.web, 'https://www.consorcio.cl');
  });

  test('encuentra coincidencia flexible dentro de una frase', () => {
    const res = contactoAseguradora('Seguro Automotriz Mapfre Chile');
    assert.ok(res);
    assert.equal(res.telefono, '600 700 4000');
  });

  test('devuelve null para aseguradoras desconocidas o entrada vacía', () => {
    assert.equal(contactoAseguradora('Aseguradora Inventada XYZ'), null);
    assert.equal(contactoAseguradora(''), null);
    assert.equal(contactoAseguradora(null), null);
  });
});

describe('enviarRespuesta (contrato JSON uniforme)', () => {
  test('emite { mensaje, data } y agrega meta solo cuando corresponde', () => {
    let codigo = 0;
    let payload = null;
    const resMock = {
      status(code) {
        codigo = code;
        return this;
      },
      json(body) {
        payload = body;
        return this;
      },
    };

    enviarRespuesta(resMock, 200, 'Operación exitosa', { id: 1 });
    assert.equal(codigo, 200);
    assert.deepEqual(payload, { mensaje: 'Operación exitosa', data: { id: 1 } });

    enviarRespuesta(resMock, 200, 'Listado', [1, 2], { total: 2, limit: 20, offset: 0 });
    assert.deepEqual(payload, {
      mensaje: 'Listado',
      data: [1, 2],
      meta: { total: 2, limit: 20, offset: 0 },
    });
  });
});
