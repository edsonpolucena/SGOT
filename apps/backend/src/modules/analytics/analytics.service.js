const { prisma } = require("../../prisma");

async function getMonthlySummary(empresaId, mes) {
  const [ano, mesStr] = mes.split("-");
  const mesInt = parseInt(mesStr, 10);

  const start = new Date(ano, mesInt - 1, 1); 
  const end = new Date(ano, mesInt, 0);       

  const obrigacoes = await prisma.obligation.findMany({
    where: {
      companyId: empresaId,
      dueDate: { gte: start, lte: end },
    },
    select: {
      title: true,
      amount: true,
    },
  });

  let total = 0;
  const resumo = {};

  obrigacoes.forEach((o) => {
    if (!o.amount) return;

    const tipo = o.title.includes("-")
      ? o.title.split("-")[0].trim()
      : o.title.trim();

    total += Number(o.amount);
    resumo[tipo] = (resumo[tipo] || 0) + Number(o.amount);
  });

  const impostos = Object.entries(resumo).map(([tipo, valor]) => ({
    tipo,
    valor,
    percentual: total > 0 ? Number(((valor / total) * 100).toFixed(2)) : 0,
  }));

  return {
    empresaId,
    mes,
    total,
    impostos,
  };
}

async function getMonthlyVariationByTax(empresaId, mesAtual) {
  const [ano, mesStr] = mesAtual.split("-");
  const mes = parseInt(mesStr, 10);
  const mesAnterior = mes - 1 === 0 ? 12 : mes - 1;
  const anoAnterior = mes - 1 === 0 ? ano - 1 : ano;

  const startAtual = new Date(ano, mes - 1, 1);
  const endAtual = new Date(ano, mes, 0);

  const startAnterior = new Date(anoAnterior, mesAnterior - 1, 1);
  const endAnterior = new Date(anoAnterior, mesAnterior, 0);

  // Buscar obrigações do mês atual
  const atual = await prisma.obligation.findMany({
    where: {
      companyId: empresaId,
      dueDate: { gte: startAtual, lte: endAtual },
    },
    select: { title: true, amount: true },
  });

  // Buscar obrigações do mês anterior
  const anterior = await prisma.obligation.findMany({
    where: {
      companyId: empresaId,
      dueDate: { gte: startAnterior, lte: endAnterior },
    },
    select: { title: true, amount: true },
  });

  const somaPorImposto = (lista) =>
    lista.reduce((acc, o) => {
      if (!o.amount) return acc;

      const tipo = o.title.includes("-")
        ? o.title.split("-")[0].trim()
        : o.title.trim();

      acc[tipo] = (acc[tipo] || 0) + Number(o.amount);
      return acc;
    }, {});

  const atualResumo = somaPorImposto(atual);
  const anteriorResumo = somaPorImposto(anterior);

  const impostos = Object.keys({ ...atualResumo, ...anteriorResumo }).map((imposto) => {
    const valorAtual = atualResumo[imposto] || 0;
    const valorAnterior = anteriorResumo[imposto] || 0;
    let variacao = 0;

    if (valorAnterior > 0) {
      variacao = ((valorAtual - valorAnterior) / valorAnterior) * 100;
    } else if (valorAtual > 0) {
      variacao = 100; 
    }

    return {
      imposto,
      valorAnterior,
      valorAtual,
      variacao: Number(variacao.toFixed(2)),
    };
  });

  return { empresaId, mesAtual, impostos };
}

/**
 * Dashboard de controle de documentos - todas as empresas em um mês
 */
async function getDocumentControlDashboard(month, userRole, userCompanyId) {
  // Filtra empresas baseado no role
  let empresaWhere = { status: 'ativa' };
  if (userRole && userRole.startsWith('CLIENT_')) {
    empresaWhere.id = userCompanyId;
  }

  const empresas = await prisma.empresa.findMany({
    where: empresaWhere,
    include: {
      taxProfiles: {
        where: { isActive: true }
      },
      obligations: {
        where: { referenceMonth: month },
        include: { files: true }
      }
    }
  });

  const companiesData = empresas.map(empresa => {
    const expectedTaxes = empresa.taxProfiles.map(p => p.taxType);
    const obligations = empresa.obligations;

    // Conta por status
    const posted = obligations.filter(o => 
      o.status === 'SUBMITTED' || o.status === 'PAID' || o.files.length > 0
    ).length;
    const notApplicable = obligations.filter(o => o.status === 'NOT_APPLICABLE').length;
    const pending = obligations.filter(o => 
      o.status === 'PENDING' && o.files.length === 0
    ).length;

    // Impostos que faltam criar obrigação
    const obligationTaxTypes = obligations.map(o => o.taxType).filter(Boolean);
    const missing = expectedTaxes.filter(tax => !obligationTaxTypes.includes(tax));

    const treated = posted + notApplicable;
    const completionRate = expectedTaxes.length > 0 
      ? treated / expectedTaxes.length 
      : 1;

    return {
      companyId: empresa.id,
      companyName: empresa.nome,
      expectedTaxes: expectedTaxes.length,
      posted,
      notApplicable,
      pending,
      missing: missing.length,
      missingTaxes: missing,
      completionRate: Number(completionRate.toFixed(2)),
      status: completionRate === 1 ? 'COMPLETE' : 'INCOMPLETE'
    };
  });

  // Summary geral
  const summary = {
    totalCompanies: companiesData.length,
    completeCompanies: companiesData.filter(c => c.status === 'COMPLETE').length,
    incompleteCompanies: companiesData.filter(c => c.status === 'INCOMPLETE').length,
    totalObligations: companiesData.reduce((sum, c) => sum + c.posted + c.notApplicable + c.pending, 0),
    posted: companiesData.reduce((sum, c) => sum + c.posted, 0),
    notApplicable: companiesData.reduce((sum, c) => sum + c.notApplicable, 0),
    pending: companiesData.reduce((sum, c) => sum + c.pending, 0),
    overallCompletion: companiesData.length > 0
      ? Number((companiesData.reduce((sum, c) => sum + c.completionRate, 0) / companiesData.length).toFixed(2))
      : 1
  };

  return {
    month,
    companies: companiesData,
    summary
  };
}

module.exports = { 
  getMonthlySummary, 
  getMonthlyVariationByTax,
  getDocumentControlDashboard
};

