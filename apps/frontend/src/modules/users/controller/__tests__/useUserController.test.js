import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserController } from '../useUserController';
import http from '../../../../shared/services/http';

// Mock do módulo http
vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}));

describe('useUserController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchUsers', () => {
    it('deve buscar usuários com sucesso', async () => {
      const mockUsers = [
        { id: '1', name: 'User 1', email: 'user1@test.com' },
        { id: '2', name: 'User 2', email: 'user2@test.com' }
      ];

      http.get.mockResolvedValueOnce({ data: mockUsers });

      const { result } = renderHook(() => useUserController());

      expect(result.current.loading).toBe(false);

      const promise = result.current.fetchUsers();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const data = await promise;
      expect(data).toEqual(mockUsers);
      expect(result.current.error).toBe(null);
      expect(http.get).toHaveBeenCalledWith('/api/users?');
    });

    it('deve buscar usuários com filtros', async () => {
      const mockUsers = [{ id: '1', name: 'User 1' }];
      http.get.mockResolvedValueOnce({ data: mockUsers });

      const { result } = renderHook(() => useUserController());

      await result.current.fetchUsers({
        companyId: 'EMP001',
        status: 'ACTIVE',
        role: 'CLIENT_ADMIN'
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('companyId=EMP001')
      );
      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('status=ACTIVE')
      );
      expect(http.get).toHaveBeenCalledWith(
        expect.stringContaining('role=CLIENT_ADMIN')
      );
    });

    it('deve tratar erro ao buscar usuários', async () => {
      const errorMessage = 'Erro ao carregar usuários';
      http.get.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useUserController());

      await expect(result.current.fetchUsers()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('fetchUserById', () => {
    it('deve buscar usuário por ID com sucesso', async () => {
      const mockUser = { id: '1', name: 'User 1', email: 'user1@test.com' };
      http.get.mockResolvedValueOnce({ data: mockUser });

      const { result } = renderHook(() => useUserController());

      const user = await result.current.fetchUserById('1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(user).toEqual(mockUser);
      expect(http.get).toHaveBeenCalledWith('/api/users/1');
    });

    it('deve tratar erro ao buscar usuário por ID', async () => {
      const errorMessage = 'Erro ao buscar usuário';
      http.get.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useUserController());

      await expect(result.current.fetchUserById('999')).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('createUser', () => {
    it('deve criar usuário com sucesso', async () => {
      const newUser = { name: 'New User', email: 'new@test.com', password: '123456' };
      const createdUser = { id: '3', ...newUser };

      http.post.mockResolvedValueOnce({ data: createdUser });

      const { result } = renderHook(() => useUserController());

      const user = await result.current.createUser(newUser);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(user).toEqual(createdUser);
      expect(http.post).toHaveBeenCalledWith('/api/auth/register', newUser);
    });

    it('deve tratar erro ao criar usuário', async () => {
      const errorMessage = 'Email já existe';
      http.post.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useUserController());

      await expect(
        result.current.createUser({ name: 'User', email: 'existing@test.com' })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('updateUser', () => {
    it('deve atualizar usuário com sucesso', async () => {
      const updatedData = { name: 'Updated Name' };
      const updatedUser = { id: '1', ...updatedData };

      http.put.mockResolvedValueOnce({ data: updatedUser });

      const { result } = renderHook(() => useUserController());

      const user = await result.current.updateUser('1', updatedData);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(user).toEqual(updatedUser);
      expect(http.put).toHaveBeenCalledWith('/api/users/1', updatedData);
    });

    it('deve tratar erro ao atualizar usuário', async () => {
      const errorMessage = 'Erro ao atualizar usuário';
      http.put.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useUserController());

      await expect(
        result.current.updateUser('1', { name: 'New Name' })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('updateUserStatus', () => {
    it('deve alterar status do usuário com sucesso', async () => {
      const updatedUser = { id: '1', status: 'INACTIVE' };

      http.patch.mockResolvedValueOnce({ data: updatedUser });

      const { result } = renderHook(() => useUserController());

      const user = await result.current.updateUserStatus('1', 'INACTIVE');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(user).toEqual(updatedUser);
      expect(http.patch).toHaveBeenCalledWith('/api/users/1/status', {
        status: 'INACTIVE'
      });
    });

    it('deve tratar erro ao alterar status', async () => {
      const errorMessage = 'Erro ao alterar status do usuário';
      http.patch.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useUserController());

      await expect(
        result.current.updateUserStatus('1', 'INACTIVE')
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('deleteUser', () => {
    it('deve deletar usuário com sucesso', async () => {
      const response = { message: 'Usuário inativado com sucesso' };

      http.delete.mockResolvedValueOnce({ data: response });

      const { result } = renderHook(() => useUserController());

      const data = await result.current.deleteUser('1');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(data).toEqual(response);
      expect(http.delete).toHaveBeenCalledWith('/api/users/1');
    });

    it('deve tratar erro ao deletar usuário', async () => {
      const errorMessage = 'Erro ao deletar usuário';
      http.delete.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      const { result } = renderHook(() => useUserController());

      await expect(result.current.deleteUser('1')).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('setError', () => {
    it('deve permitir definir erro manualmente', async () => {
      const { result } = renderHook(() => useUserController());

      expect(result.current.error).toBe(null);

      result.current.setError('Erro customizado');

      await waitFor(() => {
        expect(result.current.error).toBe('Erro customizado');
      });
    });
  });
});

