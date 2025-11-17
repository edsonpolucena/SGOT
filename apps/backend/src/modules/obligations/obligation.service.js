const { prisma } = require('../../prisma');
const { computeStatus } = require('../../utils/obligation.utils');

async function createObligation(userId, data) {
  // Se o status já foi definido (ex: NOT_APPLICABLE), respeita ele
  const status = data.status ? computeStatus(data.dueDate, new Date(), data.status) : computeStatus(data.dueDate);

  return prisma.obligation.create({
    data: {
      ...data,
      status,
      userId
    }
  });
}

async function listObligations(userId, role, filters = {}, companyIdFromToken = null) {
  let where = {};

  // Usuários CLIENT (ADMIN ou NORMAL) só veem obrigações da própria empresa
  if (role === 'CLIENT_NORMAL' || role === 'CLIENT_ADMIN') {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user?.companyId) return [];
    where.companyId = user.companyId;
  } 
  
  // Contabilidade pode ver tudo ou filtrar por empresa
  else if (role.startsWith('ACCOUNTING_')) {
    if (filters.companyId) where.companyId = filters.companyId;
  }

  if (filters.status) where.status = filters.status;
  if (filters.regime) where.regime = filters.regime;
  if (filters.referenceMonth) where.referenceMonth = filters.referenceMonth;
  if (filters.from || filters.to) {
    where.dueDate = {
      gte: filters.from || undefined,
      lte: filters.to || undefined
    };
  }

  // 👈 IMPORTANTE: Excluir obrigações NOT_APPLICABLE das listagens normais
  // Elas são apenas para controle interno e não devem aparecer nas listas
  // EXCETO se estiver filtrando especificamente por referenceMonth (para a matriz)
  if (!filters.referenceMonth) {
    where.status = { not: 'NOT_APPLICABLE' };
  }

  return prisma.obligation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { company: true,
      user: {select: {name: true}}
     } // importante pro dashboard
  });
}

async function getObligation(userId, role, id) {
  const obligation = await prisma.obligation.findUnique({
    where: { id },
    include: { company: true }
  });

  if (!obligation) return null;

  // Usuários CLIENT só acessam obrigações da própria empresa
  if (role === 'CLIENT_NORMAL' || role === 'CLIENT_ADMIN') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.companyId !== obligation.companyId) {
      return null; // bloqueia acesso a obrigações de outra empresa
    }
  }

  return obligation;
}

async function updateObligation(userId, role, id, data) {
  const existing = await getObligation(userId, role, id);
  if (!existing) return null;

  const status = computeStatus(
    data.dueDate ?? existing.dueDate,
    undefined,
    data.status ?? existing.status
  );

  return prisma.obligation.update({
    where: { id },
    data: { ...data, status }
  });
}

async function deleteObligation(userId, role, id) {
  const existing = await getObligation(userId, role, id);
  if (!existing) return null;

  await prisma.obligation.delete({ where: { id } });
  return true;
}

/**
 * Marca uma obrigação como "Não Aplicável" (sem precisar anexar arquivo)
 */
async function markAsNotApplicable(userId, role, id, reason) {
  // Apenas contabilidade pode marcar como não aplicável
  if (!role.startsWith('ACCOUNTING_')) {
    throw new Error('Apenas usuários da contabilidade podem marcar como não aplicável');
  }

  const existing = await getObligation(userId, role, id);
  if (!existing) return null;

  return prisma.obligation.update({
    where: { id },
    data: {
      status: 'NOT_APPLICABLE',
      notApplicableReason: reason || 'Não aplicável neste período'
    }
  });
}

/**
 * Busca obrigações com controle mensal por empresa
 */
async function getMonthlyControl(companyId, month) {
  const companyIdInt = parseInt(companyId);

  // Busca perfil fiscal da empresa (impostos esperados)
  const taxProfiles = await prisma.companyTaxProfile.findMany({
    where: {
      companyId: companyIdInt,
      isActive: true
    }
  });

  const expectedTaxes = taxProfiles.map(p => p.taxType);

  // Busca obrigações do mês
  const obligations = await prisma.obligation.findMany({
    where: {
      companyId: companyIdInt,
      referenceMonth: month
    },
    include: {
      files: true
    }
  });

  // Organiza por tipo de imposto
  const obligationsByTax = {};
  obligations.forEach(obl => {
    if (obl.taxType) {
      obligationsByTax[obl.taxType] = obl;
    }
  });

  // Identifica impostos que faltam criar
  const missing = expectedTaxes.filter(tax => !obligationsByTax[tax]);

  // Calcula taxa de conclusão
  const treated = expectedTaxes.length - missing.length;
  const completionRate = expectedTaxes.length > 0 ? treated / expectedTaxes.length : 1;

  // Busca nome da empresa
  const company = await prisma.empresa.findUnique({
    where: { id: companyIdInt }
  });

  return {
    companyId,
    companyName: company?.nome,
    month,
    expectedTaxes,
    obligations: obligations.map(obl => ({
      taxType: obl.taxType,
      status: obl.status,
      dueDate: obl.dueDate,
      notApplicableReason: obl.notApplicableReason,
      hasFile: obl.files.length > 0
    })),
    missing,
    completionRate
  };
}

module.exports = {
  computeStatus,
  createObligation,
  listObligations,
  getObligation,
  updateObligation,
  deleteObligation,
  markAsNotApplicable,
  getMonthlyControl
};
