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

  // -------------------------------------------------------
  // FETCH USERS
  // -------------------------------------------------------
  describe('fetchUsers', () => {
    it('deve buscar usuários com sucesso', async () => {
      const mockUsers = [
        { id: '1', name: 'User 1', email: 'user1@test.com' },
        { id: '2', name: 'User 2', email: 'user2@test.com' }
      ];

      http.get.mockResolvedValueOnce({ data: mockUsers });

      const { result } = renderHook(() => useUserController());

      const promise = result.current.fetchUsers();

      await waitFor(() => expect(result.current.loading).toBe(false));

      const data = await promise;

      expect(data).toEqual(mockUsers);
      expect(result.current.users).toEqual(mockUsers);
      expect(result.current.error).toBe(null);
      expect(http.get).toHaveBeenCalledWith('/api/users?');
    });

    it('deve aplicar filtros corretamente', async () => {
      http.get.mockResolvedValueOnce({ data: [] });

      const { result } = renderHook(() => useUserController());

      await result.current.fetchUsers({
        companyId: 'EMP001',
        status: 'ACTIVE',
        role: 'CLIENT_ADMIN'
      });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const url = http.get.mock.calls[0][0];

      expect(url).toContain('companyId=EMP001');
      expect(url).toContain('status=ACTIVE');
      expect(url).toContain('role=CLIENT_ADMIN');
    });

    it('deve tratar erro ao buscar usuários', async () => {
      http.get.mockRejectedValueOnce({
        response: { data: { message: 'Erro ao carregar usuários' } }
      });

      const { result } = renderHook(() => useUserController());

      await expect(result.current.fetchUsers()).rejects.toThrow();

      await waitFor(() =>
        expect(result.current.error).toBe('Erro ao carregar usuários')
      );
    });
  });

  // -------------------------------------------------------
  // FETCH USER BY ID
  // -------------------------------------------------------
  describe('fetchUserById', () => {
    it('deve buscar usuário por ID com sucesso', async () => {
      const mockUser = { id: '1', name: 'User 1' };
      http.get.mockResolvedValueOnce({ data: mockUser });

      const { result } = renderHook(() => useUserController());

      const user = await result.current.fetchUserById('1');

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(user).toEqual(mockUser);
      expect(http.get).toHaveBeenCalledWith('/api/users/1');
    });

    it('deve tratar erro ao buscar usuário', async () => {
      http.get.mockRejectedValueOnce({
        response: { data: { message: 'Erro ao buscar usuário' } }
      });

      const { result } = renderHook(() => useUserController());

      await expect(result.current.fetchUserById('999')).rejects.toThrow();

      await waitFor(() =>
        expect(result.current.error).toBe('Erro ao buscar usuário')
      );
    });
  });

  // -------------------------------------------------------
  // CREATE USER
  // -------------------------------------------------------
  describe('createUser', () => {
    it('deve criar usuário com sucesso', async () => {
      const newUser = { name: 'Novo', email: 'new@test.com' };
      const mockResponse = { id: '10', ...newUser };

      http.post.mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useUserController());

      const created = await result.current.createUser(newUser);

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(created).toEqual(mockResponse);
      expect(http.post).toHaveBeenCalledWith('/api/auth/register', newUser);
    });

    it('deve tratar erro ao criar usuário', async () => {
      http.post.mockRejectedValueOnce({
        response: { data: { message: 'Email existente' } }
      });

      const { result } = renderHook(() => useUserController());

      await expect(
        result.current.createUser({ name: 'x' })
      ).rejects.toThrow();

      await waitFor(() =>
        expect(result.current.error).toBe('Email existente')
      );
    });
  });

  // -------------------------------------------------------
  // UPDATE USER
  // -------------------------------------------------------
  describe('updateUser', () => {
    it('deve atualizar usuário com sucesso', async () => {
      const updated = { id: '1', name: 'Novo Nome' };
      http.put.mockResolvedValueOnce({ data: updated });

      const { result } = renderHook(() => useUserController());

      const resp = await result.current.updateUser('1', { name: 'Novo Nome' });

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(resp).toEqual(updated);
      expect(http.put).toHaveBeenCalledWith('/api/users/1', {
        name: 'Novo Nome'
      });
    });

    it('deve tratar erro ao atualizar usuário', async () => {
      http.put.mockRejectedValueOnce({
        response: { data: { message: 'Erro atualizar' } }
      });

      const { result } = renderHook(() => useUserController());

      await expect(
        result.current.updateUser('1', { name: 'AAA' })
      ).rejects.toThrow();

      await waitFor(() =>
        expect(result.current.error).toBe('Erro atualizar')
      );
    });
  });

  // -------------------------------------------------------
  // UPDATE USER STATUS
  // -------------------------------------------------------
  describe('updateUserStatus', () => {
    it('deve atualizar status', async () => {
      const updated = { id: '1', status: 'INACTIVE' };
      http.patch.mockResolvedValueOnce({ data: updated });

      const { result } = renderHook(() => useUserController());

      const resp = await result.current.updateUserStatus('1', 'INACTIVE');

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(resp).toEqual(updated);
      expect(http.patch).toHaveBeenCalledWith('/api/users/1/status', {
        status: 'INACTIVE'
      });
    });

    it('deve tratar erro ao alterar status', async () => {
      http.patch.mockRejectedValueOnce({
        response: { data: { message: 'Erro status' } }
      });

      const { result } = renderHook(() => useUserController());

      await expect(
        result.current.updateUserStatus('1', 'ACTIVE')
      ).rejects.toThrow();

      await waitFor(() =>
        expect(result.current.error).toBe('Erro status')
      );
    });
  });

  // -------------------------------------------------------
  // DELETE USER
  // -------------------------------------------------------
  describe('deleteUser', () => {
    it('deve deletar usuário com sucesso', async () => {
      const mockResp = { message: 'OK' };
      http.delete.mockResolvedValueOnce({ data: mockResp });

      const { result } = renderHook(() => useUserController());

      const resp = await result.current.deleteUser('1');

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(resp).toEqual(mockResp);
      expect(http.delete).toHaveBeenCalledWith('/api/users/1');
    });

    it('deve tratar erro ao deletar usuário', async () => {
      http.delete.mockRejectedValueOnce({
        response: { data: { message: 'Erro delete' } }
      });

      const { result } = renderHook(() => useUserController());

      await expect(result.current.deleteUser('1')).rejects.toThrow();

      await waitFor(() =>
        expect(result.current.error).toBe('Erro delete')
      );
    });
  });

  // -------------------------------------------------------
  // SET ERROR
  // -------------------------------------------------------
  describe('setError', () => {
    it('deve definir erro manualmente', async () => {
      const { result } = renderHook(() => useUserController());

      result.current.setError('Erro manual');

      await waitFor(() =>
        expect(result.current.error).toBe('Erro manual')
      );
    });
  });
});
