import { useState, useCallback } from 'react';
import http from '../../../shared/services/http';
import { useApiRequest } from '../../../shared/hooks/useApiRequest';

const PREFIX = import.meta.env.VITE_API_PREFIX || '/api';

export function useAuditController() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  
  const { loading, error, executeRequest, setError, buildQueryParams } = useApiRequest();

  /**
   * Lista logs de auditoria com filtros
   */
  const fetchLogs = useCallback(async (filters = {}) => {
    const params = buildQueryParams(filters);
    const data = await executeRequest(
      () => http.get(`${PREFIX}/audit/logs?${params.toString()}`),
      'Erro ao carregar logs'
    );

    setLogs(data.logs);
    setPagination({
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages
    });
    return data;
  }, [buildQueryParams, executeRequest]);

  /**
   * Busca um log específico por ID
   */
  const fetchLogById = useCallback(async (logId) => {
    return await executeRequest(
      () => http.get(`${PREFIX}/audit/logs/${logId}`),
      'Erro ao buscar log'
    );
  }, [executeRequest]);

  /**
   * Busca estatísticas de auditoria
   */
  const fetchStats = useCallback(async (filters = {}) => {
    const params = buildQueryParams(filters);
    const data = await executeRequest(
      () => http.get(`${PREFIX}/audit/stats?${params.toString()}`),
      'Erro ao carregar estatísticas'
    );

    setStats(data);
    return data;
  }, [buildQueryParams, executeRequest]);

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

