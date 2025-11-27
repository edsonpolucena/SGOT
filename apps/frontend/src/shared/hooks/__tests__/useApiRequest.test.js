import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useApiRequest } from '../useApiRequest';

describe('useApiRequest.js - 100% Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com loading false e error null', () => {
    const { result } = renderHook(() => useApiRequest());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('deve executar requisição com sucesso', async () => {
    const mockApiCall = vi.fn().mockResolvedValue({ data: { id: '1', name: 'Test' } });

    const { result } = renderHook(() => useApiRequest());

    let response;
    await act(async () => {
      response = await result.current.executeRequest(mockApiCall, 'Erro padrão');
    });

    expect(mockApiCall).toHaveBeenCalledTimes(1);
    expect(response).toEqual({ id: '1', name: 'Test' });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('deve definir loading como true durante requisição', async () => {
    const mockApiCall = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100))
    );

    const { result } = renderHook(() => useApiRequest());

    act(() => {
      result.current.executeRequest(mockApiCall);
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.loading).toBe(false);
  });

  it('deve lidar com erro na requisição', async () => {
    const mockError = {
      response: { data: { message: 'Erro customizado' } },
    };
    const mockApiCall = vi.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useApiRequest());

    await act(async () => {
      try {
        await result.current.executeRequest(mockApiCall, 'Erro padrão');
      } catch (err) {
        // Erro é lançado
      }
    });

    expect(result.current.error).toBe('Erro customizado');
    expect(result.current.loading).toBe(false);
  });

  it('deve usar mensagem padrão quando erro não tem message', async () => {
    const mockError = new Error('Network error');
    const mockApiCall = vi.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useApiRequest());

    await act(async () => {
      try {
        await result.current.executeRequest(mockApiCall, 'Erro padrão');
      } catch (err) {
        // Erro é lançado
      }
    });

    expect(result.current.error).toBe('Erro padrão');
  });

  it('deve limpar error antes de nova requisição', async () => {
    const mockError = { response: { data: { message: 'Erro 1' } } };
    const mockApiCall1 = vi.fn().mockRejectedValue(mockError);
    const mockApiCall2 = vi.fn().mockResolvedValue({ data: { success: true } });

    const { result } = renderHook(() => useApiRequest());

    await act(async () => {
      try {
        await result.current.executeRequest(mockApiCall1, 'Erro padrão');
      } catch (err) {
        // Erro é lançado
      }
    });

    expect(result.current.error).toBe('Erro 1');

    await act(async () => {
      await result.current.executeRequest(mockApiCall2, 'Erro padrão');
    });

    expect(result.current.error).toBe(null);
  });

  it('deve lançar erro após definir error state', async () => {
    const mockError = new Error('Network error');
    const mockApiCall = vi.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useApiRequest());

    await act(async () => {
      await expect(
        result.current.executeRequest(mockApiCall, 'Erro padrão')
      ).rejects.toThrow('Network error');
    });

    expect(result.current.error).toBe('Erro padrão');
  });

  describe('buildQueryParams', () => {
    it('deve criar URLSearchParams com filtros', () => {
      const { result } = renderHook(() => useApiRequest());

      const params = result.current.buildQueryParams({
        status: 'PENDING',
        role: 'ACCOUNTING_SUPER',
      });

      expect(params.get('status')).toBe('PENDING');
      expect(params.get('role')).toBe('ACCOUNTING_SUPER');
    });

    it('deve ignorar valores vazios', () => {
      const { result } = renderHook(() => useApiRequest());

      const params = result.current.buildQueryParams({
        status: 'PENDING',
        role: '',
        companyId: null,
        search: undefined,
      });

      expect(params.get('status')).toBe('PENDING');
      expect(params.get('role')).toBe(null);
      expect(params.get('companyId')).toBe(null);
      expect(params.get('search')).toBe(null);
    });

    it('deve retornar params vazio quando filters é vazio', () => {
      const { result } = renderHook(() => useApiRequest());

      const params = result.current.buildQueryParams({});

      expect(params.toString()).toBe('');
    });

    it('deve retornar params vazio quando filters não é fornecido', () => {
      const { result } = renderHook(() => useApiRequest());

      const params = result.current.buildQueryParams();

      expect(params.toString()).toBe('');
    });

    it('deve incluir valores zero', () => {
      const { result } = renderHook(() => useApiRequest());

      const params = result.current.buildQueryParams({
        page: 0,
        limit: 10,
      });

      expect(params.get('page')).toBe('0');
      expect(params.get('limit')).toBe('10');
    });

    it('deve incluir valores false', () => {
      const { result } = renderHook(() => useApiRequest());

      const params = result.current.buildQueryParams({
        active: false,
      });

      expect(params.get('active')).toBe('false');
    });
  });

  describe('setError', () => {
    it('deve definir error manualmente', () => {
      const { result } = renderHook(() => useApiRequest());

      act(() => {
        result.current.setError('Erro manual');
      });

      expect(result.current.error).toBe('Erro manual');
    });

    it('deve limpar error quando setado como null', () => {
      const { result } = renderHook(() => useApiRequest());

      act(() => {
        result.current.setError('Erro');
      });

      expect(result.current.error).toBe('Erro');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBe(null);
    });
  });
});
