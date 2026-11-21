import api, { ApiResponse } from './api';

export type CategoriaInventario =
  | 'General'
  | 'Financiero'
  | 'Familiar Directo'
  | 'Público'
  | 'Digital'
  | 'Físico';

export interface ActivoInventario {
  id_inventario: number;
  plataforma: string;
  instruccion: string;
  categoria: CategoriaInventario;
  fecha_creacion: string;
}

export interface ActivoInventarioInput {
  plataforma: string;
  instruccion: string;
  categoria?: CategoriaInventario;
}

export const listarInventario = async (limit = 50, offset = 0): Promise<ActivoInventario[]> => {
  const res = await api.get<ApiResponse<ActivoInventario[]>>('/inventario', {
    params: { limit, offset },
  });
  return res.data.data || [];
};

export const crearActivoInventario = async (datos: ActivoInventarioInput): Promise<ActivoInventario> => {
  const res = await api.post<ApiResponse<ActivoInventario>>('/inventario', datos);
  return res.data.data;
};

export const actualizarActivoInventario = async (
  id: number,
  datos: ActivoInventarioInput
): Promise<ActivoInventario> => {
  const res = await api.put<ApiResponse<ActivoInventario>>(`/inventario/${id}`, datos);
  return res.data.data;
};

export const eliminarActivoInventario = async (id: number): Promise<void> => {
  await api.delete(`/inventario/${id}`);
};
