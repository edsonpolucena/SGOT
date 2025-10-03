import http from "../../../shared/services/http";

// Chama o backend: GET /api/analytics/summary
export async function getMonthlySummary(empresaId, mes) {
  if (!empresaId) {
    console.warn("⚠️ getMonthlySummary chamado sem empresaId");
    return null;
  }

  const res = await http.get("/api/analytics/summary", {
    params: { empresaId, mes },
  });
  return res.data;
}

// Chama o backend: GET /api/analytics/variation-by-tax
export async function getMonthlyVariationByTax(empresaId, mes) {
  if (!empresaId) {
    console.warn("⚠️ getMonthlyVariationByTax chamado sem empresaId");
    return null;
  }

  const res = await http.get("/api/analytics/variation-by-tax", {
    params: { empresaId, mes },
  });
  return res.data;
}
