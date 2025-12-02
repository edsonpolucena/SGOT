import { useState, useCallback } from 'react';


export function useApiRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Executa uma requisição API com tratamento padrão
   * @param {Function} apiCall - Função que faz a chamada API
   * @param {string} errorMessage - Mensagem de erro padrão
   * @returns {Promise<any>} - Retorna os dados da API
   */
  const executeRequest = useCallback(async (apiCall, errorMessage = 'Erro na requisição') => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall();
      return response.data;
    } catch (err) {
      const msg = err?.response?.data?.message || errorMessage;
      setError(msg);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cria URLSearchParams a partir de um objeto de filtros
   * Remove valores vazios/nulos
   * @param {Object} filters - Objeto com filtros
   * @returns {URLSearchParams} - Query string pronta
   */
  const buildQueryParams = (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });
    return params;
  };

  return {
    loading,
    error,
    setError,
    executeRequest,
    buildQueryParams
  };
}
