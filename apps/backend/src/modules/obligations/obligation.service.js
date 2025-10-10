const { prisma } = require('../../prisma');
const { ObligationStatus } = require('@prisma/client');

function computeStatus(dueDate, current = new Date(), original) {
  if (original === 'PAID' || original === 'CANCELED') return original;
  return new Date(dueDate) < current ? ObligationStatus.LATE : ObligationStatus.PENDING;
}

async function createObligation(userId, data) {
  const status = computeStatus(data.dueDate);

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

  if (role === 'CLIENT_NORMAL') {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user?.companyId) return [];
    where.companyId = user.companyId;
  } 
  
  else if (role === 'ACCOUNTING_SUPER') {
    if (filters.companyId) where.companyId = filters.companyId;
  }

  if (filters.status) where.status = filters.status;
  if (filters.regime) where.regime = filters.regime;
  if (filters.from || filters.to) {
    where.dueDate = {
      gte: filters.from || undefined,
      lte: filters.to || undefined
    };
  }

  return prisma.obligation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { company: true } // importante pro dashboard
  });
}

async function getObligation(userId, role, id) {
  const obligation = await prisma.obligation.findUnique({
    where: { id },
    include: { company: true }
  });

  if (!obligation) return null;

  if (role === 'CLIENT_NORMAL') {
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

module.exports = {
  computeStatus,
  createObligation,
  listObligations,
  getObligation,
  updateObligation,
  deleteObligation
};
