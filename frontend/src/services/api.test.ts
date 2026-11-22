import { afterEach, describe, expect, test } from 'vitest';
import api, { mensajeError } from './api';

describe('Cliente HTTP y manejo de errores (api.ts)', () => {
  afterEach(() => {
    localStorage.clear();
  });

  test('mensajeError prioriza el campo mensaje entregado por el backend', () => {
    const errAxios = {
      isAxiosError: true,
      response: { data: { mensaje: 'Credenciales inválidas.' } },
    };
    expect(mensajeError(errAxios)).toBe('Credenciales inválidas.');
  });

  test('mensajeError maneja errores sin conexión (sin response)', () => {
    const errRed = {
      isAxiosError: true,
      message: 'Network Error',
    };
    expect(mensajeError(errRed)).toMatch(/conexión|servidor|Network Error/i);
  });

  test('mensajeError acepta Error nativo y valores desconocidos', () => {
    expect(mensajeError(new Error('Fallo controlado'))).toBe('Fallo controlado');
    expect(mensajeError(null)).toMatch(/error/i);
  });

  test('el cliente Axios define baseURL y timeout de 10 segundos', () => {
    expect(api.defaults.baseURL).toBeTruthy();
    expect(api.defaults.timeout).toBe(10000);
  });
});
