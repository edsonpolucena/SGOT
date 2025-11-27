const request = require('supertest');
const { app } = require('../app');
const { prisma } = require('../prisma');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const bcrypt = require('bcryptjs');

describe('requireAuth Middleware', () => {
  let user;
  let token;
  let inactiveUser;
  let inactiveToken;

  beforeAll(async () => {
    user = await prisma.user.create({
      data: {
        email: 'requireauth@test.com',
        name: 'Require Auth User',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE',
      },
    });

    token = jwt.sign(
      { sub: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    inactiveUser = await prisma.user.create({
      data: {
        email: 'inactiveauth@test.com',
        name: 'Inactive Auth User',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'CLIENT_NORMAL',
        status: 'INACTIVE',
      },
    });

    inactiveToken = jwt.sign(
      { sub: inactiveUser.id, role: inactiveUser.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
  });

  test('deve retornar 401 se token não for fornecido', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Missing token');
  });

  test('deve retornar 401 se Authorization não começar com Bearer', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      // Header presente, mas formato errado
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Missing token');
  });

  test('deve retornar 401 se token for inválido', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token');
  });

  test('deve permitir acesso com token válido', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email');
    expect(res.body.email).toBe(user.email);
  });

  test('deve bloquear usuário inativo', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${inactiveToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('inativo');
  });

  test('deve retornar 401 se usuário não existir', async () => {
    const fakeToken = jwt.sign(
      { sub: 999999, role: 'ACCOUNTING_SUPER' }, // ID que não existe
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('User not found');
  });
});
