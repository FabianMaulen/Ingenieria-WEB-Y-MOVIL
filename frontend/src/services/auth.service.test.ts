import { afterEach, describe, expect, test, vi } from 'vitest';
import api from './api';
import {
  guardarSesion,
  logout,
  obtenerToken,
  usuarioGuardado,
  login,
  obtenerUrlGoogle,
  rutaInicialUsuario,
} from './auth.service';

describe('Servicio de autenticación (auth.service.ts)', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test('guardarSesion almacena token, usuario y fija modo TITULAR por defecto', () => {
    guardarSesion('jwt-demo-123', {
      id: 10,
      nombre: 'María Pérez',
      correo: 'maria@correo.cl',
      rol: 'TITULAR',
    });

    expect(obtenerToken()).toBe('jwt-demo-123');
    expect(usuarioGuardado()?.nombre).toBe('María Pérez');
    expect(localStorage.getItem('modo_activo')).toBe('TITULAR');
  });

  test('guardarSesion fija modo ADMIN automáticamente para administradores', () => {
    guardarSesion('jwt-admin', {
      id: 1,
      nombre: 'Soporte Admin',
      correo: 'admin@bauleterno.cl',
      rol: 'ADMIN',
    });

    expect(localStorage.getItem('modo_activo')).toBe('ADMIN');
    expect(localStorage.getItem('user_rol')).toBe('ADMIN');
  });

  test('guardarSesion y rutaInicialUsuario dirigen a /guia en modo ALBACEA si fue invitado y aún no activa su propia bóveda', () => {
    const invitado = {
      id: 22,
      nombre: 'Camila Invitada',
      correo: 'camila@correo.cl',
      rol: 'TITULAR' as const,
      boveda_activa: false,
      total_designaciones: 1,
    };
    guardarSesion('jwt-albacea', invitado);

    expect(localStorage.getItem('modo_activo')).toBe('ALBACEA');
    expect(rutaInicialUsuario(invitado)).toBe('/guia');
  });

  test('logout elimina completamente la sesión local', () => {
    guardarSesion('jwt-demo', { id: 2, nombre: 'Test', rol: 'TITULAR' });
    logout();

    expect(obtenerToken()).toBeNull();
    expect(usuarioGuardado()).toBeNull();
    expect(localStorage.getItem('modo_activo')).toBeNull();
  });

  test('login llama a /auth/login y persiste la sesión recibida', async () => {
    const spyPost = vi.spyOn(api, 'post').mockResolvedValue({
      data: {
        mensaje: 'Inicio de sesión exitoso.',
        data: {
          token: 'token-simulado',
          usuario: { id: 5, nombre: 'Ana Demo', correo: 'ana@correo.cl', rol: 'TITULAR' },
        },
      },
    } as any);

    const usuario = await login('ana@correo.cl', 'Clave1234');

    expect(spyPost).toHaveBeenCalledWith('/auth/login', {
      correo_usuario: 'ana@correo.cl',
      password: 'Clave1234',
    });
    expect(usuario.nombre).toBe('Ana Demo');
    expect(obtenerToken()).toBe('token-simulado');
  });

  test('obtenerUrlGoogle retorna la URL de autorización entregada por el backend', async () => {
    const spyGet = vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        mensaje: 'OK',
        data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?state=abc' },
      },
    } as any);

    const url = await obtenerUrlGoogle();

    expect(spyGet).toHaveBeenCalledWith('/auth/google/url');
    expect(url).toContain('accounts.google.com');
  });
});
