const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const { cifrarTexto, descifrarTexto } = require('../../utils/cifrado');

describe('Cifrado AES-256-CBC (RNF-03)', () => {
  test('cifra y descifra correctamente texto con tildes, ñ y saltos de línea', () => {
    const original = 'Querida familia:\nLas llaves de la casa están en la caja azul. ¡Los quiero mucho!';
    const cifrado = cifrarTexto(original);

    assert.notEqual(cifrado, original);
    assert.match(cifrado, /^[0-9a-f]{32}:[0-9a-f]+$/);
    assert.equal(descifrarTexto(cifrado), original);
  });

  test('genera un IV aleatorio distinto en cada cifrado del mismo texto', () => {
    const c1 = cifrarTexto('Mensaje confidencial idéntico');
    const c2 = cifrarTexto('Mensaje confidencial idéntico');

    assert.notEqual(c1, c2);
    assert.notEqual(c1.split(':')[0], c2.split(':')[0]);
    assert.equal(descifrarTexto(c1), descifrarTexto(c2));
  });

  test('falla al intentar descifrar un texto manipulado o corrupto', () => {
    const cifrado = cifrarTexto('Secreto protegido');
    const [iv, cuerpo] = cifrado.split(':');
    const manipulado = `${iv}:${'ff'.repeat(cuerpo.length / 2)}`;

    assert.throws(() => descifrarTexto(manipulado));
  });
});
