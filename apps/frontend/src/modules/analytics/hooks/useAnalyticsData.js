import { useEffect, useState } from "react";
import { getMonthlySummary } from "../services/analytics.api";
import { getMonthlyVariationByTax } from "../services/analytics.api";


export function useMonthlySummary(empresaId, mes) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Só busca dados se empresaId e mes existirem
    if (!empresaId || !mes) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const summary = await getMonthlySummary(empresaId, mes);
        setData(summary);
      } catch (err) {
        console.error('Erro ao buscar resumo mensal:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [empresaId, mes]);

  return { data, loading, error };
}

export function useMonthlyVariationByTax(empresaId, mes) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Só busca dados se empresaId e mes existirem
    if (!empresaId || !mes) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    getMonthlyVariationByTax(empresaId, mes)
      .then(setData)
      .catch((err) => {
        console.error('Erro ao buscar variação por imposto:', err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [empresaId, mes]);

  return { data, loading, error };
}
