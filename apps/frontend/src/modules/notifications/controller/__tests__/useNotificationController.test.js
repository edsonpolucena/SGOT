import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNotificationController } from '../useNotificationController';
import http from '../../../../shared/services/http';

vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

describe('useNotificationController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchUnviewedDocs', () => {
    it('deve buscar documentos não visualizados com sucesso', async () => {
      const mockDocs = [
        { id: '1', title: 'Doc 1', viewed: false },
        { id: '2', title: 'Doc 2', viewed: false }
      ];

      http.get.mockResolvedValueOnce({ data: mockDocs });

      const { result } = renderHook(() => useNotificationController());

      const promise = result.current.fetchUnviewedDocs();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const docs = await promise;

      expect(docs).toEqual(mockDocs);
      await waitFor(() => {
        expect(result.current.unviewedDocs).toEqual(mockDocs);
      });
      expect(http.get).toHaveBeenCalledWith('/api/notifications/unviewed?');
    });

    it('deve buscar documentos com filtros', async () => {
      const mockDocs = [];
      http.get.mockResolvedValueOnce({ data: mockDocs });

      const { result } = renderHook(() => useNotificationController());

      await result.current.fetchUnviewedDocs({
        companyId: 'EMP001',
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('companyId=EMP001')
      );
      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('startDate=2025-01-01')
      );
    });

    it('deve tratar erro ao buscar documentos', async () => {
      const errorMessage = 'Erro ao carregar documentos';
      http.get.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useNotificationController());

      await expect(result.current.fetchUnviewedDocs()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('resendNotification', () => {
    it('deve reenviar notificação com sucesso', async () => {
      const mockResponse = { message: 'Notificação enviada' };
      http.post.mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useNotificationController());

      const response = await result.current.resendNotification('obligation123');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(response).toEqual(mockResponse);
      expect(http.post).toHaveBeenCalledWith('/api/notifications/send/obligation123');
    });

    it('deve tratar erro ao reenviar notificação', async () => {
      const errorMessage = 'Erro ao reenviar notificação';
      http.post.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useNotificationController());

      await expect(result.current.resendNotification('obligation123')).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('fetchNotificationHistory', () => {
    it('deve buscar histórico de notificações com sucesso', async () => {
      const mockHistory = [
        { id: '1', sentAt: '2025-01-01', status: 'sent' },
        { id: '2', sentAt: '2025-01-02', status: 'delivered' }
      ];

      http.get.mockResolvedValueOnce({ data: mockHistory });

      const { result } = renderHook(() => useNotificationController());

      const history = await result.current.fetchNotificationHistory('obligation123');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(history).toEqual(mockHistory);
      expect(http.get).toHaveBeenCalledWith('/api/notifications/obligation123/history');
    });

    it('deve tratar erro ao buscar histórico', async () => {
      const errorMessage = 'Erro ao buscar histórico';
      http.get.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useNotificationController());

      await expect(
        result.current.fetchNotificationHistory('obligation123')
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('fetchStats', () => {
    it('deve buscar estatísticas com sucesso', async () => {
      const mockStats = {
        totalNotifications: 100,
        delivered: 80,
        failed: 20
      };

      http.get.mockResolvedValueOnce({ data: mockStats });

      const { result } = renderHook(() => useNotificationController());

      const stats = await result.current.fetchStats();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(stats).toEqual(mockStats);
      expect(result.current.stats).toEqual(mockStats);
      expect(http.get).toHaveBeenCalledWith('/api/notifications/stats?');
    });

    it('deve buscar estatísticas com filtros de data', async () => {
      const mockStats = { totalNotifications: 50 };
      http.get.mockResolvedValueOnce({ data: mockStats });

      const { result } = renderHook(() => useNotificationController());

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
    });

    it('deve tratar erro ao buscar estatísticas', async () => {
      const errorMessage = 'Erro ao buscar estatísticas';
      http.get.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useNotificationController());

      await expect(result.current.fetchStats()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });
});

