const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizarRut,
  validarRut,
  validarEmail,
  parsearIdEntero,
  parsearPaginacion,
  obtenerIp,
} = require('../../utils/validadores');

describe('normalizarRut', () => {
  test('elimina puntos y agrega guion antes del dígito verificador', () => {
    assert.equal(normalizarRut('12.345.678-5'), '12345678-5');
    assert.equal(normalizarRut('19326834k'), '19326834-K');
  });

  test('retorna cadena vacía ante entradas no válidas', () => {
    assert.equal(normalizarRut(null), '');
    assert.equal(normalizarRut(undefined), '');
    assert.equal(normalizarRut({}), '');
  });
});

describe('validarRut (Módulo 11 chileno)', () => {
  test('acepta RUTs chilenos válidos con dígito numérico y con K', () => {
    assert.equal(validarRut('12345678-5'), true);
    assert.equal(validarRut('12.345.678-5'), true);
    assert.equal(validarRut('11111111-1'), true);
    assert.equal(validarRut('76086428-5'), true);
    assert.equal(validarRut('11111112-k'), true);
  });

  test('rechaza RUTs con dígito verificador incorrecto o formato inválido', () => {
    assert.equal(validarRut('12345678-9'), false);
    assert.equal(validarRut('11111111-0'), false);
    assert.equal(validarRut('1234-5'), false);
    assert.equal(validarRut('abc'), false);
    assert.equal(validarRut(''), false);
  });
});

describe('validarEmail', () => {
  test('acepta correos válidos y normaliza espacios', () => {
    assert.equal(validarEmail('usuario@bauleterno.cl'), true);
    assert.equal(validarEmail('  Persona.Test+1@gmail.com  '), true);
  });

  test('rechaza correos mal formados', () => {
    assert.equal(validarEmail('sin-arroba.cl'), false);
    assert.equal(validarEmail('usuario@dominio'), false);
    assert.equal(validarEmail('usuario@.cl'), false);
    assert.equal(validarEmail(null), false);
  });
});

describe('parsearIdEntero', () => {
  test('acepta enteros positivos como string o número', () => {
    assert.equal(parsearIdEntero('42'), 42);
    assert.equal(parsearIdEntero(7), 7);
  });

  test('rechaza cero, negativos, decimales y texto arbitrario', () => {
    assert.equal(parsearIdEntero('0'), null);
    assert.equal(parsearIdEntero('-5'), null);
    assert.equal(parsearIdEntero('3.14'), null);
    assert.equal(parsearIdEntero('1 OR 1=1'), null);
    assert.equal(parsearIdEntero('abc'), null);
  });
});

describe('parsearPaginacion', () => {
  test('usa valores por defecto cuando no se envían parámetros', () => {
    assert.deepEqual(parsearPaginacion({}), { limit: 20, offset: 0 });
  });

  test('respeta el tope máximo de limit', () => {
    assert.deepEqual(parsearPaginacion({ limit: '500', offset: '10' }, 20, 100), {
      limit: 100,
      offset: 10,
    });
  });

  test('retorna error descriptivo si limit u offset son inválidos', () => {
    const r1 = parsearPaginacion({ limit: '0' });
    const r2 = parsearPaginacion({ offset: '-1' });
    assert.ok(r1.error);
    assert.ok(r2.error);
  });
});

describe('obtenerIp', () => {
  test('devuelve req.ip o respaldo segura', () => {
    assert.equal(obtenerIp({ ip: '127.0.0.1' }), '127.0.0.1');
    assert.equal(obtenerIp({}), 'desconocida');
  });
});
