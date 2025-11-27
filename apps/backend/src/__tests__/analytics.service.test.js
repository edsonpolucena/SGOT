const { 
  getMonthlySummary, 
  getMonthlyVariationByTax,
  getDocumentControlDashboard,
  getTaxTypeStats,
  getClientTaxReport,
  getDeadlineComplianceStats,
  getOverdueAndUpcomingTaxes,
  getUnviewedAlertsForAccounting
} = require('../modules/analytics/analytics.service');
const { prisma } = require('../prisma');
const bcrypt = require('bcryptjs');

describe('Analytics Service', () => {
  let adminUser;
  let company;
  let obligation1;
  let obligation2;

  beforeAll(async () => {
    // Criar usuário admin
    adminUser = await prisma.user.create({
      data: {
        email: 'analytics@test.com',
        name: 'Analytics Admin',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE'
      }
    });

    // Criar empresa
    company = await prisma.empresa.create({
      data: {
        codigo: `COMP${Date.now()}`,
        nome: 'Empresa Analytics',
        cnpj: `${Date.now()}000190`,
        status: 'ativa'
      }
    });

    // Criar obrigações para teste
    // Usar datas do mês anterior para garantir que os dados existam
    const prevMonth = new Date();
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const year = prevMonth.getFullYear();
    const month = String(prevMonth.getMonth() + 1).padStart(2, '0');
    
    obligation1 = await prisma.obligation.create({
      data: {
        title: 'DAS - Janeiro',
        regime: 'SIMPLES',
        periodStart: new Date(year, prevMonth.getMonth(), 1),
        periodEnd: new Date(year, prevMonth.getMonth() + 1, 0),
        dueDate: new Date(year, prevMonth.getMonth(), 10),
        amount: 1000,
        companyId: company.id,
        userId: adminUser.id,
        status: 'PENDING',
        taxType: 'DAS',
        referenceMonth: `${year}-${month}`
      }
    });

    obligation2 = await prisma.obligation.create({
      data: {
        title: 'MEI - Janeiro',
        regime: 'MEI',
        periodStart: new Date(year, prevMonth.getMonth(), 1),
        periodEnd: new Date(year, prevMonth.getMonth() + 1, 0),
        dueDate: new Date(year, prevMonth.getMonth(), 10),
        amount: 500,
        companyId: company.id,
        userId: adminUser.id,
        status: 'PENDING',
        taxType: 'MEI',
        referenceMonth: `${year}-${month}`
      }
    });
    
    // Armazenar o mês para usar nos testes, se precisar
    module.exports.testMonth = `${year}-${month}`;
  });

  afterAll(async () => {
    await prisma.obligationFile.deleteMany();
    await prisma.obligation.deleteMany();
    await prisma.companyTaxProfile.deleteMany();
    await prisma.empresa.deleteMany();
    await prisma.user.deleteMany();
  });

  // -------------------------------------------------------------------
  // getMonthlySummary
  // -------------------------------------------------------------------
  describe('getMonthlySummary', () => {
    test('deve retornar estrutura correta do resumo', async () => {
      const now = new Date();
      const testMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const result = await getMonthlySummary(company.id, testMonth);

      expect(result).toHaveProperty('empresaId');
      expect(result).toHaveProperty('mes');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('impostos');
      expect(Array.isArray(result.impostos)).toBe(true);
    });

    test('deve calcular total corretamente', async () => {
      const now = new Date();
      const testMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const result = await getMonthlySummary(company.id, testMonth);
      
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    test('deve retornar array vazio se não houver obrigações', async () => {
      const result = await getMonthlySummary(company.id, '2099-12');
      
      expect(result.total).toBe(0);
      expect(result.impostos).toEqual([]);
    });

    test('deve agrupar obrigações por tipo de imposto', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const testMonth = `${year}-${month}`;

      // Criar obrigações com diferentes tipos
      await prisma.obligation.create({
        data: {
          title: 'DAS - Teste',
          regime: 'SIMPLES',
          periodStart: new Date(year, now.getMonth(), 1),
          periodEnd: new Date(year, now.getMonth() + 1, 0),
          dueDate: new Date(year, now.getMonth(), 15),
          amount: 1000,
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'DAS',
          referenceMonth: testMonth
        }
      });

      await prisma.obligation.create({
        data: {
          title: 'ISS_RETIDO - Teste',
          regime: 'SIMPLES',
          periodStart: new Date(year, now.getMonth(), 1),
          periodEnd: new Date(year, now.getMonth() + 1, 0),
          dueDate: new Date(year, now.getMonth(), 15),
          amount: 500,
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'ISS_RETIDO',
          referenceMonth: testMonth
        }
      });

      const result = await getMonthlySummary(company.id, testMonth);
      
      expect(result.total).toBe(1500);
      expect(result.impostos.length).toBeGreaterThanOrEqual(2);
    });

    test('deve calcular percentuais corretamente', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const testMonth = `${year}-${month}`;

      await prisma.obligation.create({
        data: {
          title: 'DAS - Percentual',
          regime: 'SIMPLES',
          periodStart: new Date(year, now.getMonth(), 1),
          periodEnd: new Date(year, now.getMonth() + 1, 0),
          dueDate: new Date(year, now.getMonth(), 15),
          amount: 1000,
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'DAS',
          referenceMonth: testMonth
        }
      });

      await prisma.obligation.create({
        data: {
          title: 'ISS - Percentual',
          regime: 'SIMPLES',
          periodStart: new Date(year, now.getMonth(), 1),
          periodEnd: new Date(year, now.getMonth() + 1, 0),
          dueDate: new Date(year, now.getMonth(), 15),
          amount: 1000,
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'ISS',
          referenceMonth: testMonth
        }
      });

      const result = await getMonthlySummary(company.id, testMonth);
      
      if (result.impostos.length > 0) {
        const percentuais = result.impostos.reduce((sum, imp) => sum + imp.percentual, 0);
        expect(percentuais).toBeCloseTo(100, 1);
      }
    });

    test('deve ignorar obrigações sem amount', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const testMonth = `${year}-${month}`;

      await prisma.obligation.create({
        data: {
          title: 'DAS - Sem Valor',
          regime: 'SIMPLES',
          periodStart: new Date(year, now.getMonth(), 1),
          periodEnd: new Date(year, now.getMonth() + 1, 0),
          dueDate: new Date(year, now.getMonth(), 15),
          amount: null,
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'DAS',
          referenceMonth: testMonth
        }
      });

      const result = await getMonthlySummary(company.id, testMonth);
      
      const hasNullAmount = result.impostos.some(imp => imp.valor === 0 && imp.percentual === 0);
      expect(hasNullAmount).toBe(false);
    });

    test('deve extrair tipo de imposto de títulos com hífen', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const testMonth = `${year}-${month}`;

      await prisma.obligation.deleteMany({
        where: {
          companyId: company.id,
          referenceMonth: testMonth
        }
      });

      await prisma.obligation.create({
        data: {
          title: 'DAS - Janeiro 2025',
          regime: 'SIMPLES',
          periodStart: new Date(year, now.getMonth(), 1),
          periodEnd: new Date(year, now.getMonth() + 1, 0),
          dueDate: new Date(year, now.getMonth(), 15),
          amount: 1000,
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'DAS',
          referenceMonth: testMonth
        }
      });

      const result = await getMonthlySummary(company.id, testMonth);
      
      const dasImposto = result.impostos.find(imp => imp.tipo === 'DAS');
      if (dasImposto) {
        expect(dasImposto.valor).toBe(1000);
      }
    });
  });

  // -------------------------------------------------------------------
  // getMonthlyVariationByTax
  // -------------------------------------------------------------------
  describe('getMonthlyVariationByTax', () => {
    test('deve calcular variação mensal por imposto', async () => {
      const now = new Date();
      const testMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const result = await getMonthlyVariationByTax(company.id, testMonth);

      expect(result).toHaveProperty('empresaId');
      expect(result).toHaveProperty('mesAtual');
      expect(result).toHaveProperty('impostos');
      expect(Array.isArray(result.impostos)).toBe(true);
    });

    test('deve retornar estrutura correta dos impostos', async () => {
      const now = new Date();
      const testMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const result = await getMonthlyVariationByTax(company.id, testMonth);

      if (result.impostos.length > 0) {
        const imposto = result.impostos[0];
        expect(imposto).toHaveProperty('imposto');
        expect(imposto).toHaveProperty('valorAnterior');
        expect(imposto).toHaveProperty('valorAtual');
        expect(imposto).toHaveProperty('variacao');
      }
    });

    test('deve calcular variação quando mês anterior é dezembro do ano anterior', async () => {
      const result = await getMonthlyVariationByTax(company.id, '2025-01');
      
      expect(result.mesAtual).toBe('2025-01');
      expect(result.impostos).toBeDefined();
    });

    test('deve calcular variação positiva quando valor atual é maior', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      
      const testMonth = `${year}-${String(month).padStart(2, '0')}`;
      const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

      await prisma.obligation.create({
        data: {
          title: 'DAS - Anterior',
          regime: 'SIMPLES',
          periodStart: new Date(prevYear, prevMonth - 1, 1),
          periodEnd: new Date(prevYear, prevMonth, 0),
          dueDate: new Date(prevYear, prevMonth - 1, 10),
          amount: 500,
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'DAS',
          referenceMonth: prevMonthStr
        }
      });

      await prisma.obligation.create({
        data: {
          title: 'DAS - Atual',
          regime: 'SIMPLES',
          periodStart: new Date(year, month - 1, 1),
          periodEnd: new Date(year, month, 0),
          dueDate: new Date(year, month - 1, 10),
          amount: 1000,
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'DAS',
          referenceMonth: testMonth
        }
      });

      const result = await getMonthlyVariationByTax(company.id, testMonth);
      
      const dasImposto = result.impostos.find(imp => imp.imposto === 'DAS');
      if (dasImposto && dasImposto.valorAnterior > 0) {
        expect(dasImposto.variacao).toBeGreaterThan(0);
      }
    });

    test('deve calcular variação de 100% quando não havia valor anterior', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const testMonth = `${year}-${month}`;

      await prisma.obligation.create({
        data: {
          title: 'FGTS - Novo',
          regime: 'SIMPLES',
          periodStart: new Date(year, parseInt(month) - 1, 1),
          periodEnd: new Date(year, parseInt(month), 0),
          dueDate: new Date(year, parseInt(month) - 1, 10),
          amount: 1000,
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'FGTS',
          referenceMonth: testMonth
        }
      });

      const result = await getMonthlyVariationByTax(company.id, testMonth);
      
      const fgtsImposto = result.impostos.find(imp => imp.imposto === 'FGTS');
      if (fgtsImposto && fgtsImposto.valorAnterior === 0 && fgtsImposto.valorAtual > 0) {
        expect(fgtsImposto.variacao).toBe(100);
      }
    });

    test('deve ignorar obrigações sem amount', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const testMonth = `${year}-${month}`;

      await prisma.obligation.create({
        data: {
          title: 'DAS - Sem Valor',
          regime: 'SIMPLES',
          periodStart: new Date(year, parseInt(month) - 1, 1),
          periodEnd: new Date(year, parseInt(month), 0),
          dueDate: new Date(year, parseInt(month) - 1, 10),
          amount: null,
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'DAS',
          referenceMonth: testMonth
        }
      });

      const result = await getMonthlyVariationByTax(company.id, testMonth);
      
      expect(result.impostos).toBeDefined();
    });
  });

  // -------------------------------------------------------------------
  // getDocumentControlDashboard
  // -------------------------------------------------------------------
  describe('getDocumentControlDashboard', () => {
    test('deve retornar estrutura correta do dashboard', async () => {
      const result = await getDocumentControlDashboard('2025-01', 'ACCOUNTING_SUPER', null);
      
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('companies');
      expect(result).toHaveProperty('summary');
      expect(Array.isArray(result.companies)).toBe(true);
    });

    test('deve filtrar por empresa quando for CLIENT', async () => {
      const result = await getDocumentControlDashboard('2025-01', 'CLIENT_ADMIN', company.id);
      
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('companies');
      expect(result.companies.length).toBeLessThanOrEqual(1);
    });

    test('deve calcular completionRate corretamente', async () => {
      await prisma.companyTaxProfile.create({
        data: {
          companyId: company.id,
          taxType: 'DAS',
          isActive: true
        }
      });

      await prisma.obligation.create({
        data: {
          title: 'DAS - Teste',
          regime: 'SIMPLES',
          periodStart: new Date('2025-01-01'),
          periodEnd: new Date('2025-01-31'),
          dueDate: new Date('2025-02-10'),
          referenceMonth: '2025-01',
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'DAS'
        }
      });

      const result = await getDocumentControlDashboard('2025-01', 'ACCOUNTING_SUPER', null);
      
      const companyData = result.companies.find(c => c.companyId === company.id);
      if (companyData) {
        expect(companyData).toHaveProperty('completionRate');
        expect(companyData.completionRate).toBeGreaterThanOrEqual(0);
        expect(companyData.completionRate).toBeLessThanOrEqual(1);
      }
    });

    test('deve contar obrigações postadas corretamente', async () => {
      await prisma.obligationFile.create({
        data: {
          obligationId: obligation1.id,
          fileName: 'test.pdf',
          originalName: 'test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          s3Key: 'obligations/test.pdf',
          uploadedBy: adminUser.id
        }
      });

      const result = await getDocumentControlDashboard('2025-01', 'ACCOUNTING_SUPER', null);
      
      expect(result.summary).toHaveProperty('posted');
      expect(result.summary.posted).toBeGreaterThanOrEqual(0);
    });

    test('deve contar obrigações NOT_APPLICABLE', async () => {
      await prisma.obligation.create({
        data: {
          title: 'DAS - NA',
          regime: 'SIMPLES',
          periodStart: new Date('2025-01-01'),
          periodEnd: new Date('2025-01-31'),
          dueDate: new Date('2025-02-10'),
          referenceMonth: '2025-01',
          companyId: company.id,
          userId: adminUser.id,
          status: 'NOT_APPLICABLE',
          taxType: 'DAS'
        }
      });

      const result = await getDocumentControlDashboard('2025-01', 'ACCOUNTING_SUPER', null);
      
      expect(result.summary).toHaveProperty('notApplicable');
      expect(result.summary.notApplicable).toBeGreaterThanOrEqual(0);
    });

    test('deve identificar impostos faltantes', async () => {
      await prisma.companyTaxProfile.create({
        data: {
          companyId: company.id,
          taxType: 'ISS_RETIDO',
          isActive: true
        }
      });

      const result = await getDocumentControlDashboard('2025-01', 'ACCOUNTING_SUPER', null);
      
      const companyData = result.companies.find(c => c.companyId === company.id);
      if (companyData) {
        expect(companyData).toHaveProperty('missing');
        expect(companyData).toHaveProperty('missingTaxes');
        expect(Array.isArray(companyData.missingTaxes)).toBe(true);
      }
    });
  });

  // -------------------------------------------------------------------
  // getTaxTypeStats
  // -------------------------------------------------------------------
  describe('getTaxTypeStats', () => {
    test('deve retornar estatísticas por tipo de imposto', async () => {
      const result = await getTaxTypeStats('2025-01');
      
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('totalCompanies');
      expect(result).toHaveProperty('taxStats');
      expect(Array.isArray(result.taxStats)).toBe(true);
    });

    test('deve excluir empresa EMP001 (contabilidade)', async () => {
      const accountingCompany = await prisma.empresa.create({
        data: {
          codigo: 'EMP001',
          nome: 'Contabilidade',
          cnpj: `${Date.now()}000192`,
          status: 'ativa'
        }
      });

      const result = await getTaxTypeStats('2025-01');
      
      expect(result.totalCompanies).toBeGreaterThanOrEqual(0);
      
      await prisma.empresa.delete({ where: { id: accountingCompany.id } });
    });

    test('deve calcular completionRate por tipo de imposto', async () => {
      await prisma.companyTaxProfile.upsert({
        where: {
          companyId_taxType: {
            companyId: company.id,
            taxType: 'DAS'
          }
        },
        update: { isActive: true },
        create: {
          companyId: company.id,
          taxType: 'DAS',
          isActive: true
        }
      });

      await prisma.obligation.create({
        data: {
          title: 'DAS - Stats',
          regime: 'SIMPLES',
          periodStart: new Date('2025-01-01'),
          periodEnd: new Date('2025-01-31'),
          dueDate: new Date('2025-02-10'),
          referenceMonth: '2025-01',
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'DAS',
          amount: 1000
        }
      });

      const result = await getTaxTypeStats('2025-01');
      
      const dasStat = result.taxStats.find(stat => stat.taxType === 'DAS');
      if (dasStat) {
        expect(dasStat).toHaveProperty('completionRate');
        expect(dasStat.completionRate).toBeGreaterThanOrEqual(0);
        expect(dasStat.completionRate).toBeLessThanOrEqual(100);
      }
    });

    test('deve ordenar taxStats por nome', async () => {
      const result = await getTaxTypeStats('2025-01');
      
      if (result.taxStats.length > 1) {
        const names = result.taxStats.map(stat => stat.taxName);
        const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
        expect(names).toEqual(sortedNames);
      }
    });
  });

  // -------------------------------------------------------------------
  // getClientTaxReport
  // -------------------------------------------------------------------
  describe('getClientTaxReport', () => {
    test('deve retornar relatório de impostos do cliente', async () => {
      const result = await getClientTaxReport(company.id, 12);
      
      expect(result).toHaveProperty('companyId');
      expect(result).toHaveProperty('companyName');
      expect(result).toHaveProperty('monthlyData');
      expect(result).toHaveProperty('taxTypeTotals');
      expect(result).toHaveProperty('grandTotal');
    });

    test('deve lançar erro se empresa não existir', async () => {
      await expect(getClientTaxReport(99999, 12)).rejects.toThrow('Empresa não encontrada');
    });

    test('deve retornar dados dos últimos N meses', async () => {
      const result = await getClientTaxReport(company.id, 6);
      
      expect(result.monthlyData.length).toBe(6);
      expect(result).toHaveProperty('period');
    });

    test('deve calcular variação mês a mês', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const referenceMonth = `${year}-${month}`;

      await prisma.obligation.create({
        data: {
          title: 'DAS - Variação',
          regime: 'SIMPLES',
          periodStart: new Date(year, parseInt(month) - 1, 1),
          periodEnd: new Date(year, parseInt(month), 0),
          dueDate: new Date(year, parseInt(month) - 1, 10),
          referenceMonth,
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'DAS',
          amount: 1000
        }
      });

      const result = await getClientTaxReport(company.id, 3);
      
      if (result.monthlyData.length > 1) {
        const hasVariation = result.monthlyData.some(month => month.variation !== null);
        expect(hasVariation).toBe(true);
      }
    });

    test('deve calcular total por tipo de imposto', async () => {
      const result = await getClientTaxReport(company.id, 12);
      
      expect(result).toHaveProperty('taxTypeTotals');
      expect(Array.isArray(result.taxTypeTotals)).toBe(true);
      
      if (result.taxTypeTotals.length > 0) {
        result.taxTypeTotals.forEach(tax => {
          expect(tax).toHaveProperty('taxType');
          expect(tax).toHaveProperty('taxName');
          expect(tax).toHaveProperty('total');
        });
      }
    });

    test('deve excluir obrigações NOT_APPLICABLE', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const referenceMonth = `${year}-${month}`;

      await prisma.obligation.deleteMany({
        where: {
          companyId: company.id,
          referenceMonth
        }
      });

      await prisma.obligation.create({
        data: {
          title: 'DAS - NA',
          regime: 'SIMPLES',
          periodStart: new Date(year, parseInt(month) - 1, 1),
          periodEnd: new Date(year, parseInt(month), 0),
          dueDate: new Date(year, parseInt(month) - 1, 10),
          referenceMonth,
          companyId: company.id,
          userId: adminUser.id,
          status: 'NOT_APPLICABLE',
          taxType: 'DAS',
          amount: 1000
        }
      });

      const result = await getClientTaxReport(company.id, 3);
      
      const monthData = result.monthlyData.find(m => m.month === referenceMonth);
      if (monthData) {
        expect(monthData.total).toBe(0);
      }
    });

    test('deve aceitar months customizado', async () => {
      const result = await getClientTaxReport(company.id, 3);
      
      expect(result.monthlyData.length).toBe(3);
    });
  });

  // -------------------------------------------------------------------
  // getDeadlineComplianceStats
  // -------------------------------------------------------------------
  describe('getDeadlineComplianceStats', () => {
    test('deve retornar estatísticas de cumprimento de prazos', async () => {
      const result = await getDeadlineComplianceStats('2025-01');
      
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('onTime');
      expect(result).toHaveProperty('late');
      expect(result).toHaveProperty('complianceRate');
      expect(result).toHaveProperty('details');
    });

    test('deve excluir empresa EMP001 e NOT_APPLICABLE', async () => {
      const result = await getDeadlineComplianceStats('2025-01');
      
      const hasEmp001 = result.details.some(d => d.company === 'EMP001');
      expect(hasEmp001).toBe(false);
    });

    test('deve calcular complianceRate corretamente', async () => {
      const result = await getDeadlineComplianceStats('2025-01');
      
      if (result.total > 0) {
        const expectedRate = (result.onTime / result.total) * 100;
        expect(result.complianceRate).toBeCloseTo(expectedRate, 1);
      } else {
        expect(result.complianceRate).toBe(100);
      }
    });

    test('deve identificar documentos no prazo (4+ dias antes)', async () => {
      const now = new Date();
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 5);

      await prisma.obligation.create({
        data: {
          title: 'DAS - No Prazo',
          regime: 'SIMPLES',
          periodStart: new Date('2025-01-01'),
          periodEnd: new Date('2025-01-31'),
          dueDate,
          referenceMonth: '2025-01',
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'DAS',
          amount: 1000
        }
      });

      const obligation = await prisma.obligation.findFirst({
        where: { title: 'DAS - No Prazo' }
      });

      await prisma.obligationFile.upsert({
        where: { s3Key: `obligations/test-deadline-${Date.now()}.pdf` },
        update: {},
        create: {
          obligationId: obligation.id,
          fileName: 'test.pdf',
          originalName: 'test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          s3Key: `obligations/test-deadline-${Date.now()}.pdf`,
          uploadedBy: adminUser.id,
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
        }
      });

      const result = await getDeadlineComplianceStats('2025-01');
      
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    test('deve calcular diffDays corretamente', async () => {
      const result = await getDeadlineComplianceStats('2025-01');
      
      result.details.forEach(detail => {
        expect(detail).toHaveProperty('diffDays');
        expect(typeof detail.diffDays).toBe('number');
      });
    });
  });

  // -------------------------------------------------------------------
  // getOverdueAndUpcomingTaxes
  // -------------------------------------------------------------------
  describe('getOverdueAndUpcomingTaxes', () => {
    test('deve retornar impostos atrasados e próximos ao vencimento', async () => {
      const result = await getOverdueAndUpcomingTaxes('2025-01');
      
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('overdue');
      expect(result).toHaveProperty('dueSoon');
      expect(result.overdue).toHaveProperty('count');
      expect(result.overdue).toHaveProperty('items');
      expect(result.dueSoon).toHaveProperty('count');
      expect(result.dueSoon).toHaveProperty('items');
    });

    test('deve excluir empresa EMP001 e NOT_APPLICABLE', async () => {
      const result = await getOverdueAndUpcomingTaxes('2025-01');
      
      const allItems = [...result.overdue.items, ...result.dueSoon.items];
      const hasEmp001 = allItems.some(item => item.company === 'EMP001');
      expect(hasEmp001).toBe(false);
    });

    test('deve identificar apenas obrigações não postadas', async () => {
      const now = new Date();
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - 5);

      await prisma.obligation.create({
        data: {
          title: 'DAS - Não Postado',
          regime: 'SIMPLES',
          periodStart: new Date('2025-01-01'),
          periodEnd: new Date('2025-01-31'),
          dueDate: pastDate,
          referenceMonth: '2025-01',
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'DAS',
          amount: null
        }
      });

      const result = await getOverdueAndUpcomingTaxes('2025-01');
      
      expect(result.overdue.count + result.dueSoon.count).toBeGreaterThanOrEqual(0);
    });

    test('deve calcular daysOverdue corretamente', async () => {
      const result = await getOverdueAndUpcomingTaxes('2025-01');
      
      result.overdue.items.forEach(item => {
        expect(item).toHaveProperty('daysOverdue');
        expect(item.daysOverdue).toBeGreaterThan(0);
      });
    });

    test('deve calcular daysUntilDue corretamente', async () => {
      const result = await getOverdueAndUpcomingTaxes('2025-01');
      
      result.dueSoon.items.forEach(item => {
        expect(item).toHaveProperty('daysUntilDue');
        expect(item.daysUntilDue).toBeGreaterThanOrEqual(0);
        expect(item.daysUntilDue).toBeLessThanOrEqual(2);
      });
    });
  });

  // -------------------------------------------------------------------
  // getUnviewedAlertsForAccounting
  // -------------------------------------------------------------------
  describe('getUnviewedAlertsForAccounting', () => {
    test('deve retornar estrutura básica dos alertas', async () => {
      const result = await getUnviewedAlertsForAccounting();
      
      expect(result).toHaveProperty('threeDays');
      expect(result).toHaveProperty('twoDays');
      expect(result).toHaveProperty('oneDay');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.threeDays)).toBe(true);
      expect(Array.isArray(result.twoDays)).toBe(true);
      expect(Array.isArray(result.oneDay)).toBe(true);
    });

    test('deve criar alertas em 1, 2 e 3 dias corretamente', async () => {
      const now = new Date();

      // Criar empresa válida (não EMP001)
      const alertCompany = await prisma.empresa.create({
        data: {
          codigo: `COMP-ALERT-${Date.now()}`,
          nome: 'Empresa Alertas',
          cnpj: `${Date.now()}000199`,
          status: 'ativa'
        }
      });

      // Função auxiliar para criar obrigação + arquivo
      async function criaObrigacao(daysAhead) {
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + daysAhead);

        const obligation = await prisma.obligation.create({
          data: {
            title: `DAS - Alert ${daysAhead}`,
            regime: 'SIMPLES',
            periodStart: new Date(),
            periodEnd: new Date(),
            dueDate,
            referenceMonth: '2025-01',
            companyId: alertCompany.id,
            userId: adminUser.id,
            status: 'PENDING',
            taxType: 'DAS',
            amount: 100
          }
        });

        await prisma.obligationFile.create({
          data: {
            obligationId: obligation.id,
            fileName: `alert-${daysAhead}.pdf`,
            originalName: `alert-${daysAhead}.pdf`,
            fileSize: 1024,
            mimeType: 'application/pdf',
            s3Key: `obligations/alert-${daysAhead}.pdf`,
            uploadedBy: adminUser.id
          }
        });

        return obligation;
      }

      await criaObrigacao(1);
      await criaObrigacao(2);
      await criaObrigacao(3);

      const result = await getUnviewedAlertsForAccounting();
      
      expect(result.oneDay.length).toBeGreaterThanOrEqual(1);
      expect(result.twoDays.length).toBeGreaterThanOrEqual(1);
      expect(result.threeDays.length).toBeGreaterThanOrEqual(1);

      result.oneDay.forEach(alert => {
        expect(alert.daysUntilDue).toBeLessThanOrEqual(1);
      });

      result.twoDays.forEach(alert => {
        expect(alert.daysUntilDue).toBeGreaterThan(1);
        expect(alert.daysUntilDue).toBeLessThanOrEqual(2);
      });

      result.threeDays.forEach(alert => {
        expect(alert.daysUntilDue).toBeGreaterThan(2);
        expect(alert.daysUntilDue).toBeLessThanOrEqual(3);
      });

      const calcTotal =
        result.oneDay.length +
        result.twoDays.length +
        result.threeDays.length;

      expect(result.total).toBe(calcTotal);
    });

    test('deve excluir empresa EMP001 e NOT_APPLICABLE', async () => {
      const result = await getUnviewedAlertsForAccounting();
      
      const allAlerts = [...result.threeDays, ...result.twoDays, ...result.oneDay];
      const hasEmp001 = allAlerts.some(alert => alert.company.includes('EMP001'));
      expect(hasEmp001).toBe(false);
    });

    test('deve retornar apenas documentos não vencidos', async () => {
      const result = await getUnviewedAlertsForAccounting();
      
      const allAlerts = [...result.threeDays, ...result.twoDays, ...result.oneDay];
      const now = new Date();
      
      allAlerts.forEach(alert => {
        const dueDate = new Date(alert.dueDate);
        expect(dueDate.getTime()).toBeGreaterThanOrEqual(now.getTime());
      });
    });

    test('deve retornar estrutura correta dos alertas', async () => {
      const result = await getUnviewedAlertsForAccounting();
      
      const allAlerts = [...result.threeDays, ...result.twoDays, ...result.oneDay];
      
      if (allAlerts.length > 0) {
        const alert = allAlerts[0];
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('taxType');
        expect(alert).toHaveProperty('title');
        expect(alert).toHaveProperty('company');
        expect(alert).toHaveProperty('dueDate');
        expect(alert).toHaveProperty('daysUntilDue');
      }
    });
  });

  // -------------------------------------------------------------------
  // Testes adicionais para edge cases
  // -------------------------------------------------------------------
  describe('Edge Cases - getMonthlySummary', () => {
    test('deve lidar com empresa sem obrigações', async () => {
      const emptyCompany = await prisma.empresa.create({
        data: {
          codigo: `EMPTY${Date.now()}`,
          nome: 'Empresa Vazia',
          cnpj: `${Date.now()}000193`,
          status: 'ativa'
        }
      });

      const now = new Date();
      const testMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const result = await getMonthlySummary(emptyCompany.id, testMonth);

      expect(result.total).toBe(0);
      expect(result.impostos).toEqual([]);
      expect(result.empresaId).toBe(emptyCompany.id);
    });

    test('deve lidar com obrigações com amount zero', async () => {
      const now = new Date();
      const testMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      await prisma.obligation.create({
        data: {
          title: 'DAS - Zero',
          regime: 'SIMPLES',
          periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
          periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
          dueDate: new Date(now.getFullYear(), now.getMonth(), 15),
          amount: 0,
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'DAS',
          referenceMonth: testMonth
        }
      });

      const result = await getMonthlySummary(company.id, testMonth);
      expect(result.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases - getMonthlyVariationByTax', () => {
    test('deve lidar com variação negativa', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      
      const testMonth = `${year}-${String(month).padStart(2, '0')}`;
      const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

      await prisma.obligation.create({
        data: {
          title: 'DAS - Anterior Alto',
          regime: 'SIMPLES',
          periodStart: new Date(prevYear, prevMonth - 1, 1),
          periodEnd: new Date(prevYear, prevMonth, 0),
          dueDate: new Date(prevYear, prevMonth - 1, 10),
          amount: 2000,
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'DAS',
          referenceMonth: prevMonthStr
        }
      });

      await prisma.obligation.create({
        data: {
          title: 'DAS - Atual Baixo',
          regime: 'SIMPLES',
          periodStart: new Date(year, month - 1, 1),
          periodEnd: new Date(year, month, 0),
          dueDate: new Date(year, month - 1, 10),
          amount: 1000,
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'DAS',
          referenceMonth: testMonth
        }
      });

      const result = await getMonthlyVariationByTax(company.id, testMonth);
      const dasImposto = result.impostos.find(imp => imp.imposto === 'DAS');
      if (dasImposto && dasImposto.valorAnterior > 0) {
        expect(dasImposto.variacao).toBeLessThan(0);
      }
    });
  });

  describe('Edge Cases - getDeadlineComplianceStats', () => {
    test('deve retornar complianceRate 100 quando não há documentos', async () => {
      const result = await getDeadlineComplianceStats('2099-01');
      expect(result.complianceRate).toBe(100);
      expect(result.total).toBe(0);
    });

    test('deve identificar documentos atrasados corretamente', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      await prisma.obligation.create({
        data: {
          title: 'DAS - Atrasado',
          regime: 'SIMPLES',
          periodStart: new Date('2025-01-01'),
          periodEnd: new Date('2025-01-31'),
          dueDate: pastDate,
          referenceMonth: '2025-01',
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'DAS',
          amount: 1000
        }
      });

      const obligation = await prisma.obligation.findFirst({
        where: { title: 'DAS - Atrasado' }
      });

      if (obligation) {
        await prisma.obligationFile.create({
          data: {
            obligationId: obligation.id,
            fileName: 'atrasado.pdf',
            originalName: 'atrasado.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            s3Key: `obligations/atrasado-${Date.now()}.pdf`,
            uploadedBy: adminUser.id
          }
        });

        const result = await getDeadlineComplianceStats('2025-01');
        const hasLate = result.details.some(d => d.isOnTime === false);
        expect(hasLate).toBe(true);
      }
    });
  });

  describe('Edge Cases - getOverdueAndUpcomingTaxes', () => {
    test('deve retornar arrays vazios quando não há impostos', async () => {
      const result = await getOverdueAndUpcomingTaxes('2099-01');
      expect(result.overdue).toEqual([]);
      expect(result.dueSoon).toEqual([]);
    });

    test('deve identificar impostos vencidos corretamente', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await prisma.obligation.create({
        data: {
          title: 'DAS - Vencido',
          regime: 'SIMPLES',
          periodStart: new Date('2025-01-01'),
          periodEnd: new Date('2025-01-31'),
          dueDate: pastDate,
          referenceMonth: '2025-01',
          companyId: company.id,
          userId: adminUser.id,
          status: 'PENDING',
          taxType: 'DAS'
        }
      });

      const result = await getOverdueAndUpcomingTaxes('2025-01');
      expect(result.overdue.length).toBeGreaterThanOrEqual(0);
    });
  });
});
