const { prisma } = require('../prisma');
const bcrypt = require('bcryptjs');

describe('Obligation File Service', () => {
  let user;
  let company;
  let obligation;

  beforeAll(async () => {
    // Criar usuário admin
    user = await prisma.user.create({
      data: {
        email: `fileuser${Date.now()}@test.com`,
        name: 'File Test User',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE'
      }
    });

    // Criar empresa
    company = await prisma.empresa.create({
      data: {
        codigo: `FILE${Date.now()}`,
        nome: 'File Test Company',
        cnpj: `${Date.now()}000190`,
        status: 'ativa'
      }
    });

    // Criar obrigação
    obligation = await prisma.obligation.create({
      data: {
        title: 'File Test Obligation',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-10'),
        companyId: company.id,
        userId: user.id,
        status: 'PENDING'
      }
    });
  });

  afterAll(async () => {
    await prisma.obligationFile.deleteMany();
    await prisma.obligation.deleteMany();
    await prisma.empresa.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('hasAccessToObligation', () => {
    test('deve retornar true para usuário que criou a obrigação', async () => {
      const { hasAccessToObligation } = require('../modules/obligations/obligation-file.service');
      
      const hasAccess = await hasAccessToObligation(obligation.id, user.id);
      
      expect(hasAccess).toBe(true);
    });

    test('deve retornar false para usuário sem acesso', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: `other${Date.now()}@test.com`,
          name: 'Other User',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE',
          companyId: company.id
        }
      });

      const { hasAccessToObligation } = require('../modules/obligations/obligation-file.service');
      
      const hasAccess = await hasAccessToObligation(obligation.id, otherUser.id);
      
      expect(hasAccess).toBe(false);
      
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });
});
