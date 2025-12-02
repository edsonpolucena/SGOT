const { prisma } = require('../../prisma');
const { computeStatus, sanitizeString, sanitizeStringSoft } = require('../../utils/obligation.utils');

async function createObligation(userId, data) {
  const status = data.status ? computeStatus(data.dueDate, new Date(), data.status) : computeStatus(data.dueDate);

  const sanitizedData = {
    ...data,
    title: data.title ? sanitizeString(data.title, 200) : data.title,
    notes: data.notes ? sanitizeStringSoft(data.notes, 1000) : data.notes,
    taxType: data.taxType ? sanitizeString(data.taxType, 50) : data.taxType,
    notApplicableReason: data.notApplicableReason ? sanitizeStringSoft(data.notApplicableReason, 500) : data.notApplicableReason,
    status,
    userId
  };

  return prisma.obligation.create({
    data: sanitizedData
  });
}

async function listObligations(userId, role, filters = {}, companyIdFromToken = null) {
  let where = {};

  if (role === 'CLIENT_NORMAL' || role === 'CLIENT_ADMIN') {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user?.companyId) return [];
    where.companyId = user.companyId;
  } 
  
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

  if (!filters.referenceMonth) {
    where.status = { not: 'NOT_APPLICABLE' };
  }

  return prisma.obligation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { company: true,
      user: {select: {name: true}}
     }
  });
}

async function getObligation(userId, role, id) {
  const obligation = await prisma.obligation.findUnique({
    where: { id },
    include: { company: true }
  });

  if (!obligation) return null;

  if (role === 'CLIENT_NORMAL' || role === 'CLIENT_ADMIN') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.companyId !== obligation.companyId) {
      return null;
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

  const sanitizedData = { ...data };
  if (data.title !== undefined) sanitizedData.title = sanitizeString(data.title, 200);
  if (data.notes !== undefined) sanitizedData.notes = data.notes ? sanitizeStringSoft(data.notes, 1000) : data.notes;
  if (data.taxType !== undefined) sanitizedData.taxType = data.taxType ? sanitizeString(data.taxType, 50) : data.taxType;
  if (data.notApplicableReason !== undefined) sanitizedData.notApplicableReason = data.notApplicableReason ? sanitizeStringSoft(data.notApplicableReason, 500) : data.notApplicableReason;
  sanitizedData.status = status;

  return prisma.obligation.update({
    where: { id },
    data: sanitizedData
  });
}

async function deleteObligation(userId, role, id) {
  const existing = await getObligation(userId, role, id);
  if (!existing) return null;

  await prisma.obligation.delete({ where: { id } });
  return true;
}

async function markAsNotApplicable(userId, role, id, reason) {
  if (!role.startsWith('ACCOUNTING_')) {
    throw new Error('Apenas usuários da contabilidade podem marcar como não aplicável');
  }

  const existing = await getObligation(userId, role, id);
  if (!existing) return null;

  const sanitizedReason = reason ? sanitizeStringSoft(reason, 500) : 'Não aplicável neste período';

  return prisma.obligation.update({
    where: { id },
    data: {
      status: 'NOT_APPLICABLE',
      notApplicableReason: sanitizedReason
    }
  });
}

async function getMonthlyControl(companyId, month) {
  const companyIdInt = parseInt(companyId);

  const taxProfiles = await prisma.companyTaxProfile.findMany({
    where: {
      companyId: companyIdInt,
      isActive: true
    }
  });

  const expectedTaxes = taxProfiles.map(p => p.taxType);

  const obligations = await prisma.obligation.findMany({
    where: {
      companyId: companyIdInt,
      referenceMonth: month
    },
    include: {
      files: true
    }
  });

  const obligationsByTax = {};
  obligations.forEach(obl => {
    if (obl.taxType) {
      obligationsByTax[obl.taxType] = obl;
    }
  });

  const missing = expectedTaxes.filter(tax => !obligationsByTax[tax]);

  const treated = expectedTaxes.length - missing.length;
  const completionRate = expectedTaxes.length > 0 ? treated / expectedTaxes.length : 1;

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
