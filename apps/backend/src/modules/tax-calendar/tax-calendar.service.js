const { prisma } = require('../../prisma');

/**
 * Lista todos os vencimentos fiscais
 */
async function listTaxCalendar() {
  return await prisma.taxCalendar.findMany({
    where: { isActive: true },
    orderBy: { taxType: 'asc' }
  });
}

/**
 * Busca vencimento por tipo de imposto
 */
async function getTaxCalendarByType(taxType) {
  return await prisma.taxCalendar.findUnique({
    where: { taxType }
  });
}

/**
 * Cria ou atualiza vencimento fiscal
 */
async function upsertTaxCalendar(taxType, dueDay, description) {
  return await prisma.taxCalendar.upsert({
    where: { taxType },
    update: { dueDay, description },
    create: { taxType, dueDay, description }
  });
}

/**
 * Deleta vencimento fiscal
 */
async function deleteTaxCalendar(taxType) {
  return await prisma.taxCalendar.delete({
    where: { taxType }
  });
}

module.exports = {
  listTaxCalendar,
  getTaxCalendarByType,
  upsertTaxCalendar,
  deleteTaxCalendar
};


