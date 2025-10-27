const request = require("supertest");
const {app} = require("../app");
const { prisma } = require("../prisma");
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const bcrypt = require("bcryptjs");

describe("ObligationController", () => {
  let token;
  let company;
  let obligation;

  beforeAll(async () => {
    const user = await prisma.user.upsert({
      where: { email: 'test@obligation.com' },
      update: {},
      create: {
        email: 'test@obligation.com',
        name: 'Test User',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE'
      }
    });

    token = jwt.sign(
      { sub: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    company = await prisma.empresa.create({
      data: {
        codigo: `COMP${Date.now()}`,
        nome: 'Empresa Teste',
        cnpj: `${Date.now()}000190`,
        status: 'ativa'
      }
    });
  });

  afterAll(async () => {
    await prisma.obligationFile.deleteMany();
    await prisma.obligationNotification.deleteMany();
    await prisma.obligationView.deleteMany();
    await prisma.obligation.deleteMany();
    await prisma.empresa.deleteMany();
    await prisma.user.deleteMany();
  });

  test("deve criar obrigação", async () => {
    const payload = {
      title: "DAS 08/2025",
      regime: "SIMPLES",
      periodStart: "2025-08-01",
      periodEnd: "2025-08-31",
      dueDate: "2025-09-10",
      companyId: company.id,
      amount: 1000,
      notes: "Teste automatizado",
    };

    const res = await request(app)
      .post("/api/obligations")
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("DAS 08/2025");
    obligation = res.body;
  });

  test("deve listar obrigações", async () => {
    const res = await request(app)
      .get("/api/obligations")
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("deve buscar obrigação por ID", async () => {
    const res = await request(app)
      .get(`/api/obligations/${obligation.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.id).toBe(obligation.id);
    expect(res.body.title).toBe(obligation.title);
  });

  test("deve atualizar obrigação", async () => {
    const res = await request(app)
      .put(`/api/obligations/${obligation.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: "DAS Atualizado",
        regime: "SIMPLES",
        periodStart: "2025-08-01",
        periodEnd: "2025-08-31",
        dueDate: "2025-09-10",
        companyId: company.id,
        amount: 1500,
        notes: "Atualizado"
      });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("DAS Atualizado");
    expect(parseFloat(res.body.amount)).toBe(1500);
  });

  test("deve deletar obrigação", async () => {
    // Criar uma nova obrigação para deletar (pois a anterior pode ter sido deletada)
    const newObligation = await prisma.obligation.create({
      data: {
        title: "To Delete",
        regime: "SIMPLES",
        periodStart: new Date("2025-01-01"),
        periodEnd: new Date("2025-01-31"),
        dueDate: new Date("2025-02-10"),
        companyId: company.id,
        userId: (await prisma.user.findUnique({ where: { email: 'test@obligation.com' } })).id
      }
    });

    const deleteRes = await request(app)
      .delete(`/api/obligations/${newObligation.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  test("não deve criar obrigação sem campos obrigatórios", async () => {
    const res = await request(app)
      .post("/api/obligations")
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: "Obrigação sem campos"
      });

    expect(res.status).toBe(400);
  });

  test("deve filtrar obrigações por status", async () => {
    // Criar obrigações com diferentes status
    await request(app)
      .post("/api/obligations")
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: "PENDING Obligation",
        regime: "SIMPLES",
        periodStart: "2025-08-01",
        periodEnd: "2025-08-31",
        dueDate: "2026-09-10",
        companyId: company.id
      });

    const res = await request(app)
      .get("/api/obligations?status=PENDING")
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
