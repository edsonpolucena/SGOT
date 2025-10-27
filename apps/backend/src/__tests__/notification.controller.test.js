const request = require('supertest');
const { app } = require('../app');
const { prisma } = require('../prisma');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const bcrypt = require('bcryptjs');

describe('Notification Controller', () => {
  let token;
  let adminUser;
  let company;
  let obligation;

  beforeAll(async () => {
    // Criar usuário admin
    adminUser = await prisma.user.upsert({
      where: { email: 'admin@notification.com' },
      update: {},
      create: {
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

    // Criar empresa
    company = await prisma.empresa.create({
      data: {
        codigo: `NOTIF${Date.now()}`,
        nome: 'Notification Test Company',
        cnpj: `${Date.now()}000190`,
        email: 'company@notification.com',
        status: 'ativa'
      }
    });

    // Criar obrigação
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
    await prisma.obligationNotification.deleteMany();
    await prisma.obligation.deleteMany();
    await prisma.empresa.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('GET /api/notifications/unviewed', () => {
    test('deve listar obrigações não visualizadas', async () => {
      const res = await request(app)
        .get('/api/notifications/unviewed')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/notifications/stats', () => {
    test('deve retornar estatísticas', async () => {
      const res = await request(app)
        .get('/api/notifications/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toBeDefined();
      // Pode ter totalNotifications ou ser um array/objeto vazio
      expect(typeof res.body).toBe('object');
    });
  });

  describe('GET /api/notifications/:obligationId/history', () => {
    test('deve retornar histórico de notificações', async () => {
      const res = await request(app)
        .get(`/api/notifications/${obligation.id}/history`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/notifications/:obligationId/views', () => {
    test('deve retornar histórico de visualizações', async () => {
      const res = await request(app)
        .get(`/api/notifications/${obligation.id}/views`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
