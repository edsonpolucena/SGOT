import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCompanyController } from '../useCompanyController';
import http from '../../../../shared/services/http';

vi.mock('../../../../shared/services/http', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

describe('useCompanyController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com loading false e error null', () => {
    const { result } = renderHook(() => useCompanyController());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  describe('createCompany', () => {
    it('deve criar empresa com sucesso', async () => {
      const { result } = renderHook(() => useCompanyController());
      const mockData = { id: 1, nome: 'Test Company' };
      http.post.mockResolvedValue({ data: mockData });

      let response;
      await act(async () => {
        response = await result.current.createCompany({ nome: 'Test Company' });
      });

      expect(http.post).toHaveBeenCalledWith('/api/empresas', { nome: 'Test Company' });
      expect(response).toEqual(mockData);
      expect(result.current.loading).toBe(false);
    });

    it('deve tratar erro ao criar empresa', async () => {
      const { result } = renderHook(() => useCompanyController());
      const error = { response: { data: { message: 'Erro ao criar' } } };
      http.post.mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.createCompany({ nome: 'Test' });
        } catch (e) {
          // Esperado
        }
      });

      expect(result.current.error).toEqual({ message: 'Erro ao criar' });
    });
  });

  describe('getCompanies', () => {
    it('deve buscar empresas com sucesso', async () => {
      const { result } = renderHook(() => useCompanyController());
      const mockData = [{ id: 1, nome: 'Company 1' }];
      http.get.mockResolvedValue({ data: mockData });

      let response;
      await act(async () => {
        response = await result.current.getCompanies();
      });

      expect(http.get).toHaveBeenCalledWith('/api/empresas');
      expect(response).toEqual(mockData);
    });
  });

  describe('updateCompany', () => {
    it('deve atualizar empresa com sucesso', async () => {
      const { result } = renderHook(() => useCompanyController());
      const mockData = { id: 1, nome: 'Updated Company' };
      http.put.mockResolvedValue({ data: mockData });

      let response;
      await act(async () => {
        response = await result.current.updateCompany(1, { nome: 'Updated Company' });
      });

      expect(http.put).toHaveBeenCalledWith('/api/empresas/1', { nome: 'Updated Company' });
      expect(response).toEqual(mockData);
    });
  });

  describe('getCompanyById', () => {
    it('deve buscar empresa por ID com sucesso', async () => {
      const { result } = renderHook(() => useCompanyController());
      const mockData = { id: 1, nome: 'Company' };
      http.get.mockResolvedValue({ data: mockData });

      let response;
      await act(async () => {
        response = await result.current.getCompanyById(1);
      });

      expect(http.get).toHaveBeenCalledWith('/api/empresas/1');
      expect(response).toEqual(mockData);
    });
  });
});
