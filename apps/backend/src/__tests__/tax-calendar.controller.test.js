const request = require('supertest');
const { app } = require('../app');
const { prisma } = require('../prisma');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const bcrypt = require('bcryptjs');

// Import do service para mockar e forçar erros (caminho bate com o controller)
const taxCalendarService = require('../modules/tax-calendar/tax-calendar.service');

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

  // ---------------------------------------------------------------------------
  // ROTAS FELIZES (SUCESSO E VALIDAÇÃO 400/404)
  // ---------------------------------------------------------------------------

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
    expect(res.body).toHaveProperty('message');
  });

  test('deve retornar erro 400 se taxType ou dueDay não forem fornecidos', async () => {
    const res = await request(app)
      .post('/api/tax-calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ taxType: 'DAS' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  test('deve retornar erro 400 se dueDay estiver fora do range (maior que 31)', async () => {
    const res = await request(app)
      .post('/api/tax-calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ taxType: 'DAS', dueDay: 32 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  test('deve retornar erro 400 se dueDay estiver fora do range (menor que 1)', async () => {
    const res = await request(app)
      .post('/api/tax-calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ taxType: 'DAS', dueDay: 0 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
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
    expect(res.body).toHaveProperty('message');
  });

  // ---------------------------------------------------------------------------
  // TESTES DE ERRO 500 (CATCH DOS MÉTODOS DO CONTROLLER)
  // ---------------------------------------------------------------------------

  test('deve retornar 500 se listTaxCalendar lançar erro', async () => {
    const spy = jest
      .spyOn(taxCalendarService, 'listTaxCalendar')
      .mockRejectedValueOnce(new Error('Erro simulado'));

    const res = await request(app)
      .get('/api/tax-calendar')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message', 'Erro interno');

    spy.mockRestore();
  });

  test('deve retornar 500 se getTaxCalendarByType lançar erro', async () => {
    const spy = jest
      .spyOn(taxCalendarService, 'getTaxCalendarByType')
      .mockRejectedValueOnce(new Error('Erro simulado'));

    const res = await request(app)
      .get('/api/tax-calendar/DAS')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message', 'Erro interno');

    spy.mockRestore();
  });

  test('deve retornar 500 se upsertTaxCalendar lançar erro', async () => {
    const spy = jest
      .spyOn(taxCalendarService, 'upsertTaxCalendar')
      .mockRejectedValueOnce(new Error('Erro simulado'));

    const res = await request(app)
      .post('/api/tax-calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ taxType: 'PIS', dueDay: 10, description: 'PIS' });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message', 'Erro interno');

    spy.mockRestore();
  });

  test('deve retornar 500 se deleteTaxCalendar lançar erro', async () => {
    const spy = jest
      .spyOn(taxCalendarService, 'deleteTaxCalendar')
      .mockRejectedValueOnce(new Error('Erro simulado'));

    const res = await request(app)
      .delete('/api/tax-calendar/PIS')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message', 'Erro interno');

    spy.mockRestore();
  });
});
