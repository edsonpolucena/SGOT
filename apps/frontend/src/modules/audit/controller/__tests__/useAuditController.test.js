import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuditController } from '../useAuditController';
import http from '../../../../shared/services/http';

vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('useAuditController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =============================
  // FETCH LOGS
  // =============================
  describe('fetchLogs', () => {
    it('deve buscar logs de auditoria com sucesso', async () => {
      const mockResponse = {
        logs: [
          { id: '1', action: 'CREATE', entity: 'User' },
          { id: '2', action: 'UPDATE', entity: 'Company' },
        ],
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1,
      };

      http.get.mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useAuditController());

      const data = await result.current.fetchLogs();

      expect(data).toEqual(mockResponse);
      expect(http.get).toHaveBeenCalledWith('/api/audit/logs?');

      await waitFor(() => {
        expect(result.current.logs).toEqual(mockResponse.logs);
        expect(result.current.pagination.total).toBe(2);
        expect(result.current.pagination.page).toBe(1);
        expect(result.current.pagination.limit).toBe(50);
      });
    });

    it('deve buscar logs com filtros', async () => {
      const mockResponse = {
        logs: [],
        page: 2,
        limit: 20,
        total: 0,
        totalPages: 0,
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
        limit: 20,
      });

      await waitFor(() => {
        expect(result.current.pagination.page).toBe(2);
        expect(result.current.pagination.limit).toBe(20);
      });

      expect(http.get).toHaveBeenCalledTimes(1);
      const calledUrl = http.get.mock.calls[0][0];

      expect(calledUrl).toContain('/api/audit/logs?');
      expect(calledUrl).toContain('userId=user123');
      expect(calledUrl).toContain('action=CREATE');
      expect(calledUrl).toContain('entity=User');
      expect(calledUrl).toContain('startDate=2025-01-01');
      expect(calledUrl).toContain('endDate=2025-01-31');
      expect(calledUrl).toContain('page=2');
      expect(calledUrl).toContain('limit=20');
    });

    it('deve tratar erro ao buscar logs', async () => {
      const errorMessage = 'Erro ao carregar logs';
      http.get.mockRejectedValueOnce({
        response: { data: { message: errorMessage } },
      });

      const { result } = renderHook(() => useAuditController());

      await expect(result.current.fetchLogs()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  // =============================
  // FETCH LOG BY ID
  // =============================
  describe('fetchLogById', () => {
    it('deve buscar log por ID com sucesso', async () => {
      const mockLog = { id: '1', action: 'CREATE', entity: 'User' };
      http.get.mockResolvedValueOnce({ data: mockLog });

      const { result } = renderHook(() => useAuditController());

      const log = await result.current.fetchLogById('1');

      expect(log).toEqual(mockLog);
      expect(http.get).toHaveBeenCalledWith('/api/audit/logs/1');
    });

    it('deve tratar erro ao buscar log por ID', async () => {
      const errorMessage = 'Erro ao buscar log';
      http.get.mockRejectedValueOnce({
        response: { data: { message: errorMessage } },
      });

      const { result } = renderHook(() => useAuditController());

      await expect(result.current.fetchLogById('999')).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  // =============================
  // FETCH STATS
  // =============================
  describe('fetchStats', () => {
    it('deve buscar estatísticas com sucesso', async () => {
      const mockStats = {
        totalLogs: 100,
        byAction: { CREATE: 50, UPDATE: 30, DELETE: 20 },
      };

      http.get.mockResolvedValueOnce({ data: mockStats });

      const { result } = renderHook(() => useAuditController());

      const stats = await result.current.fetchStats();

      expect(stats).toEqual(mockStats);
      expect(http.get).toHaveBeenCalledWith('/api/audit/stats?');

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockStats);
      });
    });

    it('deve buscar estatísticas com filtros de data', async () => {
      const mockStats = { totalLogs: 50 };
      http.get.mockResolvedValueOnce({ data: mockStats });

      const { result } = renderHook(() => useAuditController());

      await result.current.fetchStats({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(http.get).toHaveBeenCalledTimes(1);
      const calledUrl = http.get.mock.calls[0][0];

      expect(calledUrl).toContain('/api/audit/stats?');
      expect(calledUrl).toContain('startDate=2025-01-01');
      expect(calledUrl).toContain('endDate=2025-01-31');
    });

    it('deve tratar erro ao buscar estatísticas', async () => {
      const errorMessage = 'Erro ao carregar estatísticas';
      http.get.mockRejectedValueOnce({
        response: { data: { message: errorMessage } },
      });

      const { result } = renderHook(() => useAuditController());

      await expect(result.current.fetchStats()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });
});
