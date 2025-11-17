const {
  createObligation,
  listObligations,
  getObligation,
  updateObligation,
  deleteObligation,
  markAsNotApplicable,
  getMonthlyControl
} = require('../modules/obligations/obligation.service');
const { prisma } = require('../prisma');
const bcrypt = require('bcryptjs');

describe('Obligation Service', () => {
  let user;
  let company;
  let obligation;

  beforeAll(async () => {
    company = await prisma.empresa.create({
      data: {
        codigo: `COMP${Date.now()}`,
        nome: 'Empresa Test',
        cnpj: `${Date.now()}000190`,
        status: 'ativa'
      }
    });

    user = await prisma.user.create({
      data: {
        email: `user${Date.now()}@test.com`,
        name: 'Test User',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE'
      }
    });
  });

  afterAll(async () => {
    await prisma.obligation.deleteMany();
    await prisma.user.deleteMany();
    await prisma.empresa.deleteMany();
  });

  describe('createObligation', () => {
    test('deve criar obrigação', async () => {
      const data = {
        title: 'Test Obligation',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-10'),
        companyId: company.id,
        amount: 1000
      };

      obligation = await createObligation(user.id, data);
      expect(obligation.title).toBe(data.title);
    });
  });

  describe('listObligations', () => {
    test('deve listar obrigações', async () => {
      const obligations = await listObligations(user.id, 'ACCOUNTING_SUPER', {});
      expect(Array.isArray(obligations)).toBe(true);
    });

    test('deve filtrar por status', async () => {
      const obligations = await listObligations(user.id, 'ACCOUNTING_SUPER', { status: 'PENDING' });
      expect(obligations.every(o => o.status === 'PENDING')).toBe(true);
    });

    test('deve filtrar por regime', async () => {
      const obligations = await listObligations(user.id, 'ACCOUNTING_SUPER', { regime: 'SIMPLES' });
      expect(obligations.every(o => o.regime === 'SIMPLES')).toBe(true);
    });

    test('deve filtrar por referenceMonth', async () => {
      const obligations = await listObligations(user.id, 'ACCOUNTING_SUPER', { referenceMonth: '2025-01' });
      expect(Array.isArray(obligations)).toBe(true);
    });

    test('CLIENT deve ver apenas obrigações da própria empresa', async () => {
      const clientUser = await prisma.user.create({
        data: {
          email: `client${Date.now()}@test.com`,
          name: 'Client User',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE',
          companyId: company.id
        }
      });

      const obligations = await listObligations(clientUser.id, 'CLIENT_NORMAL', {});
      expect(obligations.every(o => o.companyId === company.id)).toBe(true);

      await prisma.user.delete({ where: { id: clientUser.id } });
    });
  });

  describe('getObligation', () => {
    test('deve buscar obrigação por ID', async () => {
      const found = await getObligation(user.id, 'ACCOUNTING_SUPER', obligation.id);
      expect(found.id).toBe(obligation.id);
    });
  });

  describe('updateObligation', () => {
    test('deve atualizar obrigação', async () => {
      const updated = await updateObligation(
        user.id,
        'ACCOUNTING_SUPER',
        obligation.id,
        { title: 'Updated Title' }
      );
      expect(updated.title).toBe('Updated Title');
    });
  });

  describe('deleteObligation', () => {
    test('deve deletar obrigação', async () => {
      const result = await deleteObligation(user.id, 'ACCOUNTING_SUPER', obligation.id);
      expect(result).toBe(true);
    });
  });

  describe('markAsNotApplicable', () => {
    test('deve marcar obrigação como não aplicável', async () => {
      const newObligation = await createObligation(user.id, {
        title: 'Not Applicable Test',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-10'),
        companyId: company.id
      });

      const result = await markAsNotApplicable(user.id, 'ACCOUNTING_SUPER', newObligation.id, 'Não se aplica');
      expect(result.status).toBe('NOT_APPLICABLE');
      expect(result.notApplicableReason).toBe('Não se aplica');
    });

    test('deve lançar erro se cliente tentar marcar como não aplicável', async () => {
      const clientUser = await prisma.user.create({
        data: {
          email: `client${Date.now()}@test.com`,
          name: 'Client User',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE',
          companyId: company.id
        }
      });

      await expect(markAsNotApplicable(clientUser.id, 'CLIENT_NORMAL', obligation.id, 'Test'))
        .rejects.toThrow('Apenas usuários da contabilidade');

      await prisma.user.delete({ where: { id: clientUser.id } });
    });
  });

  describe('getMonthlyControl', () => {
    test('deve retornar controle mensal', async () => {
      await prisma.companyTaxProfile.create({
        data: {
          companyId: company.id,
          taxType: 'DAS',
          isActive: true
        }
      });

      const result = await getMonthlyControl(company.id, '2025-01');
      expect(result).toHaveProperty('companyId');
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('expectedTaxes');
      expect(result).toHaveProperty('obligations');
      expect(result).toHaveProperty('missing');
      expect(result).toHaveProperty('completionRate');
    });
  });
});













