import api, { ApiResponse } from './api';

export interface ConsultaBaulResultado {
  existe_baul: boolean;
  rut_consultado: string;
  portal_registro_civil: string;
}

export interface ReporteFamiliarResultado {
  id_reporte: number;
  rut_titular_consultado: string;
  estado_reporte: string;
  hash_documento: string;
  folio_extraido: string | null;
  fecha_reporte: string;
  portal_registro_civil: string;
}

export const consultarBaulFamiliar = async (rut_titular: string) => {
  const res = await api.post<ApiResponse<ConsultaBaulResultado>>('/contingencia/consultar', {
    rut_titular,
  });
  return res.data;
};

export const enviarReporteFamiliar = async (datos: {
  rut_titular: string;
  nombre_familiar: string;
  rut_familiar: string;
  correo_familiar: string;
  parentesco: string;
  certificado: File;
}) => {
  const form = new FormData();
  form.append('rut_titular', datos.rut_titular);
  form.append('nombre_familiar', datos.nombre_familiar);
  form.append('rut_familiar', datos.rut_familiar);
  form.append('correo_familiar', datos.correo_familiar);
  form.append('parentesco', datos.parentesco);
  form.append('certificado', datos.certificado);

  const res = await api.post<ApiResponse<ReporteFamiliarResultado>>('/contingencia/reportar', form, {
    timeout: 30000,
  });
  return res.data;
};
