import api, { ApiResponse } from './api';

export interface IndicadorUf {
  valor_uf: number;
  fecha: string;
  fuente: string;
  desde_cache: boolean;
}

export const obtenerValorUf = async (): Promise<IndicadorUf> => {
  const res = await api.get<ApiResponse<IndicadorUf>>('/indicadores/uf');
  return res.data.data;
};
