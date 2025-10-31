import { useState, useCallback } from 'react';
import http from '../../../shared/services/http';

const PREFIX = import.meta.env.VITE_API_PREFIX || '/api';

export function useNotificationController() {
  const [unviewedDocs, setUnviewedDocs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Lista documentos não visualizados
   */
  const fetchUnviewedDocs = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.companyId) params.append('companyId', filters.companyId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await http.get(`${PREFIX}/notifications/unviewed?${params.toString()}`);
      setUnviewedDocs(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Erro ao carregar documentos';
      setError(errorMessage);
      console.error('Erro ao carregar documentos não visualizados:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reenvia notificação de um documento
   */
  const resendNotification = useCallback(async (obligationId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await http.post(`${PREFIX}/notifications/send/${obligationId}`);
      return response.data;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Erro ao reenviar notificação';
      setError(errorMessage);
      console.error('Erro ao reenviar notificação:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca histórico de notificações
   */
  const fetchNotificationHistory = useCallback(async (obligationId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await http.get(`${PREFIX}/notifications/${obligationId}/history`);
      return response.data;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Erro ao buscar histórico';
      setError(errorMessage);
      console.error('Erro ao buscar histórico:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca estatísticas
   */
  const fetchStats = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await http.get(`${PREFIX}/notifications/stats?${params.toString()}`);
      setStats(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Erro ao buscar estatísticas';
      setError(errorMessage);
      console.error('Erro ao buscar estatísticas:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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






