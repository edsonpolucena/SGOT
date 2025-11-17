const request = require('supertest');
const { app } = require('../app');
const { prisma } = require('../prisma');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const bcrypt = require('bcryptjs');

describe('Tax Calendar Controller', () => {
  let adminToken;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'calendar@test.com' },
      update: {},
      create: {
        email: 'calendar@test.com',
        name: 'Calendar Admin',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE'
      }
    });

    adminToken = jwt.sign(
      { sub: admin.id, role: admin.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.taxCalendar.deleteMany();
    await prisma.user.deleteMany();
  });

  test('deve listar calendário fiscal', async () => {
    const res = await request(app)
      .get('/api/tax-calendar')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('deve buscar vencimento por tipo de imposto', async () => {
    await prisma.taxCalendar.upsert({
      where: { taxType: 'DAS' },
      update: {},
      create: {
        taxType: 'DAS',
        dueDay: 20,
        description: 'DAS'
      }
    });

    const res = await request(app)
      .get('/api/tax-calendar/DAS')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('taxType', 'DAS');
  });

  test('deve retornar 404 se vencimento não existir', async () => {
    const res = await request(app)
      .get('/api/tax-calendar/INEXISTENTE')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  test('deve retornar erro 400 se taxType ou dueDay não forem fornecidos', async () => {
    const res = await request(app)
      .post('/api/tax-calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ taxType: 'DAS' });

    expect(res.status).toBe(400);
  });

  test('deve retornar erro 400 se dueDay estiver fora do range', async () => {
    const res = await request(app)
      .post('/api/tax-calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ taxType: 'DAS', dueDay: 32 });

    expect(res.status).toBe(400);
  });

  test('deve criar ou atualizar vencimento', async () => {
    const res = await request(app)
      .post('/api/tax-calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ taxType: 'ISS_RETIDO', dueDay: 15, description: 'ISS Retido' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('taxType', 'ISS_RETIDO');
    expect(res.body).toHaveProperty('dueDay', 15);
  });

  test('deve remover vencimento', async () => {
    await prisma.taxCalendar.create({
      data: {
        taxType: 'FGTS',
        dueDay: 7,
        description: 'FGTS'
      }
    });

    const res = await request(app)
      .delete('/api/tax-calendar/FGTS')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});

