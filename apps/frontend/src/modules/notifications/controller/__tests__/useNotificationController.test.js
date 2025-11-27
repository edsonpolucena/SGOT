import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotificationController } from '../useNotificationController';
import http from '../../../../shared/services/http';

vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

vi.mock('../../../../shared/hooks/useApiRequest', () => ({
  useApiRequest: () => ({
    loading: false,
    error: null,
    executeRequest: vi.fn(async (apiCall) => {
      const response = await apiCall();
      return response.data; // Extrai response.data como o hook real faz
    }),
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

describe('useNotificationController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com unviewedDocs vazio e stats null', () => {
    const { result } = renderHook(() => useNotificationController());

    expect(result.current.unviewedDocs).toEqual([]);
    expect(result.current.stats).toBe(null);
  });

  describe('fetchUnviewedDocs', () => {
    it('deve buscar documentos não visualizados', async () => {
      const { result } = renderHook(() => useNotificationController());
      const mockData = [{ id: 1, title: 'Doc 1' }];
      http.get.mockResolvedValue({ data: mockData });

      let response;
      await act(async () => {
        response = await result.current.fetchUnviewedDocs();
      });

      expect(http.get).toHaveBeenCalled();
      // executeRequest retorna response.data, então response deve ser mockData
      expect(response).toEqual(mockData);
      expect(result.current.unviewedDocs).toEqual(mockData);
    });

    it('deve aplicar filtros corretamente', async () => {
      const { result } = renderHook(() => useNotificationController());
      http.get.mockResolvedValue({ data: [] });

      await act(async () => {
        await result.current.fetchUnviewedDocs({ companyId: 1 });
      });

      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('companyId=1')
      );
    });
  });

  describe('resendNotification', () => {
    it('deve reenviar notificação', async () => {
      const { result } = renderHook(() => useNotificationController());
      http.post.mockResolvedValue({ data: { success: true } });

      await act(async () => {
        await result.current.resendNotification(1);
      });

      expect(http.post).toHaveBeenCalledWith('/api/notifications/send/1');
    });
  });

  describe('fetchNotificationHistory', () => {
    it('deve buscar histórico de notificações', async () => {
      const { result } = renderHook(() => useNotificationController());
      const mockData = [{ id: 1, sentAt: '2025-01-01' }];
      http.get.mockResolvedValue({ data: mockData });

      let response;
      await act(async () => {
        response = await result.current.fetchNotificationHistory(1);
      });

      expect(http.get).toHaveBeenCalledWith('/api/notifications/1/history');
      // executeRequest retorna response.data, então response deve ser mockData
      expect(response).toEqual(mockData);
    });
  });

  describe('fetchStats', () => {
    it('deve buscar estatísticas', async () => {
      const { result } = renderHook(() => useNotificationController());
      const mockData = { total: 10, sent: 8 };
      http.get.mockResolvedValue({ data: mockData });

      await act(async () => {
        await result.current.fetchStats();
      });

      // executeRequest retorna response.data, então stats deve ser mockData
      expect(result.current.stats).toEqual(mockData);
    });
  });
});
