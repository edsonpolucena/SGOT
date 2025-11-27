import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getMonthlySummary, getMonthlyVariationByTax } from '../analytics.api';
import http from '../../../../shared/services/http';

vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('analytics.api.js - 100% Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.warn = vi.fn();
  });

  describe('getMonthlySummary', () => {
    it('deve buscar resumo mensal com sucesso', async () => {
      const mockData = { total: 1000, impostos: [] };
      http.get.mockResolvedValue({ data: mockData });

      const result = await getMonthlySummary(1, '2025-01');

      expect(http.get).toHaveBeenCalledWith('/api/analytics/summary', {
        params: { empresaId: 1, mes: '2025-01' },
      });
      expect(result).toEqual(mockData);
    });

    it('deve retornar null quando empresaId não é fornecido', async () => {
      const result = await getMonthlySummary(null, '2025-01');

      expect(console.warn).toHaveBeenCalledWith('⚠️ getMonthlySummary chamado sem empresaId');
      expect(result).toBe(null);
      expect(http.get).not.toHaveBeenCalled();
    });

    it('deve retornar null quando empresaId é undefined', async () => {
      const result = await getMonthlySummary(undefined, '2025-01');

      expect(console.warn).toHaveBeenCalledWith('⚠️ getMonthlySummary chamado sem empresaId');
      expect(result).toBe(null);
      expect(http.get).not.toHaveBeenCalled();
    });

    it('deve retornar null quando empresaId é 0', async () => {
      const result = await getMonthlySummary(0, '2025-01');

      expect(console.warn).toHaveBeenCalledWith('⚠️ getMonthlySummary chamado sem empresaId');
      expect(result).toBe(null);
      expect(http.get).not.toHaveBeenCalled();
    });

    it('deve retornar null quando empresaId é string vazia', async () => {
      const result = await getMonthlySummary('', '2025-01');

      expect(console.warn).toHaveBeenCalledWith('⚠️ getMonthlySummary chamado sem empresaId');
      expect(result).toBe(null);
      expect(http.get).not.toHaveBeenCalled();
    });

    it('deve passar parâmetros corretos para a API', async () => {
      http.get.mockResolvedValue({ data: {} });

      await getMonthlySummary(123, '2025-12');

      expect(http.get).toHaveBeenCalledWith('/api/analytics/summary', {
        params: { empresaId: 123, mes: '2025-12' },
      });
    });
  });

  describe('getMonthlyVariationByTax', () => {
    it('deve buscar variação mensal por imposto com sucesso', async () => {
      const mockData = { impostos: [] };
      http.get.mockResolvedValue({ data: mockData });

      const result = await getMonthlyVariationByTax(1, '2025-01');

      expect(http.get).toHaveBeenCalledWith('/api/analytics/variation-by-tax', {
        params: { empresaId: 1, mes: '2025-01' },
      });
      expect(result).toEqual(mockData);
    });

    it('deve retornar null quando empresaId não é fornecido', async () => {
      const result = await getMonthlyVariationByTax(null, '2025-01');

      expect(console.warn).toHaveBeenCalledWith('⚠️ getMonthlyVariationByTax chamado sem empresaId');
      expect(result).toBe(null);
      expect(http.get).not.toHaveBeenCalled();
    });

    it('deve retornar null quando empresaId é undefined', async () => {
      const result = await getMonthlyVariationByTax(undefined, '2025-01');

      expect(console.warn).toHaveBeenCalledWith('⚠️ getMonthlyVariationByTax chamado sem empresaId');
      expect(result).toBe(null);
      expect(http.get).not.toHaveBeenCalled();
    });

    it('deve retornar null quando empresaId é 0', async () => {
      const result = await getMonthlyVariationByTax(0, '2025-01');

      expect(console.warn).toHaveBeenCalledWith('⚠️ getMonthlyVariationByTax chamado sem empresaId');
      expect(result).toBe(null);
      expect(http.get).not.toHaveBeenCalled();
    });

    it('deve retornar null quando empresaId é string vazia', async () => {
      const result = await getMonthlyVariationByTax('', '2025-01');

      expect(console.warn).toHaveBeenCalledWith('⚠️ getMonthlyVariationByTax chamado sem empresaId');
      expect(result).toBe(null);
      expect(http.get).not.toHaveBeenCalled();
    });

    it('deve passar parâmetros corretos para a API', async () => {
      http.get.mockResolvedValue({ data: {} });

      await getMonthlyVariationByTax(456, '2025-06');

      expect(http.get).toHaveBeenCalledWith('/api/analytics/variation-by-tax', {
        params: { empresaId: 456, mes: '2025-06' },
      });
    });
  });
});
