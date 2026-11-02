// Formato único para todo el sistema: sin puntos, con guion, K en mayúscula. Ej: 12345678-9
export const normalizarRut = (valor: string): string => {
  const limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase();
  if (limpio.length < 2) return limpio;
  return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
};

export const rutValido = (valor: string): boolean => {
  const m = /^(\d{7,8})-([\dK])$/.exec(normalizarRut(valor));
  if (!m) return false;
  let suma = 0;
  let mult = 2;
  for (let i = m[1].length - 1; i >= 0; i--) {
    suma += Number(m[1][i]) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const resto = 11 - (suma % 11);
  const dv = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return dv === m[2];
};
