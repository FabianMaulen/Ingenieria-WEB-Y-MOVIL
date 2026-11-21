const THEME_STORAGE_KEY = 'baul_theme';

export const aplicarTema = (oscuro: boolean): void => {
  document.documentElement.classList.toggle('ion-palette-dark', oscuro);
  document.body.classList.toggle('dark', oscuro);
  localStorage.setItem(THEME_STORAGE_KEY, oscuro ? 'dark' : 'light');
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: { oscuro } }));
};

export const obtenerTemaOscuro = (): boolean => {
  const guardado = localStorage.getItem(THEME_STORAGE_KEY);
  if (guardado === 'dark') return true;
  if (guardado === 'light') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
};

export const inicializarTema = (): boolean => {
  const oscuro = obtenerTemaOscuro();
  document.documentElement.classList.toggle('ion-palette-dark', oscuro);
  document.body.classList.toggle('dark', oscuro);
  return oscuro;
};

export const alternarTema = (): boolean => {
  const nuevoEstado = !document.documentElement.classList.contains('ion-palette-dark');
  aplicarTema(nuevoEstado);
  return nuevoEstado;
};
