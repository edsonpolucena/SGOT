import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMonthlySummary, getMonthlyVariationByTax } from '../analytics.api';
import http from '../../../../shared/services/http';

vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn()
  }
}));

describe('analytics.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('getMonthlySummary', () => {
    it('deve buscar resumo mensal com sucesso', async () => {
      const mockData = {
        totalTaxes: 50000,
        totalObligations: 10,
        byStatus: { PENDING: 3, COMPLETED: 7 }
      };

      http.get.mockResolvedValueOnce({ data: mockData });

      const result = await getMonthlySummary('EMP001', '2025-01');

      expect(result).toEqual(mockData);
      expect(http.get).toHaveBeenCalledWith('/api/analytics/summary', {
        params: { empresaId: 'EMP001', mes: '2025-01' }
      });
    });

    it('deve retornar null se empresaId não for fornecido', async () => {
      const result = await getMonthlySummary('', '2025-01');

      expect(result).toBe(null);
      expect(console.warn).toHaveBeenCalledWith('⚠️ getMonthlySummary chamado sem empresaId');
      expect(http.get).not.toHaveBeenCalled();
    });

    it('deve retornar null se empresaId for null', async () => {
      const result = await getMonthlySummary(null, '2025-01');

      expect(result).toBe(null);
      expect(console.warn).toHaveBeenCalled();
    });

    it('deve propagar erros da requisição', async () => {
      http.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(getMonthlySummary('EMP001', '2025-01')).rejects.toThrow('Network error');
    });
  });

  describe('getMonthlyVariationByTax', () => {
    it('deve buscar variação por imposto com sucesso', async () => {
      const mockData = [
        { taxType: 'ICMS', value: 10000, variation: 5.5 },
        { taxType: 'ISS', value: 8000, variation: -2.3 }
      ];

      http.get.mockResolvedValueOnce({ data: mockData });

      const result = await getMonthlyVariationByTax('EMP001', '2025-01');

      expect(result).toEqual(mockData);
      expect(http.get).toHaveBeenCalledWith('/api/analytics/variation-by-tax', {
        params: { empresaId: 'EMP001', mes: '2025-01' }
      });
    });

    it('deve retornar null se empresaId não for fornecido', async () => {
      const result = await getMonthlyVariationByTax('', '2025-01');

      expect(result).toBe(null);
      expect(console.warn).toHaveBeenCalledWith('⚠️ getMonthlyVariationByTax chamado sem empresaId');
      expect(http.get).not.toHaveBeenCalled();
    });

    it('deve retornar null se empresaId for null', async () => {
      const result = await getMonthlyVariationByTax(null, '2025-01');

      expect(result).toBe(null);
      expect(console.warn).toHaveBeenCalled();
    });

    it('deve retornar null se empresaId for undefined', async () => {
      const result = await getMonthlyVariationByTax(undefined, '2025-01');

      expect(result).toBe(null);
      expect(console.warn).toHaveBeenCalled();
    });

    it('deve propagar erros da requisição', async () => {
      http.get.mockRejectedValueOnce(new Error('Server error'));

      await expect(
        getMonthlyVariationByTax('EMP001', '2025-01')
      ).rejects.toThrow('Server error');
    });
  });
});

