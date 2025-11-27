const request = require('supertest');
const { app } = require('../app');
const { prisma } = require('../prisma');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const bcrypt = require('bcryptjs');

// Mocks dos services usados pelo controller
jest.mock('../modules/notifications/notification.service', () => ({
  getUnviewedObligations: jest.fn().mockResolvedValue([]),
  sendObligationNotification: jest.fn().mockResolvedValue({ success: true }),
  getObligationNotifications: jest.fn().mockResolvedValue([]),
  getObligationViews: jest.fn().mockResolvedValue([]),
  getClientViewsHistory: jest.fn().mockResolvedValue([]),
  getNotificationStats: jest.fn().mockResolvedValue({ total: 0 }),
}));

const {
  getUnviewedObligations,
  sendObligationNotification,
  getObligationNotifications,
  getObligationViews,
  getClientViewsHistory,
  getNotificationStats
} = require('../modules/notifications/notification.service');

describe('📌 Notification Controller', () => {
  let token;
  let adminUser;
  let company;
  let obligation;

  beforeAll(async () => {
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@notification.com',
        name: 'Admin User',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE'
      }
    });

    token = jwt.sign(
      { sub: adminUser.id, role: adminUser.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    company = await prisma.empresa.create({
      data: {
        codigo: `NOTIF${Date.now()}`,
        nome: 'Empresa Notificação',
        cnpj: `${Date.now()}000190`,
        email: 'company@test.com',
        status: 'ativa'
      }
    });

    obligation = await prisma.obligation.create({
      data: {
        title: 'Obr Teste',
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
    await prisma.obligationNotification.deleteMany();
    await prisma.obligation.deleteMany();
    await prisma.empresa.deleteMany();
    await prisma.user.deleteMany();
  });

  // --------------------------------------------------------------------------------------
  // GET /unviewed
  // --------------------------------------------------------------------------------------
  describe('GET /api/notifications/unviewed', () => {
    test('deve listar obrigações não visualizadas', async () => {
      const res = await request(app)
        .get('/api/notifications/unviewed')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getUnviewedObligations).toHaveBeenCalled();
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('deve aplicar filtros corretamente', async () => {
      const res = await request(app)
        .get(`/api/notifications/unviewed?companyId=${company.id}&startDate=2025-01-01`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getUnviewedObligations).toHaveBeenCalledWith({
        companyId: `${company.id}`,
        startDate: '2025-01-01',
        endDate: undefined
      });
    });
  });

  // --------------------------------------------------------------------------------------
  // GET /stats
  // --------------------------------------------------------------------------------------
  describe('GET /api/notifications/stats', () => {
    test('deve retornar estatísticas de notificações', async () => {
      const res = await request(app)
        .get('/api/notifications/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getNotificationStats).toHaveBeenCalled();
      expect(typeof res.body).toBe('object');
    });
  });

  // --------------------------------------------------------------------------------------
  // GET /:obligationId/history
  // --------------------------------------------------------------------------------------
  describe('GET /api/notifications/:obligationId/history', () => {
    test('deve retornar histórico de notificações', async () => {
      const res = await request(app)
        .get(`/api/notifications/${obligation.id}/history`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getObligationNotifications).toHaveBeenCalledWith(`${obligation.id}`);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------------------
  // GET /:obligationId/views
  // --------------------------------------------------------------------------------------
  describe('GET /api/notifications/:obligationId/views', () => {
    test('deve retornar histórico de visualizações', async () => {
      const res = await request(app)
        .get(`/api/notifications/${obligation.id}/views`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getObligationViews).toHaveBeenCalledWith(`${obligation.id}`);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------------------
  // GET /api/obligations/:obligationId/client-views
  // --------------------------------------------------------------------------------------
  describe('GET /api/obligations/:obligationId/client-views', () => {
    test('deve retornar histórico de visualizações de clientes', async () => {
      const res = await request(app)
        .get(`/api/obligations/${obligation.id}/client-views`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getClientViewsHistory).toHaveBeenCalledWith(`${obligation.id}`);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------------------
  // POST /send/:obligationId
  // --------------------------------------------------------------------------------------
  describe('POST /api/notifications/send/:obligationId', () => {
    test('deve reenviar notificação', async () => {
      const res = await request(app)
        .post(`/api/notifications/send/${obligation.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(sendObligationNotification).toHaveBeenCalled();
      expect(res.body).toHaveProperty('message');
    });

    test('deve retornar 404 se obrigação não existir', async () => {
      sendObligationNotification.mockRejectedValueOnce(new Error('OBLIGATION_NOT_FOUND'));

      const res = await request(app)
        .post('/api/notifications/send/999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.message).toBe('Obrigação não encontrada');
    });
  });
});
