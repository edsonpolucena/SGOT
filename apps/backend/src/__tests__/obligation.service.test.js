const {
  createObligation,
  listObligations,
  getObligation,
  updateObligation,
  deleteObligation
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
});












