import api, { ApiResponse } from './api';

export interface RespuestaAsistente {
  respuesta: string;
  fuente: 'gemini' | 'guia-local';
  modelo?: string | null;
}

export const preguntarAsistente = async (pregunta: string): Promise<RespuestaAsistente> => {
  const res = await api.post<ApiResponse<RespuestaAsistente>>(
    '/asistente/preguntar',
    { pregunta },
    { timeout: 20000 }
  );
  return res.data.data;
};
