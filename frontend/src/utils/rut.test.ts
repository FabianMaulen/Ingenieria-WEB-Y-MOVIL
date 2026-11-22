import { describe, expect, test } from 'vitest';
import { normalizarRut, rutValido, emailValido } from './rut';

describe('Utilidades de RUT chileno y correo electrónico', () => {
  test('normalizarRut limpia puntos, espacios y convierte dv a mayúscula', () => {
    expect(normalizarRut('12.345.678-5')).toBe('12345678-5');
    expect(normalizarRut(' 19326834k ')).toBe('19326834-K');
  });

  test('rutValido acepta RUTs válidos con Módulo 11 y rechaza dígitos inválidos', () => {
    expect(rutValido('12345678-5')).toBe(true);
    expect(rutValido('11.111.111-1')).toBe(true);
    expect(rutValido('76086428-5')).toBe(true);
    expect(rutValido('12345678-9')).toBe(false);
    expect(rutValido('1234-5')).toBe(false);
    expect(rutValido('')).toBe(false);
  });

  test('emailValido distingue correos bien y mal formados', () => {
    expect(emailValido('contacto@bauleterno.cl')).toBe(true);
    expect(emailValido('usuario.test+1@gmail.com')).toBe(true);
    expect(emailValido('correo-invalido')).toBe(false);
    expect(emailValido('usuario@sin-tld')).toBe(false);
  });
});
