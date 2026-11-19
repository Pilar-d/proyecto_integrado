/**
 * Capa de consumo de datos con TanStack Query (React Query v5).
 * Proporciona caché en memoria, revalidación en segundo plano, manejo
 * de estados de carga (isLoading/isFetching) e invalidación reactiva.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './axios';

// ==========================================
// 1. CÁLCULO EN VIVO DE METAS E INDICADORES
// ==========================================
export interface CalculoFiltros {
  anio?: number | string;
  corte?: number | string;
  sector?: string;
  programa?: string;
  indicador?: number | string;
}

export const useCalculoIndicadoresQuery = (filtros: CalculoFiltros = {}) => {
  const anio = filtros.anio || 2026;
  return useQuery({
    queryKey: ['calculoIndicadores', { ...filtros, anio }],
    queryFn: async () => {
      const params: Record<string, any> = { anio };
      if (filtros.corte) params.corte = filtros.corte;
      if (filtros.sector && filtros.sector !== 'Todos') params.sector = filtros.sector;
      if (filtros.programa && filtros.programa !== 'Todos') params.programa = filtros.programa;
      if (filtros.indicador) params.indicador = filtros.indicador;

      const res = await api.get('param/calc/', { params });
      return res.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

export interface ComparativoFiltros {
  anio_base?: number | string;
  anio_evaluacion?: number | string;
  sector?: string;
  programa?: string;
}

export const useComparativoHistoricoQuery = (filtros: ComparativoFiltros = {}) => {
  const anioBase = filtros.anio_base || 2025;
  const anioEval = filtros.anio_evaluacion || 2026;
  return useQuery({
    queryKey: ['comparativoHistorico', { ...filtros, anioBase, anioEval }],
    queryFn: async () => {
      const params: Record<string, any> = {
        anio_base: anioBase,
        anio_evaluacion: anioEval,
      };
      if (filtros.sector && filtros.sector !== 'Todos los Sectores') params.sector = filtros.sector;
      if (filtros.programa && filtros.programa !== 'Todos los Programas') params.programa = filtros.programa;

      const res = await api.get('param/comparativo/', { params });
      return res.data;
    },
    staleTime: 1000 * 60 * 3, // 3 minutos
  });
};

// ==========================================
// 2. CATÁLOGO DE METAS Y CELDAS REM
// ==========================================
export const useMetasYCeldasQuery = (anio: string | number = 2026) => {
  return useQuery({
    queryKey: ['metasYCeldas', anio],
    queryFn: async () => {
      const res = await api.get('param/parametrizar-metas-celdas/', {
        params: { anio },
      });
      return res.data;
    },
    staleTime: 1000 * 60 * 3,
  });
};

// ==========================================
// 3. POBLACIÓN FONASA Y DENOMINADORES
// ==========================================
export const usePoblacionQuery = (anio: string | number = 2026) => {
  return useQuery({
    queryKey: ['poblacion', anio],
    queryFn: async () => {
      const res = await api.get('param/poblacion/', {
        params: { anio },
      });
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

// ==========================================
// 4. HISTORIAL DE PLANILLAS REM CARGADAS
// ==========================================
export const useHistorialRemQuery = () => {
  return useQuery({
    queryKey: ['historialRem'],
    queryFn: async () => {
      const res = await api.get('rem/archivos/');
      return res.data;
    },
    staleTime: 1000 * 60 * 1, // 1 minuto
  });
};

// ==========================================
// 5. GESTIÓN DE USUARIOS Y ROLES (GESTOR)
// ==========================================
export const useUsuariosQuery = () => {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const res = await api.get('usuarios/');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useRolesQuery = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('roles/');
      return res.data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutos
  });
};

// ==========================================
// 6. BITÁCORA DE AUDITORÍA (RF-12)
// ==========================================
export const useBitacoraAuditoriaQuery = () => {
  return useQuery({
    queryKey: ['bitacoraAuditoria'],
    queryFn: async () => {
      const res = await api.get('registros-auditoria/');
      return res.data;
    },
    staleTime: 1000 * 30, // 30 segundos
  });
};

// ==========================================
// 7. MUTACIONES CON INVALIDACIÓN AUTOMÁTICA
// ==========================================
export const useMutacionParametrizarMeta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('param/parametrizar-metas-celdas/', payload);
      return res.data;
    },
    onSuccess: () => {
      // Invalida catálogo de metas y cálculo en vivo para refrescar UI
      queryClient.invalidateQueries({ queryKey: ['metasYCeldas'] });
      queryClient.invalidateQueries({ queryKey: ['calculoIndicadores'] });
      queryClient.invalidateQueries({ queryKey: ['bitacoraAuditoria'] });
    },
  });
};

export const useMutacionPoblacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { anio: number; poblacion: any }) => {
      const res = await api.post('param/poblacion/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poblacion'] });
      queryClient.invalidateQueries({ queryKey: ['metasYCeldas'] });
      queryClient.invalidateQueries({ queryKey: ['calculoIndicadores'] });
      queryClient.invalidateQueries({ queryKey: ['bitacoraAuditoria'] });
    },
  });
};

export const useMutacionUploadRem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('rem/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historialRem'] });
      queryClient.invalidateQueries({ queryKey: ['calculoIndicadores'] });
      queryClient.invalidateQueries({ queryKey: ['bitacoraAuditoria'] });
    },
  });
};
