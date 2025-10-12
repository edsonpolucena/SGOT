import { useState, useCallback } from 'react';
import http from '../../../shared/services/http';

const PREFIX = import.meta.env.VITE_API_PREFIX || '/api';

export function useAuditController() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  /**
   * Lista logs de auditoria com filtros
   */
  const fetchLogs = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.action) params.append('action', filters.action);
      if (filters.entity) params.append('entity', filters.entity);
      if (filters.entityId) params.append('entityId', filters.entityId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await http.get(`${PREFIX}/audit/logs?${params.toString()}`);
      setLogs(response.data.logs);
      setPagination({
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        totalPages: response.data.totalPages
      });
      return response.data;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Erro ao carregar logs';
      setError(errorMessage);
      console.error('Erro ao carregar logs:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca um log específico por ID
   */
  const fetchLogById = useCallback(async (logId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await http.get(`${PREFIX}/audit/logs/${logId}`);
      return response.data;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Erro ao buscar log';
      setError(errorMessage);
      console.error('Erro ao buscar log:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca estatísticas de auditoria
   */
  const fetchStats = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await http.get(`${PREFIX}/audit/stats?${params.toString()}`);
      setStats(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Erro ao carregar estatísticas';
      setError(errorMessage);
      console.error('Erro ao carregar estatísticas:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    logs,
    stats,
    loading,
    error,
    pagination,
    fetchLogs,
    fetchLogById,
    fetchStats,
    setError
  };
}

