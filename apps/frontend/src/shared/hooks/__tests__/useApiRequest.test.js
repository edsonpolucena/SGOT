import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useApiRequest } from '../useApiRequest';

describe('useApiRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com loading false e error null', () => {
    const { result } = renderHook(() => useApiRequest());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('deve executar requisição com sucesso', async () => {
    const { result } = renderHook(() => useApiRequest());
    const mockApiCall = vi.fn().mockResolvedValue({ data: { id: '1' } });

    let response;
    await act(async () => {
      response = await result.current.executeRequest(mockApiCall);
    });

    expect(mockApiCall).toHaveBeenCalledTimes(1);
    expect(response).toEqual({ id: '1' });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('deve definir loading como true durante requisição', async () => {
    const { result } = renderHook(() => useApiRequest());
    const mockApiCall = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100))
    );

    act(() => {
      result.current.executeRequest(mockApiCall);
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.loading).toBe(false);
  });

  it('deve tratar erro e definir error message', async () => {
    const { result } = renderHook(() => useApiRequest());
    const error = {
      response: {
        data: { message: 'Erro customizado' }
      }
    };
    const mockApiCall = vi.fn().mockRejectedValue(error);

    await act(async () => {
      try {
        await result.current.executeRequest(mockApiCall, 'Erro padrão');
      } catch (e) {
        // Esperado
      }
    });

    expect(result.current.error).toBe('Erro customizado');
    expect(result.current.loading).toBe(false);
  });

  it('deve usar mensagem de erro padrão quando não há response.data.message', async () => {
    const { result } = renderHook(() => useApiRequest());
    const error = new Error('Network error');
    const mockApiCall = vi.fn().mockRejectedValue(error);

    await act(async () => {
      try {
        await result.current.executeRequest(mockApiCall, 'Erro padrão');
      } catch (e) {
        // Esperado
      }
    });

    expect(result.current.error).toBe('Erro padrão');
  });

  it('deve construir query params corretamente', () => {
    const { result } = renderHook(() => useApiRequest());

    const params = result.current.buildQueryParams({
      status: 'PENDING',
      companyId: 123,
      empty: null,
      undefined: undefined,
      emptyString: ''
    });

    expect(params.get('status')).toBe('PENDING');
    expect(params.get('companyId')).toBe('123');
    expect(params.get('empty')).toBeNull();
    expect(params.get('undefined')).toBeNull();
    expect(params.get('emptyString')).toBeNull();
  });

  it('deve permitir setError manual', () => {
    const { result } = renderHook(() => useApiRequest());

    act(() => {
      result.current.setError('Erro manual');
    });

    expect(result.current.error).toBe('Erro manual');
  });
});
