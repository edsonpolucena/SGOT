const request = require("supertest");
const {app} = require("../app");
const { prisma } = require("../prisma");
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const bcrypt = require("bcryptjs");

describe("AuditController", () => {
  let adminToken;
  let user;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'admin@audit.com' },
      update: {},
      create: {
        email: 'admin@audit.com',
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

    user = await prisma.user.create({
      data: {
        email: 'audit@test.com',
        name: 'Test User',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'CLIENT_NORMAL',
        status: 'ACTIVE'
      }
    });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
  });

  test("deve listar logs de auditoria", async () => {
    const res = await request(app)
      .get("/api/audit/logs")
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toBeDefined();
  });

  test("deve buscar log por ID", async () => {
    // Criar um log primeiro
    const log = await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
        changes: {},
        ipAddress: '127.0.0.1',
        userAgent: 'Test'
      }
    });

    const res = await request(app)
      .get(`/api/audit/logs/${log.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.id).toBe(log.id);
  });

  test("deve retornar estatísticas de auditoria", async () => {
    const res = await request(app)
      .get("/api/audit/stats")
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toBeDefined();
  });
});






