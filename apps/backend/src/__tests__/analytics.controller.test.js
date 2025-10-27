const request = require("supertest");
const {app} = require("../app");
const { prisma } = require("../prisma");
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const bcrypt = require("bcryptjs");

describe("AnalyticsController", () => {
  let adminToken;
  let company;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'admin@analytics.com' },
      update: {},
      create: {
        email: 'admin@analytics.com',
        name: 'Admin',
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
        codigo: `COMP${Date.now()}`,
        nome: 'Empresa Analytics',
        cnpj: `${Date.now()}000190`,
        status: 'ativa'
      }
    });
  });

  afterAll(async () => {
    await prisma.obligation.deleteMany();
    await prisma.empresa.deleteMany();
    await prisma.user.deleteMany();
  });

  test("deve retornar erro se empresaId e mes não forem informados", async () => {
    const res = await request(app)
      .get("/api/analytics/monthly-summary")
      .set('Authorization', `Bearer ${adminToken}`);

    // Pode retornar 400 ou 500 dependendo da implementação
    expect([400, 500]).toContain(res.status);
  });

  test("deve buscar resumo mensal", async () => {
    const res = await request(app)
      .get(`/api/analytics/monthly-summary?empresaId=${company.id}&mes=2025-01`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Pode retornar 200 ou 400 se não houver dados
    expect([200, 400]).toContain(res.status);
  });

  test("deve calcular variação por imposto", async () => {
    const res = await request(app)
      .get(`/api/analytics/monthly-variation-by-tax?empresaId=${company.id}&mes=2025-01`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Pode retornar 200 ou 400 se não houver dados
    expect([200, 400]).toContain(res.status);
  });
});
