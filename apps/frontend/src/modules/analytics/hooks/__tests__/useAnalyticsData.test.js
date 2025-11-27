import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMonthlySummary, useMonthlyVariationByTax } from '../useAnalyticsData';
import * as analyticsApi from '../../services/analytics.api';

vi.mock('../../services/analytics.api', () => ({
  getMonthlySummary: vi.fn(),
  getMonthlyVariationByTax: vi.fn()
}));

describe('useAnalyticsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useMonthlySummary', () => {
    it('deve inicializar com loading true', () => {
      const { result } = renderHook(() => useMonthlySummary(1, '2025-01'));
      expect(result.current.loading).toBe(true);
    });

    it('deve buscar dados quando empresaId e mes são fornecidos', async () => {
      const mockData = { total: 1000, impostos: [] };
      analyticsApi.getMonthlySummary.mockResolvedValue(mockData);

      const { result } = renderHook(() => useMonthlySummary(1, '2025-01'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(analyticsApi.getMonthlySummary).toHaveBeenCalledWith(1, '2025-01');
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
    });

    it('não deve buscar dados quando empresaId é null', () => {
      const { result } = renderHook(() => useMonthlySummary(null, '2025-01'));

      expect(analyticsApi.getMonthlySummary).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });

    it('não deve buscar dados quando mes é null', () => {
      const { result } = renderHook(() => useMonthlySummary(1, null));

      expect(analyticsApi.getMonthlySummary).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });

    it('deve tratar erro corretamente', async () => {
      const error = new Error('API Error');
      analyticsApi.getMonthlySummary.mockRejectedValue(error);

      const { result } = renderHook(() => useMonthlySummary(1, '2025-01'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.data).toBe(null);
    });
  });

  describe('useMonthlyVariationByTax', () => {
    it('deve inicializar com loading true', () => {
      const { result } = renderHook(() => useMonthlyVariationByTax(1, '2025-01'));
      expect(result.current.loading).toBe(true);
    });

    it('deve buscar dados quando empresaId e mes são fornecidos', async () => {
      const mockData = [{ imposto: 'DAS', variacao: 10.5 }];
      analyticsApi.getMonthlyVariationByTax.mockResolvedValue(mockData);

      const { result } = renderHook(() => useMonthlyVariationByTax(1, '2025-01'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(analyticsApi.getMonthlyVariationByTax).toHaveBeenCalledWith(1, '2025-01');
      expect(result.current.data).toEqual(mockData);
    });

    it('não deve buscar dados quando empresaId é null', () => {
      const { result } = renderHook(() => useMonthlyVariationByTax(null, '2025-01'));

      expect(analyticsApi.getMonthlyVariationByTax).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });

    it('deve tratar erro corretamente', async () => {
      const error = new Error('API Error');
      analyticsApi.getMonthlyVariationByTax.mockRejectedValue(error);

      const { result } = renderHook(() => useMonthlyVariationByTax(1, '2025-01'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
    });
  });
});
