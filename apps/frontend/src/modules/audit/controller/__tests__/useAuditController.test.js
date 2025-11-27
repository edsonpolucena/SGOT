import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuditController } from '../useAuditController';
import http from '../../../../shared/services/http';

vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn()
  }
}));

vi.mock('../../../../shared/hooks/useApiRequest', () => ({
  useApiRequest: () => ({
    loading: false,
    error: null,
    executeRequest: vi.fn((apiCall) => apiCall()),
    setError: vi.fn(),
    buildQueryParams: (filters) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return params;
    }
  })
}));

describe('useAuditController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com logs vazio, stats null e paginação padrão', () => {
    const { result } = renderHook(() => useAuditController());

    expect(result.current.logs).toEqual([]);
    expect(result.current.stats).toBe(null);
    expect(result.current.pagination).toEqual({
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0
    });
  });

  describe('fetchLogs', () => {
    it('deve buscar logs com sucesso', async () => {
      const { result } = renderHook(() => useAuditController());
      const mockData = {
        logs: [{ id: '1', action: 'CREATE' }],
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1
      };
      http.get.mockResolvedValue({ data: mockData });

      let response;
      await act(async () => {
        response = await result.current.fetchLogs();
      });

      expect(http.get).toHaveBeenCalled();
      expect(result.current.logs).toEqual(mockData.logs);
      expect(result.current.pagination).toEqual({
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1
      });
      expect(response).toEqual(mockData);
    });

    it('deve aplicar filtros corretamente', async () => {
      const { result } = renderHook(() => useAuditController());
      http.get.mockResolvedValue({ data: { logs: [], page: 1, limit: 50, total: 0, totalPages: 0 } });

      await act(async () => {
        await result.current.fetchLogs({ userId: '1' });
      });

      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('userId=1')
      );
    });
  });

  describe('fetchLogById', () => {
    it('deve buscar log por ID', async () => {
      const { result } = renderHook(() => useAuditController());
      const mockData = { id: '1', action: 'CREATE' };
      http.get.mockResolvedValue({ data: mockData });

      let response;
      await act(async () => {
        response = await result.current.fetchLogById('1');
      });

      expect(http.get).toHaveBeenCalledWith('/api/audit/logs/1');
      expect(response).toEqual(mockData);
    });
  });

  describe('fetchStats', () => {
    it('deve buscar estatísticas com sucesso', async () => {
      const { result } = renderHook(() => useAuditController());
      const mockData = { total: 100, byAction: {} };
      http.get.mockResolvedValue({ data: mockData });

      await act(async () => {
        await result.current.fetchStats();
      });

      expect(result.current.stats).toEqual(mockData);
    });
  });
});
