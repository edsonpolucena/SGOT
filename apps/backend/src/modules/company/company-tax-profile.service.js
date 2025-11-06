const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Lista os tipos de impostos configurados para uma empresa
 */
async function getCompanyTaxProfile(companyId) {
  return await prisma.companyTaxProfile.findMany({
    where: { companyId: parseInt(companyId) },
    orderBy: { taxType: 'asc' }
  });
}

/**
 * Adiciona um tipo de imposto ao perfil da empresa
 */
async function addTaxToCompany(companyId, taxType) {
  // Verifica se empresa existe
  const company = await prisma.empresa.findUnique({
    where: { id: parseInt(companyId) }
  });

  if (!company) {
    throw new Error('Empresa não encontrada');
  }

  // Verifica se já existe
  const existing = await prisma.companyTaxProfile.findUnique({
    where: {
      companyId_taxType: {
        companyId: parseInt(companyId),
        taxType
      }
    }
  });

  if (existing) {
    // Se já existe mas está inativo, reativa
    if (!existing.isActive) {
      return await prisma.companyTaxProfile.update({
        where: { id: existing.id },
        data: { isActive: true }
      });
    }
    throw new Error('Este tipo de imposto já está configurado para esta empresa');
  }

  return await prisma.companyTaxProfile.create({
    data: {
      companyId: parseInt(companyId),
      taxType,
      isActive: true
    }
  });
}

/**
 * Remove (desativa) um tipo de imposto do perfil da empresa
 */
async function removeTaxFromCompany(companyId, taxType) {
  const profile = await prisma.companyTaxProfile.findUnique({
    where: {
      companyId_taxType: {
        companyId: parseInt(companyId),
        taxType
      }
    }
  });

  if (!profile) {
    throw new Error('Configuração não encontrada');
  }

  // Soft delete - apenas desativa
  return await prisma.companyTaxProfile.update({
    where: { id: profile.id },
    data: { isActive: false }
  });
}

/**
 * Configura todos os impostos de uma empresa de uma vez
 */
async function setCompanyTaxProfile(companyId, taxTypes) {
  const companyIdInt = parseInt(companyId);

  // Desativa todos os existentes
  await prisma.companyTaxProfile.updateMany({
    where: { companyId: companyIdInt },
    data: { isActive: false }
  });

  // Cria/ativa os novos
  const results = [];
  for (const taxType of taxTypes) {
    const existing = await prisma.companyTaxProfile.findUnique({
      where: {
        companyId_taxType: {
          companyId: companyIdInt,
          taxType
        }
      }
    });

    if (existing) {
      // Reativa
      results.push(
        await prisma.companyTaxProfile.update({
          where: { id: existing.id },
          data: { isActive: true }
        })
      );
    } else {
      // Cria novo
      results.push(
        await prisma.companyTaxProfile.create({
          data: {
            companyId: companyIdInt,
            taxType,
            isActive: true
          }
        })
      );
    }
  }

  return results;
}

/**
 * Lista tipos de impostos disponíveis no sistema
 */
function getAvailableTaxTypes() {
  return [
    { code: 'ICMS', name: 'ICMS - Imposto sobre Circulação de Mercadorias e Serviços' },
    { code: 'ISS', name: 'ISS - Imposto Sobre Serviços' },
    { code: 'IRPJ', name: 'IRPJ - Imposto de Renda Pessoa Jurídica' },
    { code: 'CSLL', name: 'CSLL - Contribuição Social sobre o Lucro Líquido' },
    { code: 'PIS_COFINS', name: 'PIS/COFINS - Programas de Integração Social e Financiamento da Seguridade Social' },
    { code: 'IPI', name: 'IPI - Imposto sobre Produtos Industrializados' },
    { code: 'INSS', name: 'INSS - Contribuição Previdenciária' },
    { code: 'FGTS', name: 'FGTS - Fundo de Garantia do Tempo de Serviço' },
    { code: 'SIMPLES_NACIONAL', name: 'Simples Nacional - Regime Especial Unificado' }
  ];
}

module.exports = {
  getCompanyTaxProfile,
  addTaxToCompany,
  removeTaxFromCompany,
  setCompanyTaxProfile,
  getAvailableTaxTypes
};

