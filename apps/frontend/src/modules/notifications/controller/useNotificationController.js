import { useState, useCallback } from 'react';
import http from '../../../shared/services/http';
import { useApiRequest } from '../../../shared/hooks/useApiRequest';

const PREFIX = import.meta.env.VITE_API_PREFIX || '/api';

export function useNotificationController() {
  const [unviewedDocs, setUnviewedDocs] = useState([]);
  const [stats, setStats] = useState(null);
  const { loading, error, executeRequest, setError, buildQueryParams } = useApiRequest();

  /**
   * Lista documentos não visualizados
   */
  const fetchUnviewedDocs = useCallback(async (filters = {}) => {
    const params = buildQueryParams(filters);
    const data = await executeRequest(
      () => http.get(`${PREFIX}/notifications/unviewed?${params.toString()}`),
      'Erro ao carregar documentos não visualizados'
    );

    setUnviewedDocs(data);
    return data;
  }, [buildQueryParams, executeRequest]);

  /**
   * Reenvia notificação de um documento
   */
  const resendNotification = useCallback(async (obligationId) => {
    return await executeRequest(
      () => http.post(`${PREFIX}/notifications/send/${obligationId}`),
      'Erro ao reenviar notificação'
    );
  }, [executeRequest]);

  /**
   * Busca histórico de notificações
   */
  const fetchNotificationHistory = useCallback(async (obligationId) => {
    return await executeRequest(
      () => http.get(`${PREFIX}/notifications/${obligationId}/history`),
      'Erro ao buscar histórico'
    );
  }, [executeRequest]);

  /**
   * Busca estatísticas
   */
  const fetchStats = useCallback(async (filters = {}) => {
    const params = buildQueryParams(filters);
    const data = await executeRequest(
      () => http.get(`${PREFIX}/notifications/stats?${params.toString()}`),
      'Erro ao buscar estatísticas'
    );

    setStats(data);
    return data;
  }, [buildQueryParams, executeRequest]);

  return {
    unviewedDocs,
    stats,
    loading,
    error,
    fetchUnviewedDocs,
    resendNotification,
    fetchNotificationHistory,
    fetchStats,
    setError
  };
}










