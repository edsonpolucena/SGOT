const {
  getUnviewedObligations,
  sendObligationNotification,
  recordView
} = require('../modules/notifications/notification.service');
const { prisma } = require('../prisma');
const bcrypt = require('bcryptjs');

describe('Notification Service', () => {
  let adminUser;
  let clientUser;
  let company;
  let obligation;

  beforeAll(async () => {
    company = await prisma.empresa.create({
      data: {
        codigo: `COMP${Date.now()}`,
        nome: 'Empresa Notif Test',
        cnpj: `${Date.now()}000190`,
        email: 'empresa@notiftest.com',
        status: 'ativa'
      }
    });

    adminUser = await prisma.user.create({
      data: {
        email: 'admin@notifservice.com',
        name: 'Admin',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE'
      }
    });

    clientUser = await prisma.user.create({
      data: {
        email: 'client@notifservice.com',
        name: 'Client',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'CLIENT_NORMAL',
        status: 'ACTIVE',
        companyId: company.id
      }
    });

    obligation = await prisma.obligation.create({
      data: {
        title: 'Test Obligation',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-10'),
        companyId: company.id,
        userId: adminUser.id,
        status: 'PENDING'
      }
    });
  });

  afterAll(async () => {
    await prisma.obligationView.deleteMany();
    await prisma.obligationNotification.deleteMany();
    await prisma.obligation.deleteMany();
    await prisma.empresa.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('getUnviewedObligations', () => {
    test('deve retornar obrigações não visualizadas', async () => {
      const obligations = await getUnviewedObligations({});
      expect(Array.isArray(obligations)).toBe(true);
    });

    test('deve filtrar por companyId', async () => {
      const obligations = await getUnviewedObligations({ companyId: company.id });
      expect(obligations.every(o => o.companyId === company.id)).toBe(true);
    });
  });

  describe('recordView', () => {
    test('deve registrar visualização', async () => {
      const result = await recordView(obligation.id, clientUser.id, 'VIEW');
      expect(result).toBeDefined();
    });
  });
});


