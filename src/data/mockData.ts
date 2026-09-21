export interface Poliza {
  id: number;
  aseguradora: string;
  tipo: string;
  nro: string;
  monto: string;
}

export interface Albacea {
  id: number;
  nombre: string;
  rut: string;
  parentesco: string;
  email: string;
}

export interface ActivoDigital {
  id: number;
  plataforma: string;
  instruccion: string;
  destino: string;
}

export const INITIAL_POLIZAS: Poliza[] = [
  { id: 1, aseguradora: 'Banchile Seguros', tipo: 'Desgravamen Hipotecario', nro: 'POL-99281', monto: '$45.000.000' },
  { id: 2, aseguradora: 'SURA', tipo: 'Seguro de Vida', nro: 'SV-10492', monto: '$20.000.000' },
  { id: 3, aseguradora: 'Consorcio', tipo: 'Automotriz Full', nro: 'SA-55412', monto: '$12.000.000' }
];

export const INITIAL_ALBACEAS: Albacea[] = [
  { id: 1, nombre: 'Camila Morales', rut: '20.123.456-7', parentesco: 'Hija', email: 'camila@email.com' },
  { id: 2, nombre: 'Marcela Valenzuela', rut: '16.987.654-3', parentesco: 'Cónyuge', email: 'marcela@email.com' }
];

export const INITIAL_ACTIVOS: ActivoDigital[] = [
  { id: 1, plataforma: 'Google Drive / Fotos', instruccion: 'Descargar respaldo y cerrar cuenta', destino: 'Familiar Directo' },
  { id: 2, plataforma: 'Instagram', instruccion: 'Convertir cuenta en conmemorativa', destino: 'Público' },
  { id: 3, plataforma: 'Suscripción Spotify', instruccion: 'Cancelar cobro recurrente', destino: 'Financiero' }
];