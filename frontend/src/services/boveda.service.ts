import api from './api';

export const descargarKitEmergenciaPdf = async (): Promise<void> => {
  const res = await api.get('/boveda/kit-emergencia', {
    responseType: 'blob',
    timeout: 25000,
  });

  const blob = new Blob([res.data], { type: 'application/pdf' });
  const disposicion = String(res.headers?.['content-disposition'] || '');
  const match = disposicion.match(/filename="?([^"]+)"?/i);
  const nombreArchivo = match?.[1] || 'Kit-Emergencia-Baul-Eterno.pdf';

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
