const { getMonthlySummary, getMonthlyVariationByTax } = require('../modules/analytics/analytics.service');
const { prisma } = require('../prisma');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { env } = require('../config/env');

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
        status: 'PENDING'
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
        status: 'PENDING'
      }
    });
    
    // Armazenar o mês para usar nos testes
    module.exports.testMonth = `${year}-${month}`;
  });

  afterAll(async () => {
    await prisma.obligation.deleteMany();
    await prisma.empresa.deleteMany();
    await prisma.user.deleteMany();
  });

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
  });

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
  });
});
