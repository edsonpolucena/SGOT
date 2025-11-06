import { useState, useCallback } from 'react';
import http from '../../../shared/services/http';

const PREFIX = import.meta.env.VITE_API_PREFIX || '/api';

export function useUserController() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Lista todos os usuários (com filtros opcionais)
   */
  const fetchUsers = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.companyId) params.append('companyId', filters.companyId);
      if (filters.status) params.append('status', filters.status);
      if (filters.role) params.append('role', filters.role);

      const response = await http.get(`${PREFIX}/users?${params.toString()}`);
      setUsers(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Erro ao carregar usuários';
      setError(errorMessage);
      console.error('Erro ao carregar usuários:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca um usuário por ID
   */
  const fetchUserById = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await http.get(`${PREFIX}/users/${userId}`);
      return response.data;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Erro ao buscar usuário';
      setError(errorMessage);
      console.error('Erro ao buscar usuário:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cria um novo usuário
   */
  const createUser = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await http.post(`${PREFIX}/auth/register`, userData);
      return response.data;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Erro ao criar usuário';
      setError(errorMessage);
      console.error('Erro ao criar usuário:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualiza um usuário
   */
  const updateUser = useCallback(async (userId, userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await http.put(`${PREFIX}/users/${userId}`, userData);
      return response.data;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Erro ao atualizar usuário';
      setError(errorMessage);
      console.error('Erro ao atualizar usuário:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Altera o status de um usuário (ACTIVE/INACTIVE)
   */
  const updateUserStatus = useCallback(async (userId, status) => {
    setLoading(true);
    setError(null);
    try {
      const response = await http.patch(`${PREFIX}/users/${userId}/status`, { status });
      return response.data;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Erro ao alterar status do usuário';
      setError(errorMessage);
      console.error('Erro ao alterar status:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Deleta (inativa) um usuário
   */
  const deleteUser = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await http.delete(`${PREFIX}/users/${userId}`);
      return response.data;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Erro ao deletar usuário';
      setError(errorMessage);
      console.error('Erro ao deletar usuário:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    fetchUserById,
    createUser,
    updateUser,
    updateUserStatus,
    deleteUser,
    setError
  };
}












