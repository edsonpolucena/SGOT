import { useEffect, useState } from "react";
import { getMonthlySummary } from "../services/analytics.api";
import { getMonthlyVariationByTax } from "../services/analytics.api";


export function useMonthlySummary(empresaId, mes) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const summary = await getMonthlySummary(empresaId, mes);
        setData(summary);
      } catch (err) {
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

  // useEffect(() => {
  //   async function fetchData() {
  //     try {
  //       setLoading(true);
  //       const result = await getMonthlyVariationByTax(empresaId, mes);
  //       setData(result);
  //       setError(null);
  //     } catch (err) {
  //       setError(err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  //   if (empresaId && mes) fetchData();
  // }, [empresaId, mes]);

    useEffect(() => {
    if (!empresaId || !mes) return;

    setLoading(true);
    getMonthlyVariationByTax(empresaId, mes)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [empresaId, mes]);

  return { data, loading, error };
}
