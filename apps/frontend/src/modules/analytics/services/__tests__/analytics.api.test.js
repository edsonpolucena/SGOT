import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getMonthlySummary, getMonthlyVariationByTax } from '../analytics.api';
import http from '../../../../shared/services/http';

// Mock do http service
vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn()
  }
}));

describe('Analytics API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('getMonthlySummary', () => {
    it('deve fazer requisição GET com empresaId e mes', async () => {
      const mockData = {
        totalObligations: 10,
        completed: 8,
        pending: 2
      };

      http.get.mockResolvedValue({ data: mockData });

      const result = await getMonthlySummary(123, '2025-01');

      expect(http.get).toHaveBeenCalledWith('/api/analytics/summary', {
        params: { empresaId: 123, mes: '2025-01' }
      });
      expect(result).toEqual(mockData);
    });

    it('deve retornar null se empresaId não for fornecido', async () => {
      const result = await getMonthlySummary(null, '2025-01');

      expect(http.get).not.toHaveBeenCalled();
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('getMonthlySummary chamado sem empresaId')
      );
    });

    it('deve retornar null se empresaId for undefined', async () => {
      const result = await getMonthlySummary(undefined, '2025-01');

      expect(http.get).not.toHaveBeenCalled();
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('getMonthlySummary chamado sem empresaId')
      );
    });

    it('deve retornar null se empresaId for string vazia', async () => {
      const result = await getMonthlySummary('', '2025-01');

      expect(http.get).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('deve tratar erro da requisição', async () => {
      const error = new Error('Network error');
      http.get.mockRejectedValue(error);

      await expect(getMonthlySummary(123, '2025-01')).rejects.toThrow('Network error');
    });

    it('deve funcionar com diferentes tipos de empresaId', async () => {
      const mockData = { total: 5 };
      http.get.mockResolvedValue({ data: mockData });

      await getMonthlySummary('123', '2025-01');
      expect(http.get).toHaveBeenCalledWith('/api/analytics/summary', {
        params: { empresaId: '123', mes: '2025-01' }
      });
    });
  });

  describe('getMonthlyVariationByTax', () => {
    it('deve fazer requisição GET com empresaId e mes', async () => {
      const mockData = [
        { taxType: 'DAS', variation: 10.5 },
        { taxType: 'ISS_RETIDO', variation: -5.2 }
      ];

      http.get.mockResolvedValue({ data: mockData });

      const result = await getMonthlyVariationByTax(456, '2025-02');

      expect(http.get).toHaveBeenCalledWith('/api/analytics/variation-by-tax', {
        params: { empresaId: 456, mes: '2025-02' }
      });
      expect(result).toEqual(mockData);
    });

    it('deve retornar null se empresaId não for fornecido', async () => {
      const result = await getMonthlyVariationByTax(null, '2025-02');

      expect(http.get).not.toHaveBeenCalled();
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('getMonthlyVariationByTax chamado sem empresaId')
      );
    });

    it('deve retornar null se empresaId for undefined', async () => {
      const result = await getMonthlyVariationByTax(undefined, '2025-02');

      expect(http.get).not.toHaveBeenCalled();
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('getMonthlyVariationByTax chamado sem empresaId')
      );
    });

    it('deve retornar null se empresaId for string vazia', async () => {
      const result = await getMonthlyVariationByTax('', '2025-02');

      expect(http.get).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('deve tratar erro da requisição', async () => {
      const error = new Error('API Error');
      http.get.mockRejectedValue(error);

      await expect(getMonthlyVariationByTax(456, '2025-02')).rejects.toThrow('API Error');
    });

    it('deve funcionar com diferentes formatos de mes', async () => {
      const mockData = [];
      http.get.mockResolvedValue({ data: mockData });

      await getMonthlyVariationByTax(789, '2025-12');
      expect(http.get).toHaveBeenCalledWith('/api/analytics/variation-by-tax', {
        params: { empresaId: 789, mes: '2025-12' }
      });
    });

    it('deve retornar dados vazios quando backend retorna array vazio', async () => {
      http.get.mockResolvedValue({ data: [] });

      const result = await getMonthlyVariationByTax(123, '2025-01');

      expect(result).toEqual([]);
    });
  });
});

