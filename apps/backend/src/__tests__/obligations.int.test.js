const request = require('supertest');
const { app } = require('../app');
const { prisma } = require('../prisma');

async function authToken() {
  const email = `u_${Date.now()}@t.com`;
  const password = 'secret123';
  await request(app).post('/api/auth/register').send({ email, password });
  const login = await request(app).post('/api/auth/login').send({ email, password });
  return login.body.token;
}

describe('Obligations CRUD', () => {
  afterAll(async () => { await prisma.$disconnect(); });

  it('creates and lists obligations', async () => {
    const token = await authToken();
    const payload = {
      title: 'DAS 05/2025',
      regime: 'SIMPLES',
      periodStart: new Date('2025-05-01'),
      periodEnd: new Date('2025-05-31'),
      dueDate: new Date('2025-06-20'),
      amount: 123.45
    };

    await request(app).post('/api/obligations').set('Authorization', `Bearer ${token}`).send(payload).expect(201);
    const list = await request(app).get('/api/obligations').set('Authorization', `Bearer ${token}`).expect(200);
    expect(Array.isArray(list.body)).toBe(true);
  });
});
