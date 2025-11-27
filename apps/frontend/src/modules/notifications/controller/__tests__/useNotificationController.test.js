import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNotificationController } from '../useNotificationController';
import http from '../../../../shared/services/http';
import { useApiRequest } from '../../../../shared/hooks/useApiRequest';

vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

// MOCK DO useApiRequest
vi.mock('../../../../shared/hooks/useApiRequest', () => ({
  useApiRequest: vi.fn()
}));

describe('useNotificationController', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock padrão do useApiRequest
    useApiRequest.mockReturnValue({
      loading: false,
      error: null,
      setError: vi.fn(),
      buildQueryParams: (filters) => new URLSearchParams(filters),
      executeRequest: vi.fn((fn) => fn().then(r => r.data))
    });
  });

  /* ========================================================
     fetchUnviewedDocs
  ========================================================= */
  describe('fetchUnviewedDocs', () => {
    it('deve buscar documentos não visualizados com sucesso', async () => {
      const mockDocs = [
        { id: '1', title: 'Doc 1' },
        { id: '2', title: 'Doc 2' }
      ];

      http.get.mockResolvedValueOnce({ data: mockDocs });

      const { result } = renderHook(() => useNotificationController());

      const promise = result.current.fetchUnviewedDocs();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const docs = await promise;

      expect(docs).toEqual(mockDocs);
      expect(result.current.unviewedDocs).toEqual(mockDocs);

      expect(http.get).toHaveBeenCalledWith('/api/notifications/unviewed?');
    });

    it('deve enviar parâmetros quando houver filtros', async () => {
      http.get.mockResolvedValueOnce({ data: [] });

      const { result } = renderHook(() => useNotificationController());

      await result.current.fetchUnviewedDocs({
        companyId: 'EMP001',
        startDate: '2025-01-01'
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

      const setErrorMock = vi.fn();

      useApiRequest.mockReturnValueOnce({
        loading: false,
        error: null,
        setError: setErrorMock,
        buildQueryParams: () => new URLSearchParams(),
        executeRequest: vi.fn(() => {
          throw { response: { data: { message: errorMessage } } };
        })
      });

      const { result } = renderHook(() => useNotificationController());

      await expect(result.current.fetchUnviewedDocs()).rejects.toThrow();

      expect(setErrorMock).toHaveBeenCalledWith(errorMessage);
    });
  });

  /* ========================================================
     resendNotification
  ========================================================= */
  describe('resendNotification', () => {
    it('deve reenviar notificação com sucesso', async () => {
      const mockResponse = { message: 'Notificação enviada' };
      http.post.mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useNotificationController());

      const data = await result.current.resendNotification('obl123');

      expect(data).toEqual(mockResponse);
      expect(http.post).toHaveBeenCalledWith('/api/notifications/send/obl123');
    });

    it('deve tratar erro ao reenviar', async () => {
      const errorMessage = 'Erro ao reenviar notificação';

      http.post.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const setErrorMock = vi.fn();

      useApiRequest.mockReturnValueOnce({
        loading: false,
        error: null,
        setError: setErrorMock,
        executeRequest: vi.fn(() => {
          throw { response: { data: { message: errorMessage } } };
        })
      });

      const { result } = renderHook(() => useNotificationController());

      await expect(result.current.resendNotification('obl123')).rejects.toThrow();
      expect(setErrorMock).toHaveBeenCalledWith(errorMessage);
    });
  });

  /* ========================================================
     fetchNotificationHistory
  ========================================================= */
  describe('fetchNotificationHistory', () => {
    it('deve buscar histórico com sucesso', async () => {
      const mockHistory = [{ id: '1' }];

      http.get.mockResolvedValueOnce({ data: mockHistory });

      const { result } = renderHook(() => useNotificationController());

      const data = await result.current.fetchNotificationHistory('obl123');

      expect(data).toEqual(mockHistory);
      expect(http.get).toHaveBeenCalledWith('/api/notifications/obl123/history');
    });

    it('deve tratar erro ao buscar histórico', async () => {
      const errorMessage = 'Erro ao buscar histórico';

      http.get.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const setErrorMock = vi.fn();

      useApiRequest.mockReturnValueOnce({
        loading: false,
        error: null,
        setError: setErrorMock,
        executeRequest: vi.fn(() => {
          throw { response: { data: { message: errorMessage } } };
        })
      });

      const { result } = renderHook(() => useNotificationController());

      await expect(
        result.current.fetchNotificationHistory('obl123')
      ).rejects.toThrow();

      expect(setErrorMock).toHaveBeenCalledWith(errorMessage);
    });
  });

  /* ========================================================
     fetchStats
  ========================================================= */
  describe('fetchStats', () => {
    it('deve buscar estatísticas com sucesso', async () => {
      const mockStats = { totalNotifications: 100 };

      http.get.mockResolvedValueOnce({ data: mockStats });

      const { result } = renderHook(() => useNotificationController());

      const data = await result.current.fetchStats();

      expect(data).toEqual(mockStats);
      expect(result.current.stats).toEqual(mockStats);

      expect(http.get).toHaveBeenCalledWith('/api/notifications/stats?');
    });

    it('deve passar filtros de data', async () => {
      http.get.mockResolvedValueOnce({ data: {} });

      const { result } = renderHook(() => useNotificationController());

      await result.current.fetchStats({
        startDate: '2025-01-01'
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

      const setErrorMock = vi.fn();

      useApiRequest.mockReturnValueOnce({
        loading: false,
        error: null,
        setError: setErrorMock,
        executeRequest: vi.fn(() => {
          throw { response: { data: { message: errorMessage } } };
        })
      });

      const { result } = renderHook(() => useNotificationController());

      await expect(result.current.fetchStats()).rejects.toThrow();

      expect(setErrorMock).toHaveBeenCalledWith(errorMessage);
    });
  });
});
