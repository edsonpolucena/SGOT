const request = require("supertest");
const {app} = require("../app");
const { prisma } = require("../prisma");
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const bcrypt = require("bcryptjs");

describe("UsersController", () => {
  let adminToken;
  let normalUser;
  let testCompany;

  beforeAll(async () => {
    // Criar admin
    const admin = await prisma.user.upsert({
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
      { sub: admin.id, role: admin.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Criar empresa
    testCompany = await prisma.empresa.create({
      data: {
        codigo: `COMP${Date.now()}`,
        nome: 'Empresa Teste',
        cnpj: `${Date.now()}000190`,
        status: 'ativa'
      }
    });

    // Criar usuário normal
    normalUser = await prisma.user.create({
      data: {
        email: 'normal@userstest.com',
        name: 'Normal User',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'CLIENT_NORMAL',
        status: 'ACTIVE',
        companyId: testCompany.id
      }
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.empresa.deleteMany();
  });

  test("deve listar usuários", async () => {
    const res = await request(app)
      .get("/api/users")
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("deve buscar usuário por ID", async () => {
    const res = await request(app)
      .get(`/api/users/${normalUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.id).toBe(normalUser.id);
    expect(res.body.email).toBe(normalUser.email);
  });

  test("deve atualizar usuário", async () => {
    const res = await request(app)
      .put(`/api/users/${normalUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: "Updated Name"
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Name");
  });

  test("deve alterar status do usuário", async () => {
    const res = await request(app)
      .patch(`/api/users/${normalUser.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: "INACTIVE"
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("INACTIVE");
  });

  test("não deve permitir status inválido", async () => {
    const res = await request(app)
      .patch(`/api/users/${normalUser.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: "INVALID_STATUS"
      });

    expect(res.status).toBe(400);
  });

  test("deve filtrar usuários por role", async () => {
    const res = await request(app)
      .get("/api/users?role=CLIENT_NORMAL")
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});







