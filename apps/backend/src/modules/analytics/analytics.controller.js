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

async function getTaxTypeStats(req, res) {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ error: "month é obrigatório (formato: YYYY-MM)" });
    }

    const stats = await analyticsService.getTaxTypeStats(month);

    res.json(stats);
  } catch (error) {
    console.error("Erro ao buscar estatísticas por tipo de imposto:", error);
    res.status(500).json({ error: "Erro interno" });
  }
}

async function getClientTaxReport(req, res) {
  try {
    const { companyId, months } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: "companyId é obrigatório" });
    }

    if (req.user?.role?.startsWith('CLIENT_')) {
      if (parseInt(companyId) !== req.user.companyId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
    }

    const report = await analyticsService.getClientTaxReport(
      companyId,
      months ? parseInt(months) : 12
    );

    res.json(report);
  } catch (error) {
    console.error("Erro ao buscar relatório de impostos:", error);
    res.status(500).json({ error: "Erro interno" });
  }
}

async function getDeadlineCompliance(req, res) {
  try {
    const { month } = req.query;

    // CORRIGIDO: month é opcional agora - se não informado, busca de todos os meses
    // Isso permite calcular estatísticas de prazos considerando impostos de meses anteriores
    const stats = await analyticsService.getDeadlineComplianceStats(month || null);

    res.json(stats);
  } catch (error) {
    console.error("Erro ao buscar estatísticas de prazo:", error);
    res.status(500).json({ error: "Erro interno" });
  }
}

async function getOverdueAndUpcoming(req, res) {
  try {
    const { month } = req.query;

    // month é opcional agora - se não informado, busca de todos os meses
    // Isso permite encontrar impostos atrasados de meses anteriores
    const data = await analyticsService.getOverdueAndUpcomingTaxes(month || null);

    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar impostos atrasados:", error);
    res.status(500).json({ error: "Erro interno" });
  }
}

module.exports = {
  getMonthlySummary, 
  monthlyVariationByTax,
  getDocumentControlDashboard,
  getTaxTypeStats,
  getClientTaxReport,
  getDeadlineCompliance,
  getOverdueAndUpcoming,
  getUnviewedAlerts
};

async function getUnviewedAlerts(req, res) {
  try {
    const alerts = await analyticsService.getUnviewedAlertsForAccounting();
    return res.json(alerts);
  } catch (error) {
    console.error('Erro ao buscar alertas de não visualizados:', error);
    return res.status(500).json({ message: 'Erro ao buscar alertas' });
  }
}
