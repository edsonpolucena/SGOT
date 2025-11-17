const request = require('supertest');
const { app } = require('../app');
const { prisma } = require('../prisma');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const bcrypt = require('bcryptjs');

describe('Auth', () => {
  let adminToken;

  beforeAll(async () => {
    // Criar admin para os testes
    const admin = await prisma.user.upsert({
      where: { email: 'admin@inttest.com' },
      update: {},
      create: {
        email: 'admin@inttest.com',
        name: 'Admin',
        passwordHash: await bcrypt.hash('secret123', 10),
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE'
      }
    });

    adminToken = jwt.sign({ sub: admin.id, role: admin.role }, env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => { 
    await prisma.user.deleteMany({ where: { email: { not: 'admin@inttest.com' } } });
    await prisma.$disconnect(); 
  });

  it('creates user with admin token and logs in', async () => {
    const email = `user_${Date.now()}@test.com`;
    const password = 'secret123';

    const reg = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email, password, name: 'Tester', role: 'CLIENT_NORMAL' })
      .expect(201);
    
    expect(reg.body.user).toBeDefined();
    expect(reg.body.user.email).toBe(email);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    
    expect(login.body.token).toBeDefined();

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);
    
    expect(me.body.email).toBe(email);
  });
});
