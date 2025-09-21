const request = require('supertest');
const { app } = require('../app');
const { prisma } = require('../prisma');

describe('Auth', () => {
  const email = `user_${Date.now()}@test.com`;
  const password = 'secret123';

  afterAll(async () => { await prisma.$disconnect(); });

  it('registers and logs in', async () => {
    const reg = await request(app).post('/api/auth/register').send({ email, password, name: 'Tester' }).expect(201);
    expect(reg.body.token).toBeDefined();

    const login = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
    expect(login.body.token).toBeDefined();

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`).expect(200);
    expect(me.body.email).toBe(email);
  });
});
