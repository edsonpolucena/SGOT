import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUserController } from '../useUserController';
import http from '../../../../shared/services/http';

vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

describe('useUserController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com users vazio, loading false e error null', () => {
    const { result } = renderHook(() => useUserController());

    expect(result.current.users).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  describe('fetchUsers', () => {
    it('deve buscar usuários com sucesso', async () => {
      const { result } = renderHook(() => useUserController());
      const mockData = [{ id: '1', email: 'user@test.com' }];
      http.get.mockResolvedValue({ data: mockData });

      let response;
      await act(async () => {
        response = await result.current.fetchUsers();
      });

      expect(http.get).toHaveBeenCalledWith('/api/users?');
      expect(result.current.users).toEqual(mockData);
      expect(response).toEqual(mockData);
    });

    it('deve aplicar filtros corretamente', async () => {
      const { result } = renderHook(() => useUserController());
      http.get.mockResolvedValue({ data: [] });

      await act(async () => {
        await result.current.fetchUsers({ companyId: 1, status: 'ACTIVE' });
      });

      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('companyId=1')
      );
      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('status=ACTIVE')
      );
    });

    it('deve tratar erro corretamente', async () => {
      const { result } = renderHook(() => useUserController());
      const error = { response: { data: { message: 'Erro ao carregar' } } };
      http.get.mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.fetchUsers();
        } catch (e) {
          // Esperado
        }
      });

      expect(result.current.error).toBe('Erro ao carregar');
    });
  });

  describe('fetchUserById', () => {
    it('deve buscar usuário por ID', async () => {
      const { result } = renderHook(() => useUserController());
      const mockData = { id: '1', email: 'user@test.com' };
      http.get.mockResolvedValue({ data: mockData });

      let response;
      await act(async () => {
        response = await result.current.fetchUserById('1');
      });

      expect(http.get).toHaveBeenCalledWith('/api/users/1');
      expect(response).toEqual(mockData);
    });
  });

  describe('createUser', () => {
    it('deve criar usuário com sucesso', async () => {
      const { result } = renderHook(() => useUserController());
      const mockData = { id: '1', email: 'new@test.com' };
      http.post.mockResolvedValue({ data: mockData });

      let response;
      await act(async () => {
        response = await result.current.createUser({ email: 'new@test.com' });
      });

      expect(http.post).toHaveBeenCalledWith('/api/auth/register', { email: 'new@test.com' });
      expect(response).toEqual(mockData);
    });
  });

  describe('updateUser', () => {
    it('deve atualizar usuário com sucesso', async () => {
      const { result } = renderHook(() => useUserController());
      const mockData = { id: '1', email: 'updated@test.com' };
      http.put.mockResolvedValue({ data: mockData });

      let response;
      await act(async () => {
        response = await result.current.updateUser('1', { email: 'updated@test.com' });
      });

      expect(http.put).toHaveBeenCalledWith('/api/users/1', { email: 'updated@test.com' });
      expect(response).toEqual(mockData);
    });
  });

  describe('deleteUser', () => {
    it('deve deletar usuário com sucesso', async () => {
      const { result } = renderHook(() => useUserController());
      http.delete.mockResolvedValue({ data: { success: true } });

      await act(async () => {
        await result.current.deleteUser('1');
      });

      expect(http.delete).toHaveBeenCalledWith('/api/users/1');
    });
  });
});
