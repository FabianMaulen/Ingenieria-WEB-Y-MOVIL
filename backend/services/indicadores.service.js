/**
 * Servicio de indicadores económicos oficiales de Chile (UF diaria) vía mindicador.cl
 * con caché en memoria de 6 horas para optimizar latencia y evitar saturar la API externa (EF4 + EF5).
 */

const SEIS_HORAS_MS = 6 * 60 * 60 * 1000;
let cacheUf = null;

exports.obtenerValorUf = async () => {
  const ahora = Date.now();
  if (cacheUf && cacheUf.expira > ahora) {
    return { ...cacheUf.data, desde_cache: true };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('https://mindicador.cl/api/uf', { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const serie = Array.isArray(json.serie) ? json.serie[0] : null;
    if (!serie || typeof serie.valor !== 'number') {
      throw new Error('Formato inesperado de indicador UF.');
    }

    const data = {
      valor_uf: serie.valor,
      fecha: serie.fecha,
      fuente: 'mindicador.cl (Banco Central / CMF)',
    };

    cacheUf = { data, expira: ahora + SEIS_HORAS_MS };
    return { ...data, desde_cache: false };
  } catch (error) {
    console.warn('[INDICADORES UF FALLBACK]:', error.message);
    if (cacheUf) {
      return { ...cacheUf.data, desde_cache: true };
    }
    return {
      valor_uf: 39000,
      fecha: new Date().toISOString(),
      fuente: 'referencial-local',
      desde_cache: false,
    };
  }
};
