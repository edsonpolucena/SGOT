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
        status: 'PENDING',
        taxType: 'DAS',
        referenceMonth: '2025-01'
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

    test('deve registrar download', async () => {
      const result = await recordView(obligation.id, clientUser.id, 'DOWNLOAD');
      expect(result).toBeDefined();
      expect(result.action).toBe('DOWNLOAD');
    });
  });

  describe('getObligationNotifications', () => {
    test('deve buscar histórico de notificações', async () => {
      const { getObligationNotifications } = require('../modules/notifications/notification.service');
      const notifications = await getObligationNotifications(obligation.id);
      expect(Array.isArray(notifications)).toBe(true);
    });
  });

  describe('getObligationViews', () => {
    test('deve buscar histórico de visualizações', async () => {
      const { getObligationViews } = require('../modules/notifications/notification.service');
      const views = await getObligationViews(obligation.id);
      expect(Array.isArray(views)).toBe(true);
    });
  });

  describe('getClientViewsHistory', () => {
    test('deve buscar histórico de visualizações de clientes', async () => {
      const { getClientViewsHistory } = require('../modules/notifications/notification.service');
      await recordView(obligation.id, clientUser.id, 'VIEW');
      const history = await getClientViewsHistory(obligation.id);
      expect(Array.isArray(history)).toBe(true);
      if (history.length > 0) {
        expect(history[0]).toHaveProperty('userName');
        expect(history[0]).toHaveProperty('action');
        expect(history[0]).toHaveProperty('viewedAt');
      }
    });
  });

  describe('sendObligationNotification', () => {
    test('deve enviar notificação de obrigação', async () => {
      const { sendObligationNotification } = require('../modules/notifications/notification.service');
      // Mock do email service para não enviar email real
      jest.spyOn(require('../services/email.service'), 'sendNewDocumentNotification').mockResolvedValue({ success: true });
      
      const result = await sendObligationNotification(obligation.id, adminUser.id);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('sent');
    });
  });
});













