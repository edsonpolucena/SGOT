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



module.exports = {
  getMonthlySummary, monthlyVariationByTax,
};
