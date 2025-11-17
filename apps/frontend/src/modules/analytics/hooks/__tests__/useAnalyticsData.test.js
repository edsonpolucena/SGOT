import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMonthlySummary, useMonthlyVariationByTax } from '../useAnalyticsData';
import * as analyticsAPI from '../../services/analytics.api';

vi.mock('../../services/analytics.api', () => ({
  getMonthlySummary: vi.fn(),
  getMonthlyVariationByTax: vi.fn()
}));

describe('useAnalyticsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useMonthlySummary', () => {
    it('deve buscar resumo mensal com sucesso', async () => {
      const mockSummary = {
        totalTaxes: 50000,
        totalObligations: 10,
        byStatus: { PENDING: 3, COMPLETED: 7 }
      };

      analyticsAPI.getMonthlySummary.mockResolvedValueOnce(mockSummary);

      const { result } = renderHook(() => useMonthlySummary('EMP001', '2025-01'));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockSummary);
      expect(result.current.error).toBe(null);
      expect(analyticsAPI.getMonthlySummary).toHaveBeenCalledWith('EMP001', '2025-01');
    });

    it('não deve buscar dados se empresaId ou mes não existirem', async () => {
      const { result } = renderHook(() => useMonthlySummary(null, null));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(analyticsAPI.getMonthlySummary).not.toHaveBeenCalled();
    });

    it('deve tratar erro ao buscar resumo mensal', async () => {
      const mockError = new Error('Erro ao buscar dados');
      analyticsAPI.getMonthlySummary.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useMonthlySummary('EMP001', '2025-01'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.data).toBe(null);
    });
  });

  describe('useMonthlyVariationByTax', () => {
    it('deve buscar variação por imposto com sucesso', async () => {
      const mockVariation = [
        { taxType: 'ICMS', value: 10000, variation: 5.5 },
        { taxType: 'ISS', value: 8000, variation: -2.3 }
      ];

      analyticsAPI.getMonthlyVariationByTax.mockResolvedValueOnce(mockVariation);

      const { result } = renderHook(() => useMonthlyVariationByTax('EMP001', '2025-01'));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockVariation);
      expect(result.current.error).toBe(null);
      expect(analyticsAPI.getMonthlyVariationByTax).toHaveBeenCalledWith('EMP001', '2025-01');
    });

    it('não deve buscar dados se empresaId ou mes não existirem', async () => {
      const { result } = renderHook(() => useMonthlyVariationByTax('', ''));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(analyticsAPI.getMonthlyVariationByTax).not.toHaveBeenCalled();
    });

    it('deve tratar erro ao buscar variação por imposto', async () => {
      const mockError = new Error('Erro ao buscar variação');
      analyticsAPI.getMonthlyVariationByTax.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useMonthlyVariationByTax('EMP001', '2025-01'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.data).toBe(null);
    });
  });
});

