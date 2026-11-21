/**
 * Utilidades reutilizables de validación y paginación para Baúl Eterno.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RUT_FORMATO_REGEX = /^(\d{7,8})-([\dK])$/;

/**
 * Normaliza un RUT chileno al formato estándar sin puntos y con guion: 12345678-9 o 12345678-K.
 */
function normalizarRut(valor) {
  if (typeof valor !== 'string' && typeof valor !== 'number') return '';
  const limpio = String(valor).replace(/[^0-9kK]/g, '').toUpperCase();
  if (limpio.length < 2) return limpio;
  return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
}

/**
 * Valida formato y dígito verificador (algoritmo Módulo 11) de un RUT chileno.
 */
function validarRut(valor) {
  const normalizado = normalizarRut(valor);
  const match = RUT_FORMATO_REGEX.exec(normalizado);
  if (!match) return false;

  const cuerpo = match[1];
  const dvIngresado = match[2];

  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);
  const dvCalculado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return dvCalculado === dvIngresado;
}

/**
 * Valida el formato de un correo electrónico.
 */
function validarEmail(valor) {
  if (typeof valor !== 'string') return false;
  return EMAIL_REGEX.test(valor.trim().toLowerCase());
}

/**
 * Valida que un parámetro de URL sea un entero positivo válido antes de consultar PostgreSQL.
 * Retorna el entero o null si no es válido.
 */
function parsearIdEntero(valor) {
  if (typeof valor !== 'string' && typeof valor !== 'number') return null;
  const texto = String(valor).trim();
  if (!/^\d+$/.test(texto)) return null;
  const numero = Number(texto);
  if (!Number.isSafeInteger(numero) || numero <= 0) return null;
  return numero;
}

/**
 * Parsea parámetros de paginación (limit y offset) de forma segura.
 */
function parsearPaginacion(query = {}, defaultLimit = 20, maxLimit = 100) {
  let limit = defaultLimit;
  let offset = 0;

  if (query.limit !== undefined && query.limit !== '') {
    const parsed = Number(query.limit);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return { error: 'El parámetro limit debe ser un número entero mayor o igual a 1.' };
    }
    limit = Math.min(parsed, maxLimit);
  }

  if (query.offset !== undefined && query.offset !== '') {
    const parsed = Number(query.offset);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return { error: 'El parámetro offset debe ser un número entero mayor o igual a 0.' };
    }
    offset = parsed;
  }

  return { limit, offset };
}

/**
 * Obtiene la dirección IP del cliente.
 */
function obtenerIp(req) {
  return req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || 'desconocida';
}

module.exports = {
  normalizarRut,
  validarRut,
  validarEmail,
  parsearIdEntero,
  parsearPaginacion,
  obtenerIp,
};
