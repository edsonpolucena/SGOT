const { logAudit } = require("../utils/audit.helper");
const { prisma } = require("../prisma");
const bcrypt = require("bcryptjs");

// Mock completo do createAuditLog
jest.mock("../modules/audit/audit.service", () => ({
  createAuditLog: jest.fn((data) =>
    Promise.resolve({
      id: "mock-log-id",
      ...data,
      createdAt: new Date(),
    })
  ),
}));

const { createAuditLog } = require("../modules/audit/audit.service");

describe("Audit Helper", () => {
  let user;

  beforeAll(async () => {
    user = await prisma.user.create({
      data: {
        email: `audit${Date.now()}@test.com`,
        name: "Audit Test User",
        passwordHash: await bcrypt.hash("password", 10),
        role: "ACCOUNTING_SUPER",
        status: "ACTIVE",
      },
    });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
  });

  test("deve criar log de auditoria com todos os campos", async () => {
    const req = {
      userId: user.id,
      method: "POST",
      url: "/api/test",
      ip: "127.0.0.1",
      headers: { "user-agent": "test-agent" },
    };

    const result = await logAudit(req, "CREATE", "User", "123");

    expect(createAuditLog).toHaveBeenCalledTimes(1);
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        action: "CREATE",
        entity: "User",
        entityId: "123",
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      })
    );

    expect(result).toHaveProperty("id");
  });

  test("deve lidar com req sem user (retorna null e não lança erro)", async () => {
    const req = {
      method: "GET",
      url: "/api/test",
      connection: { remoteAddress: "127.0.0.1" },
      headers: { "user-agent": "test-agent" },
    };

    const result = await logAudit(req, "VIEW", "User", "123");

    expect(result).toBeNull();
    expect(createAuditLog).toHaveBeenCalledTimes(1); // não é chamada novamente
  });

  test("deve lidar com req sem headers", async () => {
    const req = {
      user: { id: user.id },
      method: "GET",
      url: "/api/test",
    };

    const result = await logAudit(req, "VIEW", "User", "123");

    expect(result).not.toBeNull();
    expect(createAuditLog).toHaveBeenCalledTimes(2);

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        userAgent: "unknown",
      })
    );
  });

  test("deve criar log com metadata", async () => {
    const req = {
      userId: user.id,
      method: "PUT",
      url: "/api/test",
      ip: "127.0.0.1",
      headers: { "user-agent": "test-agent" },
    };

    const metadata = {
      field: "email",
      oldValue: "old@test.com",
      newValue: "new@test.com",
    };

    const result = await logAudit(req, "UPDATE", "User", "123", metadata);

    expect(result).toHaveProperty("metadata", metadata);
    expect(createAuditLog).toHaveBeenCalledTimes(3);
  });

  test("deve criar log com diferentes ações", async () => {
    const req = {
      userId: user.id,
      method: "DELETE",
      url: "/api/test",
      ip: "127.0.0.1",
      headers: { "user-agent": "test-agent" },
    };

    await logAudit(req, "DELETE", "Obligation", "obl-1");

    expect(createAuditLog).toHaveBeenCalledTimes(4);
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "DELETE",
        entity: "Obligation",
        entityId: "obl-1",
      })
    );
  });

  test("deve lidar com erro interno sem lançar erro", async () => {
    createAuditLog.mockRejectedValueOnce(new Error("DB error"));

    const req = {
      userId: user.id,
      method: "POST",
      url: "/api/test",
      ip: "127.0.0.1",
      headers: { "user-agent": "test-agent" },
    };

    const result = await logAudit(req, "CREATE", "User", "123");

    expect(result).toBeNull();
    expect(createAuditLog).toHaveBeenCalledTimes(5);
  });
});
