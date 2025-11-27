import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMonthlySummary, useMonthlyVariationByTax } from '../useAnalyticsData';
import { getMonthlySummary, getMonthlyVariationByTax } from '../../services/analytics.api';

vi.mock('../../services/analytics.api', () => ({
  getMonthlySummary: vi.fn(),
  getMonthlyVariationByTax: vi.fn(),
}));

describe('useAnalyticsData.js - 100% Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useMonthlySummary', () => {
    it('deve buscar dados quando empresaId e mes são fornecidos', async () => {
      const mockData = { total: 1000, impostos: [] };
      getMonthlySummary.mockResolvedValue(mockData);

      const { result } = renderHook(() => useMonthlySummary(1, '2025-01'));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toEqual(mockData);
        expect(result.current.error).toBe(null);
      });

      expect(getMonthlySummary).toHaveBeenCalledWith(1, '2025-01');
    });

    it('não deve buscar quando empresaId é null', async () => {
      const { result } = renderHook(() => useMonthlySummary(null, '2025-01'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBe(null);
      });

      expect(getMonthlySummary).not.toHaveBeenCalled();
    });

    it('não deve buscar quando empresaId é undefined', async () => {
      const { result } = renderHook(() => useMonthlySummary(undefined, '2025-01'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(getMonthlySummary).not.toHaveBeenCalled();
    });

    it('não deve buscar quando mes é null', async () => {
      const { result } = renderHook(() => useMonthlySummary(1, null));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(getMonthlySummary).not.toHaveBeenCalled();
    });

    it('não deve buscar quando mes é undefined', async () => {
      const { result } = renderHook(() => useMonthlySummary(1, undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(getMonthlySummary).not.toHaveBeenCalled();
    });

    it('deve lidar com erro na busca', async () => {
      const mockError = new Error('Network error');
      getMonthlySummary.mockRejectedValue(mockError);

      const { result } = renderHook(() => useMonthlySummary(1, '2025-01'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toEqual(mockError);
        expect(result.current.data).toBe(null);
      });
    });

    it('deve refazer busca quando empresaId muda', async () => {
      const mockData1 = { total: 1000, impostos: [] };
      const mockData2 = { total: 2000, impostos: [] };

      getMonthlySummary
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2);

      const { result, rerender } = renderHook(
        ({ empresaId, mes }) => useMonthlySummary(empresaId, mes),
        { initialProps: { empresaId: 1, mes: '2025-01' } }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData1);
      });

      rerender({ empresaId: 2, mes: '2025-01' });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData2);
      });

      expect(getMonthlySummary).toHaveBeenCalledTimes(2);
    });

    it('deve refazer busca quando mes muda', async () => {
      const mockData1 = { total: 1000, impostos: [] };
      const mockData2 = { total: 2000, impostos: [] };

      getMonthlySummary
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2);

      const { result, rerender } = renderHook(
        ({ empresaId, mes }) => useMonthlySummary(empresaId, mes),
        { initialProps: { empresaId: 1, mes: '2025-01' } }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData1);
      });

      rerender({ empresaId: 1, mes: '2025-02' });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData2);
      });

      expect(getMonthlySummary).toHaveBeenCalledTimes(2);
    });
  });

  describe('useMonthlyVariationByTax', () => {
    it('deve buscar dados quando empresaId e mes são fornecidos', async () => {
      const mockData = { impostos: [] };
      getMonthlyVariationByTax.mockResolvedValue(mockData);

      const { result } = renderHook(() => useMonthlyVariationByTax(1, '2025-01'));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toEqual(mockData);
        expect(result.current.error).toBe(null);
      });

      expect(getMonthlyVariationByTax).toHaveBeenCalledWith(1, '2025-01');
    });

    it('não deve buscar quando empresaId é null', async () => {
      const { result } = renderHook(() => useMonthlyVariationByTax(null, '2025-01'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBe(null);
      });

      expect(getMonthlyVariationByTax).not.toHaveBeenCalled();
    });

    it('não deve buscar quando empresaId é undefined', async () => {
      const { result } = renderHook(() => useMonthlyVariationByTax(undefined, '2025-01'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(getMonthlyVariationByTax).not.toHaveBeenCalled();
    });

    it('não deve buscar quando mes é null', async () => {
      const { result } = renderHook(() => useMonthlyVariationByTax(1, null));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(getMonthlyVariationByTax).not.toHaveBeenCalled();
    });

    it('não deve buscar quando mes é undefined', async () => {
      const { result } = renderHook(() => useMonthlyVariationByTax(1, undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(getMonthlyVariationByTax).not.toHaveBeenCalled();
    });

    it('deve lidar com erro na busca', async () => {
      const mockError = new Error('Network error');
      getMonthlyVariationByTax.mockRejectedValue(mockError);

      const { result } = renderHook(() => useMonthlyVariationByTax(1, '2025-01'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toEqual(mockError);
        expect(result.current.data).toBe(null);
      });
    });

    it('deve refazer busca quando empresaId muda', async () => {
      const mockData1 = { impostos: [] };
      const mockData2 = { impostos: [{ tipo: 'DAS', valor: 1000 }] };

      getMonthlyVariationByTax
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2);

      const { result, rerender } = renderHook(
        ({ empresaId, mes }) => useMonthlyVariationByTax(empresaId, mes),
        { initialProps: { empresaId: 1, mes: '2025-01' } }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData1);
      });

      rerender({ empresaId: 2, mes: '2025-01' });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData2);
      });

      expect(getMonthlyVariationByTax).toHaveBeenCalledTimes(2);
    });

    it('deve refazer busca quando mes muda', async () => {
      const mockData1 = { impostos: [] };
      const mockData2 = { impostos: [{ tipo: 'DAS', valor: 1000 }] };

      getMonthlyVariationByTax
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2);

      const { result, rerender } = renderHook(
        ({ empresaId, mes }) => useMonthlyVariationByTax(empresaId, mes),
        { initialProps: { empresaId: 1, mes: '2025-01' } }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData1);
      });

      rerender({ empresaId: 1, mes: '2025-02' });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData2);
      });

      expect(getMonthlyVariationByTax).toHaveBeenCalledTimes(2);
    });
  });
});
