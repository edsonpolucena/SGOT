import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuditController } from '../useAuditController';
import http from '../../../../shared/services/http';

vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn()
  }
}));

describe('useAuditController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchLogs', () => {
    it('deve buscar logs de auditoria com sucesso', async () => {
      const mockResponse = {
        logs: [
          { id: '1', action: 'CREATE', entity: 'User' },
          { id: '2', action: 'UPDATE', entity: 'Company' }
        ],
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1
      };

      http.get.mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useAuditController());

      const promise = result.current.fetchLogs();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const data = await promise;

      expect(data).toEqual(mockResponse);
      await waitFor(() => {
        expect(result.current.logs).toEqual(mockResponse.logs);
        expect(result.current.pagination.total).toBe(2);
      });
      expect(http.get).toHaveBeenCalledWith('/api/audit/logs?');
    });

    it('deve buscar logs com filtros', async () => {
      const mockResponse = {
        logs: [],
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0
      };

      http.get.mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useAuditController());

      await result.current.fetchLogs({
        userId: 'user123',
        action: 'CREATE',
        entity: 'User',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        page: 2,
        limit: 20
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('userId=user123')
      );
      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('action=CREATE')
      );
    });

    it('deve tratar erro ao buscar logs', async () => {
      const errorMessage = 'Erro ao carregar logs';
      http.get.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useAuditController());

      await expect(result.current.fetchLogs()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('fetchLogById', () => {
    it('deve buscar log por ID com sucesso', async () => {
      const mockLog = { id: '1', action: 'CREATE', entity: 'User' };
      http.get.mockResolvedValueOnce({ data: mockLog });

      const { result } = renderHook(() => useAuditController());

      const log = await result.current.fetchLogById('1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(log).toEqual(mockLog);
      expect(http.get).toHaveBeenCalledWith('/api/audit/logs/1');
    });

    it('deve tratar erro ao buscar log por ID', async () => {
      const errorMessage = 'Erro ao buscar log';
      http.get.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useAuditController());

      await expect(result.current.fetchLogById('999')).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('fetchStats', () => {
    it('deve buscar estatísticas com sucesso', async () => {
      const mockStats = {
        totalLogs: 100,
        byAction: { CREATE: 50, UPDATE: 30, DELETE: 20 }
      };

      http.get.mockResolvedValueOnce({ data: mockStats });

      const { result } = renderHook(() => useAuditController());

      const promise = result.current.fetchStats();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const stats = await promise;

      expect(stats).toEqual(mockStats);
      await waitFor(() => {
        expect(result.current.stats).toEqual(mockStats);
      });
      expect(http.get).toHaveBeenCalledWith('/api/audit/stats?');
    });

    it('deve buscar estatísticas com filtros de data', async () => {
      const mockStats = { totalLogs: 50 };
      http.get.mockResolvedValueOnce({ data: mockStats });

      const { result } = renderHook(() => useAuditController());

      await result.current.fetchStats({
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('startDate=2025-01-01')
      );
      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('endDate=2025-01-31')
      );
    });

    it('deve tratar erro ao buscar estatísticas', async () => {
      const errorMessage = 'Erro ao carregar estatísticas';
      http.get.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useAuditController());

      await expect(result.current.fetchStats()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });
});

