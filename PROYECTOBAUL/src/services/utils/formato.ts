export const fechaLarga = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });

export const fechaHora = (iso: string): string =>
  new Date(iso).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });

export const dinero = (valor: string | number): string =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(valor));

export const tiempoRestante = (limiteIso: string): string => {
  const ms = new Date(limiteIso).getTime() - Date.now();
  if (ms <= 0) return 'Plazo vencido';
  const h = Math.floor(ms / 3600000);
  return h >= 24 ? `${Math.floor(h / 24)} d ${h % 24} h restantes` : `${h} h restantes`;
};
