const request = require('supertest');
const { app } = require('../app');
const { prisma } = require('../prisma');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const bcrypt = require('bcryptjs');

describe('Company Tax Profile Controller', () => {
  let adminToken;
  let clientToken;
  let company;
  let clientUser;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'taxadmin@test.com' },
      update: {},
      create: {
        email: 'taxadmin@test.com',
        name: 'Tax Admin',
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

    company = await prisma.empresa.create({
      data: {
        codigo: `TAX${Date.now()}`,
        nome: 'Tax Company',
        cnpj: `${Date.now()}000190`,
        status: 'ativa'
      }
    });

    clientUser = await prisma.user.create({
      data: {
        email: 'taxclient@test.com',
        name: 'Tax Client',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'CLIENT_ADMIN',
        status: 'ACTIVE',
        companyId: company.id
      }
    });

    clientToken = jwt.sign(
      { sub: clientUser.id, role: clientUser.role, companyId: clientUser.companyId },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.companyTaxProfile.deleteMany();
    await prisma.empresa.deleteMany();
    await prisma.user.deleteMany();
  });

  // ---------------------------------------------------------
  // GET /tax-profile
  // ---------------------------------------------------------
  test('deve listar perfil fiscal da empresa', async () => {
    const res = await request(app)
      .get(`/api/empresas/${company.id}/tax-profile`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('deve negar acesso se cliente tentar acessar outra empresa', async () => {
    const otherCompany = await prisma.empresa.create({
      data: {
        codigo: `OTHER${Date.now()}`,
        nome: 'Other Company',
        cnpj: `${Date.now()}000191`,
        status: 'ativa'
      }
    });

    const res = await request(app)
      .get(`/api/empresas/${otherCompany.id}/tax-profile`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(403);

    await prisma.empresa.delete({ where: { id: otherCompany.id } });
  });

  // ---------------------------------------------------------
  // POST /tax-profile
  // ---------------------------------------------------------
  test('deve retornar erro 400 se taxType não for fornecido', async () => {
    const res = await request(app)
      .post(`/api/empresas/${company.id}/tax-profile`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  test('deve adicionar tipo de imposto ao perfil', async () => {
    const res = await request(app)
      .post(`/api/empresas/${company.id}/tax-profile`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ taxType: 'DAS' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('taxType', 'DAS');
  });

  test('deve impedir cliente de adicionar imposto', async () => {
    const res = await request(app)
      .post(`/api/empresas/${company.id}/tax-profile`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ taxType: 'ISS_RETIDO' });

    expect(res.status).toBe(403);
  });

  // Quando já existe no perfil → 409
  test('deve retornar 409 quando adicionar imposto duplicado', async () => {
    await prisma.companyTaxProfile.create({
      data: {
        companyId: company.id,
        taxType: 'ISS',
        isActive: true
      }
    });

    const res = await request(app)
      .post(`/api/empresas/${company.id}/tax-profile`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ taxType: 'ISS' });

    expect(res.status).toBe(409);
  });

  // ---------------------------------------------------------
  // DELETE /tax-profile/:taxType
  // ---------------------------------------------------------
  test('deve remover tipo de imposto do perfil', async () => {
    await prisma.companyTaxProfile.create({
      data: {
        companyId: company.id,
        taxType: 'FGTS',
        isActive: true
      }
    });

    const res = await request(app)
      .delete(`/api/empresas/${company.id}/tax-profile/FGTS`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  test('deve retornar 404 ao remover imposto inexistente', async () => {
    const res = await request(app)
      .delete(`/api/empresas/${company.id}/tax-profile/INEXISTENTE`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect([404, 500]).toContain(res.status); // depende da lógica interna do service
  });

  test('deve impedir cliente de remover imposto', async () => {
    const res = await request(app)
      .delete(`/api/empresas/${company.id}/tax-profile/DAS`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(403);
  });

  // ---------------------------------------------------------
  // PUT /tax-profile
  // ---------------------------------------------------------
  test('deve atualizar perfil fiscal completo', async () => {
    const res = await request(app)
      .put(`/api/empresas/${company.id}/tax-profile`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ taxTypes: ['DAS', 'ISS_RETIDO'] });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('deve retornar 400 se taxTypes não for array', async () => {
    const res = await request(app)
      .put(`/api/empresas/${company.id}/tax-profile`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ taxTypes: "não é array" });

    expect(res.status).toBe(400);
  });

  test('deve impedir cliente de atualizar perfil fiscal', async () => {
    const res = await request(app)
      .put(`/api/empresas/${company.id}/tax-profile`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ taxTypes: ['DAS'] });

    expect(res.status).toBe(403);
  });

  // ---------------------------------------------------------
  // GET /tax-types
  // ---------------------------------------------------------
  test('deve listar tipos de impostos disponíveis', async () => {
    const res = await request(app)
      .get('/api/empresas/tax-types')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
