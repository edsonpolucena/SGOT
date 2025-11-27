jest.mock('../services/email.service', () => ({
  sendNewDocumentNotification: jest.fn()
}));

const {
  getUnviewedObligations,
  recordView,
  sendObligationNotification,
  getObligationNotifications,
  getObligationViews,
  getClientViewsHistory,
  getNotificationStats
} = require('../modules/notifications/notification.service');

const { prisma } = require('../prisma');
const bcrypt = require('bcryptjs');
const { sendNewDocumentNotification } = require('../services/email.service');

describe('Notification Service', () => {
  let adminUser;
  let clientUser;
  let company;
  let companyNoEmail;
  let obligation;
  let obligationNoEmail;
  let obligationInvalidNotes;
  let notApplicableObligation;

  beforeAll(async () => {
    const ts = Date.now();

    // EMPRESA CONTABILIDADE (EMP001) PARA FROM EMAIL
    await prisma.empresa.upsert({
      where: { codigo: 'EMP001' },
      update: { email: 'contabilidade@test.com' },
      create: {
        codigo: 'EMP001',
        nome: 'Contabilidade Teste',
        cnpj: `${ts}000111`,
        email: 'contabilidade@test.com',
        status: 'ativa'
      }
    });

    // Empresa com email
    company = await prisma.empresa.create({
      data: {
        codigo: `COMP${ts}`,
        nome: 'Empresa Notif Test',
        cnpj: `${ts}000190`,
        email: 'empresa@notiftest.com',
        status: 'ativa'
      }
    });

    // Empresa sem email (para testar branch de retorno sem envio)
    companyNoEmail = await prisma.empresa.create({
      data: {
        codigo: `COMPNE${ts}`,
        nome: 'Empresa Sem Email',
        cnpj: `${ts}000191`,
        status: 'ativa',
        email: null
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

    // Obrigação principal (não visualizada)
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
        referenceMonth: '2025-01',
        notes: JSON.stringify({
          companyCode: company.codigo,
          docType: 'NFSe',
          competence: '01/2025',
          cnpj: company.cnpj,
          companyName: company.nome
        })
      }
    });

    // Obrigação para empresa sem e-mail
    obligationNoEmail = await prisma.obligation.create({
      data: {
        title: 'Obr Sem Email',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-15'),
        companyId: companyNoEmail.id,
        userId: adminUser.id,
        status: 'PENDING',
        taxType: 'DAS',
        referenceMonth: '2025-01'
      }
    });

    // Obrigação NOT_APPLICABLE (não deve aparecer em getUnviewedObligations)
    notApplicableObligation = await prisma.obligation.create({
      data: {
        title: 'Obr NA',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-20'),
        companyId: company.id,
        userId: adminUser.id,
        status: 'NOT_APPLICABLE',
        taxType: 'DAS',
        referenceMonth: '2025-01'
      }
    });

    // Obrigação com notes inválido para testar try/catch
    obligationInvalidNotes = await prisma.obligation.create({
      data: {
        title: 'INVALID_NOTES_TEST',
        regime: 'SIMPLES',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        dueDate: new Date('2025-02-25'),
        companyId: company.id,
        userId: adminUser.id,
        status: 'PENDING',
        taxType: 'DAS',
        referenceMonth: '2025-01',
        notes: '{invalid-json' // força erro de JSON.parse
      }
    });

    // Mock default do envio de e-mail
    sendNewDocumentNotification.mockResolvedValue({
      success: true,
      error: null
    });
  });

  afterAll(async () => {
    await prisma.obligationView.deleteMany();
    await prisma.obligationNotification.deleteMany();
    await prisma.obligation.deleteMany();
    await prisma.user.deleteMany();
    await prisma.empresa.deleteMany();
  });

  // -------------------------------------------------------
  // getUnviewedObligations
  // -------------------------------------------------------
  describe('getUnviewedObligations', () => {
    test('deve retornar obrigações não visualizadas com campos formatados', async () => {
      const obligations = await getUnviewedObligations({});
      expect(Array.isArray(obligations)).toBe(true);

      if (obligations.length > 0) {
        const o = obligations[0];
        expect(o).toHaveProperty('companyCode');
        expect(o).toHaveProperty('docType');
        expect(o).toHaveProperty('competence');
        expect(o).toHaveProperty('cnpj');
        expect(o).toHaveProperty('companyName');
        expect(o).toHaveProperty('lastNotification');
        expect(o).toHaveProperty('viewCount');
      }
    });

    test('deve filtrar por companyId', async () => {
      const obligations = await getUnviewedObligations({ companyId: company.id });
      expect(obligations.every(o => o.companyId === company.id)).toBe(true);
    });

    test('deve aplicar filtro por período de dueDate', async () => {
      const obligations = await getUnviewedObligations({
        startDate: '2025-02-01',
        endDate: '2025-02-28'
      });

      expect(
        obligations.every(o => {
          const d = new Date(o.dueDate);
          return d >= new Date('2025-02-01') && d <= new Date('2025-02-28');
        })
      ).toBe(true);
    });

    test('não deve retornar obrigações com status NOT_APPLICABLE', async () => {
      const obligations = await getUnviewedObligations({});
      const hasNotApplicable = obligations.some(o => o.status === 'NOT_APPLICABLE');
      expect(hasNotApplicable).toBe(false);
    });

    test('deve tratar notes inválido sem quebrar e usar defaults', async () => {
      const obligations = await getUnviewedObligations({});
      const item = obligations.find(o => o.title === 'INVALID_NOTES_TEST');
      expect(item).toBeDefined();
      // Como o notes é inválido, usa fallback (company + campos vazios)
      expect(item.companyCode).toBe(item.company.codigo);
      expect(item.docType).toBe('');
      expect(item.competence).toBe('');
      expect(item.companyName).toBe(item.company.nome);
    });
  });

  // -------------------------------------------------------
  // recordView
  // -------------------------------------------------------
  describe('recordView', () => {
    test('deve registrar visualização (VIEW)', async () => {
      const result = await recordView(obligation.id, clientUser.id, 'VIEW');
      expect(result).toBeDefined();
      expect(result.action).toBe('VIEW');
    });

    test('deve registrar download (DOWNLOAD) mesmo se já existir visualização', async () => {
      // primeira visualização
      await recordView(obligation.id, clientUser.id, 'VIEW');
      // segunda com DOWNLOAD cobre o existingView
      const result = await recordView(obligation.id, clientUser.id, 'DOWNLOAD');
      expect(result).toBeDefined();
      expect(result.action).toBe('DOWNLOAD');
    });
  });

  // -------------------------------------------------------
  // getObligationNotifications
  // -------------------------------------------------------
  describe('getObligationNotifications', () => {
    test('deve buscar histórico de notificações', async () => {
      // garantir pelo menos uma notificação criada
      await sendObligationNotification(obligation.id, adminUser.id);

      const notifications = await getObligationNotifications(obligation.id);
      expect(Array.isArray(notifications)).toBe(true);
    });
  });

  // -------------------------------------------------------
  // getObligationViews
  // -------------------------------------------------------
  describe('getObligationViews', () => {
    test('deve buscar histórico de visualizações', async () => {
      const views = await getObligationViews(obligation.id);
      expect(Array.isArray(views)).toBe(true);
    });
  });

  // -------------------------------------------------------
  // getClientViewsHistory
  // -------------------------------------------------------
  describe('getClientViewsHistory', () => {
    test('deve retornar apenas visualizações de clientes', async () => {
      // VIEW do admin (não deve aparecer)
      await recordView(obligation.id, adminUser.id, 'VIEW');
      // VIEW do client (deve aparecer)
      await recordView(obligation.id, clientUser.id, 'VIEW');

      const history = await getClientViewsHistory(obligation.id);
      expect(Array.isArray(history)).toBe(true);

      history.forEach(item => {
        expect(item).toHaveProperty('userName');
        expect(item).toHaveProperty('userEmail');
        expect(item).toHaveProperty('action');
        expect(item).toHaveProperty('viewedAt');
        // Só clientes
        expect(item.userEmail).toBe(clientUser.email);
      });
    });
  });

  // -------------------------------------------------------
  // sendObligationNotification
  // -------------------------------------------------------
  describe('sendObligationNotification', () => {
    test('deve enviar notificação de obrigação com sucesso', async () => {
      sendNewDocumentNotification.mockResolvedValueOnce({
        success: true,
        error: null
      });

      const result = await sendObligationNotification(obligation.id, adminUser.id);

      expect(sendNewDocumentNotification).toHaveBeenCalled();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('sent', 1);
      expect(result).toHaveProperty('total', 1);
      expect(Array.isArray(result.results)).toBe(true);
    });

    test('deve retornar erro amigável quando empresa não tem email', async () => {
      sendNewDocumentNotification.mockClear();

      const result = await sendObligationNotification(obligationNoEmail.id, adminUser.id);

      // não deve tentar enviar email
      expect(sendNewDocumentNotification).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.sent).toBe(0);
      expect(result.total).toBe(1);
      expect(result.message).toBe('Empresa sem email cadastrado');
    });

    test('deve marcar notificação como failed quando envio falhar', async () => {
      sendNewDocumentNotification.mockResolvedValueOnce({
        success: false,
        error: 'SMTP error'
      });

      const result = await sendObligationNotification(obligation.id, adminUser.id);

      expect(result.success).toBe(false);
      expect(result.sent).toBe(0);
      expect(result.total).toBe(1);

      const notifications = await getObligationNotifications(obligation.id);
      const last = notifications[0];
      expect(last.emailStatus).toBe('failed');
    });

    test('deve lançar erro quando obrigação não existe', async () => {
      await expect(
        sendObligationNotification(9999999, adminUser.id)
      ).rejects.toThrow('OBLIGATION_NOT_FOUND');
    });
  });

  // -------------------------------------------------------
  // getNotificationStats
  // -------------------------------------------------------
  describe('getNotificationStats', () => {
    test('deve retornar estatísticas gerais de notificações e visualizações', async () => {
      const stats = await getNotificationStats({});

      expect(stats).toHaveProperty('notifications');
      expect(stats.notifications).toHaveProperty('total');
      expect(stats.notifications).toHaveProperty('sent');
      expect(stats.notifications).toHaveProperty('failed');
      expect(stats.notifications).toHaveProperty('pending');

      expect(stats).toHaveProperty('views');
      expect(stats.views).toHaveProperty('total');

      expect(stats).toHaveProperty('unviewed');
      expect(typeof stats.unviewed).toBe('number');

      // consistência básica
      const { total, sent, failed, pending } = stats.notifications;
      expect(total).toBe(sent + failed + pending);
    });

    test('deve aplicar filtros de período em sentAt', async () => {
      const stats = await getNotificationStats({
        startDate: '2025-01-01',
        endDate: '2100-01-01'
      });

      expect(stats.notifications.total).toBeGreaterThanOrEqual(0);
    });
  });

  // -------------------------------------------------------
  // Testes adicionais para edge cases
  // -------------------------------------------------------
  describe('Edge Cases - getUnviewedObligations', () => {
    test('deve retornar array vazio quando não há obrigações', async () => {
      const obligations = await getUnviewedObligations({
        companyId: 99999
      });
      expect(obligations).toEqual([]);
    });

    test('deve filtrar corretamente por startDate apenas', async () => {
      const obligations = await getUnviewedObligations({
        startDate: '2025-01-01'
      });
      expect(obligations.every(o => new Date(o.dueDate) >= new Date('2025-01-01'))).toBe(true);
    });

    test('deve filtrar corretamente por endDate apenas', async () => {
      const obligations = await getUnviewedObligations({
        endDate: '2025-12-31'
      });
      expect(obligations.every(o => new Date(o.dueDate) <= new Date('2025-12-31'))).toBe(true);
    });
  });

  describe('Edge Cases - recordView', () => {
    test('deve criar novo registro mesmo se já existir visualização', async () => {
      await recordView(obligation.id, clientUser.id, 'VIEW');
      const firstView = await prisma.obligationView.findFirst({
        where: { obligationId: obligation.id, viewedBy: clientUser.id }
      });

      await recordView(obligation.id, clientUser.id, 'VIEW');
      const views = await prisma.obligationView.findMany({
        where: { obligationId: obligation.id, viewedBy: clientUser.id }
      });

      expect(views.length).toBeGreaterThan(1);
    });
  });

  describe('Edge Cases - sendObligationNotification', () => {
    test('deve tratar erro de email service graciosamente', async () => {
      sendNewDocumentNotification.mockRejectedValueOnce(new Error('SMTP Error'));

      const result = await sendObligationNotification(obligation.id, adminUser.id);
      
      expect(result.success).toBe(false);
      expect(result.sent).toBe(0);
    });

    test('deve criar registro de notificação mesmo quando email falha', async () => {
      sendNewDocumentNotification.mockResolvedValueOnce({
        success: false,
        error: 'Email failed'
      });

      await sendObligationNotification(obligation.id, adminUser.id);
      
      const notifications = await getObligationNotifications(obligation.id);
      expect(notifications.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases - getNotificationStats', () => {
    test('deve retornar zeros quando não há dados', async () => {
      const stats = await getNotificationStats({
        startDate: '2099-01-01',
        endDate: '2099-12-31'
      });

      expect(stats.notifications.total).toBe(0);
      expect(stats.notifications.sent).toBe(0);
      expect(stats.notifications.failed).toBe(0);
      expect(stats.notifications.pending).toBe(0);
    });
  });
});
