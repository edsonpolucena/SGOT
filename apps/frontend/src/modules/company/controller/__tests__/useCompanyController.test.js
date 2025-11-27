import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCompanyController } from '../useCompanyController';
import http from '../../../../shared/services/http';

vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('useCompanyController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =============================
  // CREATE COMPANY
  // =============================
  describe('createCompany', () => {
    it('deve criar empresa com sucesso', async () => {
      const newCompany = { name: 'Empresa Teste', cnpj: '12345678000190' };
      const createdCompany = { id: 'EMP002', ...newCompany };

      http.post.mockResolvedValueOnce({ data: createdCompany });

      const { result } = renderHook(() => useCompanyController());

      const company = await result.current.createCompany(newCompany);

      expect(company).toEqual(createdCompany);
      expect(http.post).toHaveBeenCalledWith('/api/empresas', newCompany);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('deve tratar erro ao criar empresa', async () => {
      const errorMessage = 'CNPJ já existe';

      http.post.mockRejectedValueOnce({
        response: { data: errorMessage },
      });

      const { result } = renderHook(() => useCompanyController());

      await expect(
        result.current.createCompany({ name: 'Empresa', cnpj: '12345678000190' })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  // =============================
  // GET COMPANIES
  // =============================
  describe('getCompanies', () => {
    it('deve buscar empresas com sucesso', async () => {
      const mockCompanies = [
        { id: 'EMP001', name: 'Empresa 1' },
        { id: 'EMP002', name: 'Empresa 2' },
      ];

      http.get.mockResolvedValueOnce({ data: mockCompanies });

      const { result } = renderHook(() => useCompanyController());

      const companies = await result.current.getCompanies();

      expect(companies).toEqual(mockCompanies);
      expect(http.get).toHaveBeenCalledWith('/api/empresas');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('deve tratar erro ao buscar empresas', async () => {
      const errorMessage = 'Erro ao carregar empresas';

      http.get.mockRejectedValueOnce({
        response: { data: errorMessage },
      });

      const { result } = renderHook(() => useCompanyController());

      await expect(result.current.getCompanies()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  // =============================
  // UPDATE COMPANY
  // =============================
  describe('updateCompany', () => {
    it('deve atualizar empresa com sucesso', async () => {
      const updatedData = { name: 'Empresa Atualizada' };
      const updatedCompany = { id: 'EMP001', ...updatedData };

      http.put.mockResolvedValueOnce({ data: updatedCompany });

      const { result } = renderHook(() => useCompanyController());

      const company = await result.current.updateCompany('EMP001', updatedData);

      expect(company).toEqual(updatedCompany);
      expect(http.put).toHaveBeenCalledWith('/api/empresas/EMP001', updatedData);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('deve tratar erro ao atualizar empresa', async () => {
      const errorMessage = 'Erro ao atualizar empresa';

      http.put.mockRejectedValueOnce({
        response: { data: errorMessage },
      });

      const { result } = renderHook(() => useCompanyController());

      await expect(
        result.current.updateCompany('EMP001', { name: 'Novo Nome' })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  // =============================
  // GET COMPANY BY ID
  // =============================
  describe('getCompanyById', () => {
    it('deve buscar empresa por ID com sucesso', async () => {
      const mockCompany = { id: 'EMP001', name: 'Empresa 1' };

      http.get.mockResolvedValueOnce({ data: mockCompany });

      const { result } = renderHook(() => useCompanyController());

      const company = await result.current.getCompanyById('EMP001');

      expect(company).toEqual(mockCompany);
      expect(http.get).toHaveBeenCalledWith('/api/empresas/EMP001');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('deve tratar erro ao buscar empresa por ID', async () => {
      const errorMessage = 'Empresa não encontrada';

      http.get.mockRejectedValueOnce({
        response: { data: errorMessage },
      });

      const { result } = renderHook(() => useCompanyController());

      await expect(result.current.getCompanyById('EMP999')).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });
});
