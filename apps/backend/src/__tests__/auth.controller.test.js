const request = require("supertest");
const {app} = require("../app");
const { prisma } = require("../prisma");
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const bcrypt = require("bcryptjs");

describe("AuthController", () => {
  let adminToken;

  beforeEach(async () => {
    // Criar usuário admin para testes
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        email: 'admin@test.com',
        name: 'Admin User',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE'
      }
    });

    // Gerar token para o admin
    adminToken = jwt.sign(
      { sub: adminUser.id, role: adminUser.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    // Limpar usuários de teste (exceto admin)
    await prisma.user.deleteMany({
      where: {
        email: { not: 'admin@test.com' }
      }
    });
  });

  test("deve registrar um usuário novo (com autenticação admin)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ 
        email: "newuser@test.com", 
        password: "123456",
        name: "New User",
        role: "CLIENT_NORMAL"
      });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("newuser@test.com");
  });

  test("não deve registrar usuário existente", async () => {
    // Criar usuário existente
    await prisma.user.create({
      data: {
        email: "existing@test.com",
        name: "Existing User",
        passwordHash: await bcrypt.hash("password123", 10),
        role: "CLIENT_NORMAL",
        status: "ACTIVE"
      }
    });

    const res = await request(app)
      .post("/api/auth/register")
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ 
        email: "existing@test.com", 
        password: "123456",
        name: "Existing User",
        role: "CLIENT_NORMAL"
      });

    expect(res.status).toBe(409);
  });

  test("deve logar usuário válido", async () => {
    // Criar usuário para login
    await prisma.user.create({
      data: {
        email: "login@test.com",
        name: "Login User",
        passwordHash: await bcrypt.hash("123456", 10),
        role: "CLIENT_NORMAL",
        status: "ACTIVE"
      }
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@test.com", password: "123456" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user");
  });

  test("não deve logar com credenciais inválidas", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "wrong@test.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
  });
});
