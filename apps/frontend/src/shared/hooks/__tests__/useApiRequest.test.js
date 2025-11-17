import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApiRequest } from '../useApiRequest';

describe('useApiRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('executeRequest', () => {
    it('deve executar requisição com sucesso', async () => {
      const mockData = { id: '1', name: 'Test' };
      const apiCall = vi.fn().mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useApiRequest());

      const data = await result.current.executeRequest(apiCall, 'Erro teste');

      expect(data).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('deve tratar erro da requisição', async () => {
      const errorMessage = 'Erro customizado';
      const apiCall = vi.fn().mockRejectedValue({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useApiRequest());

      await expect(
        result.current.executeRequest(apiCall, 'Erro padrão')
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });

    it('deve usar mensagem padrão se erro não tiver message', async () => {
      const apiCall = vi.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useApiRequest());

      await expect(
        result.current.executeRequest(apiCall, 'Erro padrão')
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe('Erro padrão');
      });
    });

    it('deve definir loading durante execução', async () => {
      const apiCall = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100))
      );

      const { result } = renderHook(() => useApiRequest());

      result.current.executeRequest(apiCall, 'Erro');

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 200 });
    });
  });

  describe('buildQueryParams', () => {
    it('deve criar URLSearchParams a partir de objeto', () => {
      const { result } = renderHook(() => useApiRequest());

      const params = result.current.buildQueryParams({
        name: 'João',
        age: 30,
        city: 'São Paulo'
      });

      expect(params.toString()).toBe('name=Jo%C3%A3o&age=30&city=S%C3%A3o+Paulo');
    });

    it('deve ignorar valores vazios', () => {
      const { result } = renderHook(() => useApiRequest());

      const params = result.current.buildQueryParams({
        name: 'João',
        age: '',
        city: null,
        country: undefined
      });

      expect(params.toString()).toBe('name=Jo%C3%A3o');
    });

    it('deve retornar vazio se objeto vazio', () => {
      const { result } = renderHook(() => useApiRequest());

      const params = result.current.buildQueryParams({});

      expect(params.toString()).toBe('');
    });

    it('deve aceitar parâmetro sem filtros', () => {
      const { result } = renderHook(() => useApiRequest());

      const params = result.current.buildQueryParams();

      expect(params.toString()).toBe('');
    });
  });

  describe('setError', () => {
    it('deve permitir definir erro manualmente', async () => {
      const { result } = renderHook(() => useApiRequest());

      expect(result.current.error).toBe(null);

      result.current.setError('Erro manual');

      await waitFor(() => {
        expect(result.current.error).toBe('Erro manual');
      });
    });
  });
});

