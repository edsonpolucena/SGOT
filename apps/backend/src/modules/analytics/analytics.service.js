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

  const atual = await prisma.obligation.findMany({
    where: {
      companyId: empresaId,
      dueDate: { gte: startAtual, lte: endAtual },
    },
    select: { title: true, amount: true },
  });

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

async function getDocumentControlDashboard(month, userRole, userCompanyId) {
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

    const posted = obligations.filter(o => 
      o.files.length > 0 || (o.amount && o.amount > 0)
    ).length;
    const notApplicable = obligations.filter(o => o.status === 'NOT_APPLICABLE').length;
    const pending = obligations.filter(o => 
      o.status === 'PENDING' && o.files.length === 0 && (!o.amount || o.amount === 0)
    ).length;

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

async function getTaxTypeStats(month) {
  const empresas = await prisma.empresa.findMany({
    where: { 
      status: 'ativa',
      codigo: { not: 'EMP001' }
    },
    include: {
      taxProfiles: {
        where: { isActive: true }
      }
    }
  });

  const totalCompanies = empresas.length;

  const obligations = await prisma.obligation.findMany({
    where: { referenceMonth: month },
    include: { files: true }
  });

  const allTaxTypes = new Set();
  empresas.forEach(empresa => {
    empresa.taxProfiles.forEach(profile => {
      allTaxTypes.add(profile.taxType);
    });
  });

  const taxStats = Array.from(allTaxTypes).map(taxType => {
    const companiesWithTax = empresas.filter(empresa => 
      empresa.taxProfiles.some(p => p.taxType === taxType)
    ).map(e => e.id);

    const expectedCount = companiesWithTax.length;

    // CORRIGIDO: Conta empresas que postaram OU marcaram como não aplicável
    // Uma obrigação é considerada "tratada" se:
    // - Tem arquivo OU
    // - Tem valor > 0 OU
    // - Está marcada como NOT_APPLICABLE
    const treatedObligations = obligations.filter(obl => 
      obl.taxType === taxType && 
      companiesWithTax.includes(obl.companyId) &&
      (
        obl.files.length > 0 ||                          // Postado (tem arquivo)
        (obl.amount && Number(obl.amount) > 0) ||        // Postado (tem valor)
        obl.status === 'NOT_APPLICABLE'                  // Marcado como não aplicável
      )
    );

    // Conta empresas distintas que trataram a obrigação
    const treatedCompanies = new Set(treatedObligations.map(o => o.companyId));
    const postedCount = treatedCompanies.size;

    const completionRate = expectedCount > 0 ? (postedCount / expectedCount) : 0;

    return {
      taxType,
      taxName: getTaxName(taxType),
      postedCount,
      expectedCount,
      completionRate: Number((completionRate * 100).toFixed(1))
    };
  });

  taxStats.sort((a, b) => a.taxName.localeCompare(b.taxName));

  return {
    month,
    totalCompanies,
    taxStats
  };
}

async function getClientTaxReport(companyId, months = 12) {
  const company = await prisma.empresa.findUnique({
    where: { id: parseInt(companyId) }
  });

  if (!company) {
    throw new Error('Empresa não encontrada');
  }

  const monthlyData = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const referenceMonth = `${year}-${month}`;

    const obligations = await prisma.obligation.findMany({
      where: {
        companyId: parseInt(companyId),
        referenceMonth,
        status: { not: 'NOT_APPLICABLE' }
      },
      select: {
        taxType: true,
        amount: true
      }
    });

    const byTaxType = {};
    let totalMonth = 0;

    obligations.forEach(obl => {
      if (obl.amount && Number(obl.amount) > 0) {
        const taxType = obl.taxType || 'OUTRO';
        byTaxType[taxType] = (byTaxType[taxType] || 0) + Number(obl.amount);
        totalMonth += Number(obl.amount);
      }
    });

    monthlyData.push({
      month: referenceMonth,
      monthLabel: `${month}/${year}`,
      total: Number(totalMonth.toFixed(2)),
      byTaxType
    });
  }

  const withVariation = monthlyData.map((current, index) => {
    if (index === 0) {
      return { ...current, variation: null };
    }

    const previous = monthlyData[index - 1];
    const variation = previous.total > 0 
      ? ((current.total - previous.total) / previous.total) * 100 
      : current.total > 0 ? 100 : 0;

    return {
      ...current,
      variation: Number(variation.toFixed(2))
    };
  });

  const totalByTaxType = {};
  monthlyData.forEach(month => {
    Object.entries(month.byTaxType).forEach(([taxType, value]) => {
      totalByTaxType[taxType] = (totalByTaxType[taxType] || 0) + value;
    });
  });

  const taxTypeTotals = Object.entries(totalByTaxType).map(([taxType, total]) => ({
    taxType,
    taxName: getTaxName(taxType),
    total: Number(total.toFixed(2))
  })).sort((a, b) => b.total - a.total);

  const grandTotal = Number(
    taxTypeTotals.reduce((sum, tax) => sum + tax.total, 0).toFixed(2)
  );

  return {
    companyId: parseInt(companyId),
    companyName: company.nome,
    period: {
      start: monthlyData[0]?.month,
      end: monthlyData[monthlyData.length - 1]?.month
    },
    monthlyData: withVariation,
    taxTypeTotals,
    grandTotal
  };
}

function getTaxName(taxType) {
  const taxNames = {
    'DAS': 'DAS',
    'ISS_RETIDO': 'ISS Retido',
    'FGTS': 'FGTS',
    'DCTFWeb': 'DCTFWeb',
    'OUTRO': 'Outro'
  };
  return taxNames[taxType] || taxType;
}

async function getDeadlineComplianceStats(month) {
  // CORRIGIDO: Busca TODOS os impostos postados de QUALQUER mês
  // Não filtra por referenceMonth, pois impostos atrasados podem ser de meses anteriores
  // Isso garante que o cálculo de "prazos cumpridos" seja preciso
  const obligations = await prisma.obligation.findMany({
    where: {
      status: { not: 'NOT_APPLICABLE' },
      company: {
        codigo: { not: 'EMP001' }
      }
    },
    include: {
      files: true,
      company: { select: { codigo: true, nome: true } }
    }
  });

  const postedObligations = obligations.filter(o => 
    o.files.length > 0 || (o.amount && Number(o.amount) > 0)
  );

  let onTime = 0;
  let late = 0;
  let details = [];

  postedObligations.forEach(obl => {
    const uploadDate = obl.files.length > 0 
      ? new Date(obl.files[0].createdAt)
      : new Date(obl.createdAt);
    
    const dueDate = new Date(obl.dueDate);

    const diffTime = dueDate.getTime() - uploadDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // CORRIGIDO: Um imposto está "no prazo" se foi postado 4+ dias ANTES do vencimento
    // Se diffDays for negativo, significa que foi postado DEPOIS do vencimento (atrasado)
    const isOnTime = diffDays >= 4;

    if (isOnTime) {
      onTime++;
    } else {
      late++;
    }

    details.push({
      company: obl.company.codigo,
      companyName: obl.company.nome,
      taxType: obl.taxType,
      uploadDate: uploadDate.toLocaleDateString('pt-BR'),
      dueDate: dueDate.toLocaleDateString('pt-BR'),
      diffDays,
      isOnTime,
      referenceMonth: obl.referenceMonth // Adiciona mês de referência para identificação
    });
  });

  const total = postedObligations.length;
  const complianceRate = total > 0 ? (onTime / total) * 100 : 100;

  return {
    month: month || 'all', // Indica que pode incluir todos os meses
    total,
    onTime,
    late,
    complianceRate: Number(complianceRate.toFixed(1)),
    details
  };
}

async function getOverdueAndUpcomingTaxes(month) {
  const now = new Date();
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

  // CORRIGIDO: Busca TODOS os impostos não postados de QUALQUER mês
  // Não filtra por referenceMonth, pois um imposto de maio pode estar atrasado em dezembro
  const obligations = await prisma.obligation.findMany({
    where: {
      status: { not: 'NOT_APPLICABLE' },
      company: {
        codigo: { not: 'EMP001' }
      }
    },
    include: {
      files: true,
      company: { select: { id: true, codigo: true, nome: true } }
    }
  });

  // Considera "NÃO POSTADO" se não tem arquivo E não tem valor
  const notPosted = obligations.filter(o => 
    o.files.length === 0 && (!o.amount || Number(o.amount) === 0)
  );

  // ATRASADO: vencimento passou (dueDate < hoje)
  const overdue = notPosted.filter(o => new Date(o.dueDate) < now);
  
  // VENCENDO: vence entre hoje e 2 dias
  const dueSoon = notPosted.filter(o => {
    const dueDate = new Date(o.dueDate);
    return dueDate >= now && dueDate <= twoDaysFromNow;
  });

  // Ordena atrasados por dias de atraso (mais antigos primeiro)
  overdue.sort((a, b) => {
    const daysA = Math.ceil((now - new Date(a.dueDate)) / (1000 * 60 * 60 * 24));
    const daysB = Math.ceil((now - new Date(b.dueDate)) / (1000 * 60 * 60 * 24));
    return daysB - daysA;
  });

  // Ordena vencendo por proximidade (mais próximos primeiro)
  dueSoon.sort((a, b) => {
    const daysA = Math.ceil((new Date(a.dueDate) - now) / (1000 * 60 * 60 * 24));
    const daysB = Math.ceil((new Date(b.dueDate) - now) / (1000 * 60 * 60 * 24));
    return daysA - daysB;
  });

  return {
    month: month || 'all', // Indica que pode incluir todos os meses
    overdue: {
      count: overdue.length,
      items: overdue.map(o => ({
        company: o.company.codigo,
        companyName: o.company.nome,
        taxType: o.taxType,
        dueDate: o.dueDate,
        referenceMonth: o.referenceMonth, // Adiciona mês de referência para identificação
        daysOverdue: Math.ceil((now - new Date(o.dueDate)) / (1000 * 60 * 60 * 24))
      }))
    },
    dueSoon: {
      count: dueSoon.length,
      items: dueSoon.map(o => ({
        company: o.company.codigo,
        companyName: o.company.nome,
        taxType: o.taxType,
        dueDate: o.dueDate,
        referenceMonth: o.referenceMonth, // Adiciona mês de referência para identificação
        daysUntilDue: Math.ceil((new Date(o.dueDate) - now) / (1000 * 60 * 60 * 24))
      }))
    }
  };
}

async function getUnviewedAlertsForAccounting() {
  const now = new Date();

  // CORRIGIDO: Busca TODOS os documentos não visualizados, incluindo os já vencidos
  // Removido filtro dueDate: { gte: now } para não perder documentos antigos
  const unviewedDocs = await prisma.obligation.findMany({
    where: {
      status: { not: 'NOT_APPLICABLE' },
      views: { none: {} },        // Sem visualizações
      files: { some: {} },         // Tem arquivos (postado)
      company: { codigo: { not: 'EMP001' } }
      // Removido: dueDate: { gte: now } - agora mostra todos, incluindo vencidos
    },
    include: {
      company: { select: { codigo: true, nome: true } },
      files: true
    },
    orderBy: { dueDate: 'asc' }
  });

  const alerts = {
    threeDays: [],
    twoDays: [],
    oneDay: [],
    overdue: [],  // Adiciona categoria para documentos vencidos
    total: unviewedDocs.length
  };

  unviewedDocs.forEach(doc => {
    const dueDate = new Date(doc.dueDate);
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    const item = {
      id: doc.id,
      taxType: doc.taxType,
      title: doc.title,
      company: `${doc.company.codigo} - ${doc.company.nome}`,
      dueDate: doc.dueDate,
      daysUntilDue,
      daysOverdue: daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0  // Dias de atraso se vencido
    };

    // Documentos vencidos
    if (daysUntilDue < 0) {
      alerts.overdue.push(item);
    }
    // Documentos vencendo em 1 dia
    else if (daysUntilDue <= 1) {
      alerts.oneDay.push(item);
    }
    // Documentos vencendo em 2 dias
    else if (daysUntilDue <= 2) {
      alerts.twoDays.push(item);
    }
    // Documentos vencendo em 3 dias
    else if (daysUntilDue <= 3) {
      alerts.threeDays.push(item);
    }
  });

  return alerts;
}

module.exports = { 
  getMonthlySummary, 
  getMonthlyVariationByTax,
  getDocumentControlDashboard,
  getTaxTypeStats,
  getClientTaxReport,
  getDeadlineComplianceStats,
  getOverdueAndUpcomingTaxes,
  getUnviewedAlertsForAccounting,
  getTaxName
};
