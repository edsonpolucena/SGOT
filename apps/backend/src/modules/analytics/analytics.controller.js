const analyticsService = require("./analytics.service");

async function getMonthlySummary(req, res) {
  try {
    const { empresaId, mes } = req.query;

    if (!empresaId || !mes) {
      return res.status(400).json({ error: "empresaId e mes são obrigatórios" });
    }

    const summary = await analyticsService.getMonthlySummary(
      Number(empresaId),
      mes
    );

    res.json(summary);
  } catch (err) {
    console.error("Erro em getMonthlySummary:", err);
    res.status(500).json({ error: "Erro ao buscar resumo mensal" });
  }
}

async function monthlyVariationByTax(req, res) {
  try {
    const { empresaId, mes } = req.query;

    if (!empresaId || !mes) {
      return res.status(400).json({ error: "empresaId e mes são obrigatórios" });
    }

    // aqui chama do service
    const result = await analyticsService.getMonthlyVariationByTax(
      Number(empresaId),
      mes
    );

    res.json(result);
  } catch (error) {
    console.error("Erro ao calcular variação por imposto:", error);
    res.status(500).json({ error: "Erro interno" });
  }
}

/**
 * GET /api/analytics/document-control-dashboard?month=2025-01
 * Dashboard de controle de documentos mensais
 */
async function getDocumentControlDashboard(req, res) {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ error: "month é obrigatório (formato: YYYY-MM)" });
    }

    const dashboard = await analyticsService.getDocumentControlDashboard(
      month,
      req.user?.role,
      req.user?.companyId
    );

    res.json(dashboard);
  } catch (error) {
    console.error("Erro ao buscar dashboard de controle:", error);
    res.status(500).json({ error: "Erro interno" });
  }
}

module.exports = {
  getMonthlySummary, 
  monthlyVariationByTax,
  getDocumentControlDashboard
};
