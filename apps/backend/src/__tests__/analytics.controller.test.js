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

  test("deve retornar erro 400 se empresaId não for informado", async () => {
    const res = await request(app)
      .get("/api/analytics/monthly-summary?mes=2025-01")
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("empresaId e mes são obrigatórios");
  });

  test("deve retornar erro 400 se mes não for informado", async () => {
    const res = await request(app)
      .get(`/api/analytics/monthly-summary?empresaId=${company.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("empresaId e mes são obrigatórios");
  });

  test("deve buscar resumo mensal com sucesso", async () => {
    const res = await request(app)
      .get(`/api/analytics/monthly-summary?empresaId=${company.id}&mes=2025-01`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  test("deve retornar erro 400 para variação sem empresaId", async () => {
    const res = await request(app)
      .get("/api/analytics/variation-by-tax?mes=2025-01")
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("empresaId e mes são obrigatórios");
  });

  test("deve retornar erro 400 para variação sem mes", async () => {
    const res = await request(app)
      .get(`/api/analytics/variation-by-tax?empresaId=${company.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("empresaId e mes são obrigatórios");
  });

  test("deve calcular variação por imposto com sucesso", async () => {
    const res = await request(app)
      .get(`/api/analytics/variation-by-tax?empresaId=${company.id}&mes=2025-01`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  test("deve retornar erro 400 para document-control-dashboard sem month", async () => {
    const res = await request(app)
      .get("/api/analytics/document-control-dashboard")
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("month é obrigatório");
  });

  test("deve buscar document-control-dashboard com sucesso", async () => {
    const res = await request(app)
      .get("/api/analytics/document-control-dashboard?month=2025-01")
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('month');
    expect(res.body).toHaveProperty('companies');
    expect(res.body).toHaveProperty('summary');
  });

  test("deve retornar erro 400 para tax-type-stats sem month", async () => {
    const res = await request(app)
      .get("/api/analytics/tax-type-stats")
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("month é obrigatório");
  });

  test("deve buscar tax-type-stats com sucesso", async () => {
    const res = await request(app)
      .get("/api/analytics/tax-type-stats?month=2025-01")
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('month');
    expect(res.body).toHaveProperty('taxStats');
  });

  test("deve retornar erro 400 para client-tax-report sem companyId", async () => {
    const res = await request(app)
      .get("/api/analytics/client-tax-report")
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("companyId é obrigatório");
  });

  test("deve buscar client-tax-report com sucesso", async () => {
    const res = await request(app)
      .get(`/api/analytics/client-tax-report?companyId=${company.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('companyId');
    expect(res.body).toHaveProperty('monthlyData');
  });

  test("deve retornar erro 400 para deadline-compliance sem month", async () => {
    const res = await request(app)
      .get("/api/analytics/deadline-compliance")
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("month é obrigatório");
  });

  test("deve buscar deadline-compliance com sucesso", async () => {
    const res = await request(app)
      .get("/api/analytics/deadline-compliance?month=2025-01")
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('month');
    expect(res.body).toHaveProperty('complianceRate');
  });

  test("deve retornar erro 400 para overdue-and-upcoming sem month", async () => {
    const res = await request(app)
      .get("/api/analytics/overdue-and-upcoming")
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("month é obrigatório");
  });

  test("deve buscar overdue-and-upcoming com sucesso", async () => {
    const res = await request(app)
      .get("/api/analytics/overdue-and-upcoming?month=2025-01")
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('month');
    expect(res.body).toHaveProperty('overdue');
    expect(res.body).toHaveProperty('dueSoon');
  });

  test("deve buscar unviewed-alerts com sucesso", async () => {
    const res = await request(app)
      .get("/api/analytics/unviewed-alerts")
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('threeDays');
    expect(res.body).toHaveProperty('twoDays');
    expect(res.body).toHaveProperty('oneDay');
    expect(res.body).toHaveProperty('total');
  });
});
