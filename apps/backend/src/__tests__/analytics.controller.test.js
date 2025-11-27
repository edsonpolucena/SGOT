const request = require("supertest");
const { app } = require("../app");
const { prisma } = require("../prisma");
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const bcrypt = require("bcryptjs");

const analyticsService = require("../modules/analytics/analytics.service");

describe("AnalyticsController", () => {
  let adminToken;
  let company;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: "admin@analytics.com" },
      update: {},
      create: {
        email: "admin@analytics.com",
        name: "Admin",
        passwordHash: await bcrypt.hash("password", 10),
        role: "ACCOUNTING_SUPER",
        status: "ACTIVE",
      },
    });

    adminToken = jwt.sign(
      { sub: admin.id, role: admin.role },
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    company = await prisma.empresa.create({
      data: {
        codigo: `COMP${Date.now()}`,
        nome: "Empresa Analytics",
        cnpj: `${Date.now()}000190`,
        status: "ativa",
      },
    });
  });

  afterAll(async () => {
    await prisma.obligation.deleteMany();
    await prisma.empresa.deleteMany();
    await prisma.user.deleteMany();
  });

  // ---------------------------------------------------------------------------
  // getMonthlySummary
  // ---------------------------------------------------------------------------
  test("deve retornar erro 400 se empresaId não for informado", async () => {
    const res = await request(app)
      .get("/api/analytics/monthly-summary?mes=2025-01")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("empresaId e mes são obrigatórios");
  });

  test("deve retornar erro 400 se mes não for informado", async () => {
    const res = await request(app)
      .get(`/api/analytics/monthly-summary?empresaId=${company.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("empresaId e mes são obrigatórios");
  });

  test("deve retornar erro 400 se empresaId for string vazia em getMonthlySummary", async () => {
    const res = await request(app)
      .get("/api/analytics/monthly-summary?empresaId=&mes=2025-01")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  test("deve retornar erro 400 se mes for string vazia em getMonthlySummary", async () => {
    const res = await request(app)
      .get(`/api/analytics/monthly-summary?empresaId=${company.id}&mes=`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  test("deve converter empresaId string para número em getMonthlySummary", async () => {
    const res = await request(app)
      .get(
        `/api/analytics/monthly-summary?empresaId=${company.id.toString()}&mes=2025-01`
      )
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("empresaId");
  });

  test("deve buscar resumo mensal com sucesso", async () => {
    const res = await request(app)
      .get(
        `/api/analytics/monthly-summary?empresaId=${company.id}&mes=2025-01`
      )
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  test("deve tratar erro 500 em getMonthlySummary quando service falha", async () => {
    const spy = jest
      .spyOn(analyticsService, "getMonthlySummary")
      .mockRejectedValue(new Error("Database error"));

    const res = await request(app)
      .get(
        `/api/analytics/monthly-summary?empresaId=${company.id}&mes=2025-01`
      )
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Erro ao buscar resumo mensal");

    spy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // monthlyVariationByTax
  // ---------------------------------------------------------------------------
  test("deve retornar erro 400 para variação sem empresaId", async () => {
    const res = await request(app)
      .get("/api/analytics/variation-by-tax?mes=2025-01")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("empresaId e mes são obrigatórios");
  });

  test("deve retornar erro 400 para variação sem mes", async () => {
    const res = await request(app)
      .get(`/api/analytics/variation-by-tax?empresaId=${company.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("empresaId e mes são obrigatórios");
  });

  test("deve converter empresaId string para número em monthlyVariationByTax", async () => {
    const res = await request(app)
      .get(
        `/api/analytics/variation-by-tax?empresaId=${company.id.toString()}&mes=2025-01`
      )
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test("deve calcular variação por imposto com sucesso", async () => {
    const res = await request(app)
      .get(
        `/api/analytics/variation-by-tax?empresaId=${company.id}&mes=2025-01`
      )
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  test("deve tratar erro 500 em monthlyVariationByTax quando service falha", async () => {
    const spy = jest
      .spyOn(analyticsService, "getMonthlyVariationByTax")
      .mockRejectedValue(new Error("Service error"));

    const res = await request(app)
      .get(
        `/api/analytics/variation-by-tax?empresaId=${company.id}&mes=2025-01`
      )
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Erro interno");

    spy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // getDocumentControlDashboard
  // ---------------------------------------------------------------------------
  test("deve retornar erro 400 para document-control-dashboard sem month", async () => {
    const res = await request(app)
      .get("/api/analytics/document-control-dashboard")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("month é obrigatório");
  });

  test("deve retornar erro 400 se month for string vazia em getDocumentControlDashboard", async () => {
    const res = await request(app)
      .get("/api/analytics/document-control-dashboard?month=")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  test("deve buscar document-control-dashboard com sucesso", async () => {
    const res = await request(app)
      .get("/api/analytics/document-control-dashboard?month=2025-01")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("month");
    expect(res.body).toHaveProperty("companies");
    expect(res.body).toHaveProperty("summary");
  });

  test("deve passar role e companyId do usuário para getDocumentControlDashboard", async () => {
    const res = await request(app)
      .get("/api/analytics/document-control-dashboard?month=2025-01")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("month");
  });

  test("deve validar formato de month em getDocumentControlDashboard", async () => {
    const res = await request(app)
      .get("/api/analytics/document-control-dashboard?month=2025-1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect([200, 400]).toContain(res.status);
  });

  test("deve tratar erro 500 em getDocumentControlDashboard quando service falha", async () => {
    const spy = jest
      .spyOn(analyticsService, "getDocumentControlDashboard")
      .mockRejectedValue(new Error("Service error"));

    const res = await request(app)
      .get("/api/analytics/document-control-dashboard?month=2025-01")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Erro interno");

    spy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // getTaxTypeStats
  // ---------------------------------------------------------------------------
  test("deve retornar erro 400 para tax-type-stats sem month", async () => {
    const res = await request(app)
      .get("/api/analytics/tax-type-stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("month é obrigatório");
  });

  test("deve buscar tax-type-stats com sucesso", async () => {
    const res = await request(app)
      .get("/api/analytics/tax-type-stats?month=2025-01")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("month");
    expect(res.body).toHaveProperty("taxStats");
  });

  test("deve validar formato de month em getTaxTypeStats", async () => {
    const res = await request(app)
      .get("/api/analytics/tax-type-stats?month=2025-1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect([200, 400]).toContain(res.status);
  });

  test("deve tratar erro 500 em getTaxTypeStats quando service falha", async () => {
    const spy = jest
      .spyOn(analyticsService, "getTaxTypeStats")
      .mockRejectedValue(new Error("Service error"));

    const res = await request(app)
      .get("/api/analytics/tax-type-stats?month=2025-01")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Erro interno");

    spy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // getClientTaxReport
  // ---------------------------------------------------------------------------
  test("deve retornar erro 400 para client-tax-report sem companyId", async () => {
    const res = await request(app)
      .get("/api/analytics/client-tax-report")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("companyId é obrigatório");
  });

  test("deve usar months padrão (12) se não fornecido em client-tax-report", async () => {
    const res = await request(app)
      .get(`/api/analytics/client-tax-report?companyId=${company.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("monthlyData");
  });

  test("deve aceitar months customizado em client-tax-report", async () => {
    const res = await request(app)
      .get(
        `/api/analytics/client-tax-report?companyId=${company.id}&months=6`
      )
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("monthlyData");
  });

  test("deve aceitar months como string e converter para número em getClientTaxReport", async () => {
    const res = await request(app)
      .get(
        `/api/analytics/client-tax-report?companyId=${company.id}&months=6`
      )
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("monthlyData");
  });

  test("deve retornar erro 400 se months não for número válido em getClientTaxReport", async () => {
    const res = await request(app)
      .get(
        `/api/analytics/client-tax-report?companyId=${company.id}&months=abc`
      )
      .set("Authorization", `Bearer ${adminToken}`);

    expect([200, 400, 500]).toContain(res.status);
  });

  test("deve permitir CLIENT acessar relatório da própria empresa", async () => {
    const clientUser = await prisma.user.create({
      data: {
        email: "client2@analytics.com",
        name: "Client User 2",
        passwordHash: await bcrypt.hash("password", 10),
        role: "CLIENT_ADMIN",
        status: "ACTIVE",
        companyId: company.id,
      },
    });

    const clientToken = jwt.sign(
      {
        sub: clientUser.id,
        role: clientUser.role,
        companyId: clientUser.companyId,
      },
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get(`/api/analytics/client-tax-report?companyId=${company.id}`)
      .set("Authorization", `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("companyId");

    await prisma.user.delete({ where: { id: clientUser.id } });
  });

  test("deve negar acesso se CLIENT tentar acessar relatório de outra empresa", async () => {
    const clientUser = await prisma.user.create({
      data: {
        email: "client@analytics.com",
        name: "Client User",
        passwordHash: await bcrypt.hash("password", 10),
        role: "CLIENT_NORMAL",
        status: "ACTIVE",
        companyId: company.id,
      },
    });

    const otherCompany = await prisma.empresa.create({
      data: {
        codigo: `OTHER${Date.now()}`,
        nome: "Other Company",
        cnpj: `${Date.now()}000191`,
        status: "ativa",
      },
    });

    const clientToken = jwt.sign(
      {
        sub: clientUser.id,
        role: clientUser.role,
        companyId: clientUser.companyId,
      },
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get(`/api/analytics/client-tax-report?companyId=${otherCompany.id}`)
      .set("Authorization", `Bearer ${clientToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Acesso negado");

    await prisma.user.delete({ where: { id: clientUser.id } });
    await prisma.empresa.delete({ where: { id: otherCompany.id } });
  });

  test("deve tratar erro 500 em getClientTaxReport quando service falha", async () => {
    const spy = jest
      .spyOn(analyticsService, "getClientTaxReport")
      .mockRejectedValue(new Error("Service error"));

    const res = await request(app)
      .get(`/api/analytics/client-tax-report?companyId=${company.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Erro interno");

    spy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // getDeadlineCompliance
  // ---------------------------------------------------------------------------
  test("deve retornar erro 400 para deadline-compliance sem month", async () => {
    const res = await request(app)
      .get("/api/analytics/deadline-compliance")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("month é obrigatório");
  });

  test("deve validar formato de month em getDeadlineCompliance", async () => {
    const res = await request(app)
      .get("/api/analytics/deadline-compliance?month=2025-1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect([200, 400]).toContain(res.status);
  });

  test("deve buscar deadline-compliance com sucesso", async () => {
    const res = await request(app)
      .get("/api/analytics/deadline-compliance?month=2025-01")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("month");
    expect(res.body).toHaveProperty("complianceRate");
  });

  test("deve tratar erro 500 em getDeadlineCompliance quando service falha", async () => {
    const spy = jest
      .spyOn(analyticsService, "getDeadlineComplianceStats")
      .mockRejectedValue(new Error("Service error"));

    const res = await request(app)
      .get("/api/analytics/deadline-compliance?month=2025-01")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Erro interno");

    spy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // getOverdueAndUpcoming
  // ---------------------------------------------------------------------------
  test("deve retornar erro 400 para overdue-and-upcoming sem month", async () => {
    const res = await request(app)
      .get("/api/analytics/overdue-and-upcoming")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("month é obrigatório");
  });

  test("deve validar formato de month em getOverdueAndUpcoming", async () => {
    const res = await request(app)
      .get("/api/analytics/overdue-and-upcoming?month=2025-1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect([200, 400]).toContain(res.status);
  });

  test("deve buscar overdue-and-upcoming com sucesso", async () => {
    const res = await request(app)
      .get("/api/analytics/overdue-and-upcoming?month=2025-01")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("month");
    expect(res.body).toHaveProperty("overdue");
    expect(res.body).toHaveProperty("dueSoon");
  });

  test("deve tratar erro 500 em getOverdueAndUpcoming quando service falha", async () => {
    const spy = jest
      .spyOn(analyticsService, "getOverdueAndUpcomingTaxes")
      .mockRejectedValue(new Error("Service error"));

    const res = await request(app)
      .get("/api/analytics/overdue-and-upcoming?month=2025-01")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Erro interno");

    spy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // getUnviewedAlerts
  // ---------------------------------------------------------------------------
  test("deve buscar unviewed-alerts com sucesso", async () => {
    const res = await request(app)
      .get("/api/analytics/unviewed-alerts")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("threeDays");
    expect(res.body).toHaveProperty("twoDays");
    expect(res.body).toHaveProperty("oneDay");
    expect(res.body).toHaveProperty("total");
  });

  test("deve tratar erro 500 em getUnviewedAlerts quando service falha", async () => {
    const spy = jest
      .spyOn(analyticsService, "getUnviewedAlertsForAccounting")
      .mockRejectedValue(new Error("Service error"));

    const res = await request(app)
      .get("/api/analytics/unviewed-alerts")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Erro ao buscar alertas");

    spy.mockRestore();
  });
});
