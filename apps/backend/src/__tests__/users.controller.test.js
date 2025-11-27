const request = require("supertest");
const { app } = require("../app");
const { prisma } = require("../prisma");
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const bcrypt = require("bcryptjs");

describe("UsersController", () => {
  let adminToken;
  let accountingAdmin;
  let normalUser;
  let testCompany;

  beforeAll(async () => {
    // Criar admin principal (ACCOUNTING_SUPER)
    accountingAdmin = await prisma.user.upsert({
      where: { email: 'admin@userstest.com' },
      update: {},
      create: {
        email: 'admin@userstest.com',
        name: 'Admin User',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE'
      }
    });

    adminToken = jwt.sign(
      { sub: accountingAdmin.id, role: accountingAdmin.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Criar empresa
    testCompany = await prisma.empresa.create({
      data: {
        codigo: `COMP${Date.now()}`,
        nome: "Empresa Teste",
        cnpj: `${Date.now()}000190`,
        status: "ativa"
      }
    });

    // Criar usuário normal (CLIENT_NORMAL)
    normalUser = await prisma.user.create({
      data: {
        email: "normal@userstest.com",
        name: "Normal User",
        passwordHash: await bcrypt.hash("password", 10),
        role: "CLIENT_NORMAL",
        status: "ACTIVE",
        companyId: testCompany.id
      }
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.empresa.deleteMany();
  });

  // ============================================================
  // LIST USERS
  // ============================================================
  test("deve listar usuários", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  // ============================================================
  // GET USER BY ID
  // ============================================================
  test("deve buscar usuário por ID", async () => {
    const res = await request(app)
      .get(`/api/users/${normalUser.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.id).toBe(normalUser.id);
  });

  test("deve retornar 404 se usuário não existir", async () => {
    const res = await request(app)
      .get("/api/users/999999")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);

    expect(res.body.message).toContain("não encontrado");
  });

  // ============================================================
  // UPDATE USER
  // ============================================================
  test("deve atualizar usuário", async () => {
    const res = await request(app)
      .put(`/api/users/${normalUser.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Updated Name" })
      .expect(200);

    expect(res.body.name).toBe("Updated Name");
  });

  test("deve retornar 404 ao atualizar usuário inexistente", async () => {
    const res = await request(app)
      .put("/api/users/999999")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Test" })
      .expect(404);
  });

  // Erro de role proibida
  test("deve bloquear alteração para role proibida", async () => {
    const res = await request(app)
      .put(`/api/users/${normalUser.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "ACCOUNTING_SUPER" }) // ilegal para CLIENT
      .expect(403);

    expect(res.body.message).toContain("permissão");
  });

  // Email duplicado
  test("deve retornar erro ao tentar atualizar com email já existente", async () => {
    const anotherUser = await prisma.user.create({
      data: {
        email: "emailjaexiste@test.com",
        name: "Other",
        passwordHash: await bcrypt.hash("password", 10),
        role: "CLIENT_NORMAL",
        status: "ACTIVE",
        companyId: testCompany.id
      }
    });

    const res = await request(app)
      .put(`/api/users/${normalUser.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: "emailjaexiste@test.com" })
      .expect(409);

    expect(res.body.message).toContain("Email já está em uso");

    await prisma.user.delete({ where: { id: anotherUser.id } });
  });

  // ============================================================
  // UPDATE STATUS
  // ============================================================
  test("deve alterar status do usuário", async () => {
    const res = await request(app)
      .patch(`/api/users/${normalUser.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "INACTIVE" })
      .expect(200);

    expect(res.body.status).toBe("INACTIVE");
  });

  test("não deve aceitar status inválido", async () => {
    const res = await request(app)
      .patch(`/api/users/${normalUser.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "QUALQUER" })
      .expect(400);

    expect(res.body.message).toContain("inválido");
  });

  test("não deve permitir desativar a si mesmo", async () => {
    const res = await request(app)
      .patch(`/api/users/${accountingAdmin.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "INACTIVE" })
      .expect(400);

    expect(res.body.message).toContain("não pode");
  });

  // ============================================================
  // DELETE USER (soft delete)
  // ============================================================
  test("deve deletar usuário (soft delete)", async () => {
    const testUser = await prisma.user.create({
      data: {
        email: `delete${Date.now()}@test.com`,
        name: "Delete User",
        passwordHash: await bcrypt.hash("password", 10),
        role: "CLIENT_NORMAL",
        status: "ACTIVE",
        companyId: testCompany.id
      }
    });

    await request(app)
      .delete(`/api/users/${testUser.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const deleted = await prisma.user.findUnique({ where: { id: testUser.id } });
    expect(deleted.status).toBe("INACTIVE");
  });

  test("não deve permitir deletar a si mesmo", async () => {
    const res = await request(app)
      .delete(`/api/users/${accountingAdmin.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(400);

    expect(res.body.message).toContain("não pode");
  });

  // ============================================================
  // FILTERS
  // ============================================================
  test("deve filtrar usuários por role", async () => {
    const res = await request(app)
      .get("/api/users?role=CLIENT_NORMAL")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  test("deve filtrar usuários por status", async () => {
    const res = await request(app)
      .get("/api/users?status=ACTIVE")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.every(u => u.status === "ACTIVE")).toBe(true);
  });

  test("deve filtrar usuários por companyId", async () => {
    const res = await request(app)
      .get(`/api/users?companyId=${testCompany.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
