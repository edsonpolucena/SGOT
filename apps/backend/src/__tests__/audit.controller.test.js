const request = require("supertest");
const { app } = require("../app");

// MOCK do audit.service
jest.mock("../modules/audit/audit.service", () => ({
  getAuditLogs: jest.fn(),
  getAuditLogById: jest.fn(),
  getAuditStats: jest.fn()
}));

const {
  getAuditLogs,
  getAuditLogById,
  getAuditStats
} = require("../modules/audit/audit.service");

const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

describe("AuditController", () => {
  let token;

  beforeAll(() => {
    token = jwt.sign(
      { sub: 1, role: "ACCOUNTING_SUPER" },
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================
  //  LIST /api/audit/logs
  // ========================================================
  test("deve listar logs de auditoria com filtros", async () => {
    getAuditLogs.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const res = await request(app)
      .get("/api/audit/logs?action=CREATE&page=1&limit=10")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(getAuditLogs).toHaveBeenCalledWith({
      userId: undefined,
      action: "CREATE",
      entity: undefined,
      entityId: undefined,
      startDate: undefined,
      endDate: undefined,
      page: "1",
      limit: "10"
    });

    expect(res.body.length).toBe(2);
  });

  test("deve retornar 500 ao listar logs (erro interno)", async () => {
    getAuditLogs.mockRejectedValue(new Error("DB_ERROR"));

    const res = await request(app)
      .get("/api/audit/logs")
      .set("Authorization", `Bearer ${token}`)
      .expect(500);

    expect(res.body).toHaveProperty("message");
  });

  // ========================================================
  //  GET /api/audit/logs/:id
  // ========================================================
  test("deve buscar log por ID", async () => {
    getAuditLogById.mockResolvedValue({ id: 10 });

    const res = await request(app)
      .get("/api/audit/logs/10")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(getAuditLogById).toHaveBeenCalledWith("10");
    expect(res.body.id).toBe(10);
  });

  test("deve retornar 404 quando log não existir", async () => {
    const err = new Error("LOG_NOT_FOUND");
    err.message = "LOG_NOT_FOUND";

    getAuditLogById.mockRejectedValue(err);

    const res = await request(app)
      .get("/api/audit/logs/999")
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    expect(res.body).toHaveProperty("message", "Log não encontrado");
  });

  test("deve retornar 500 ao buscar log (erro interno)", async () => {
    getAuditLogById.mockRejectedValue(new Error("SERVER_FAIL"));

    const res = await request(app)
      .get("/api/audit/logs/20")
      .set("Authorization", `Bearer ${token}`)
      .expect(500);

    expect(res.body.message).toContain("Erro ao buscar log");
  });

  // ========================================================
  //  GET /api/audit/stats
  // ========================================================
  test("deve retornar estatísticas de auditoria", async () => {
    getAuditStats.mockResolvedValue({
      total: 5,
      last24h: 2
    });

    const res = await request(app)
      .get("/api/audit/stats?startDate=2024-01-01&endDate=2024-01-31")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(getAuditStats).toHaveBeenCalledWith({
      startDate: "2024-01-01",
      endDate: "2024-01-31"
    });

    expect(res.body.total).toBe(5);
  });

  test("deve retornar 500 ao buscar estatísticas (erro interno)", async () => {
    getAuditStats.mockRejectedValue(new Error("STATS_FAIL"));

    const res = await request(app)
      .get("/api/audit/stats")
      .set("Authorization", `Bearer ${token}`)
      .expect(500);

    expect(res.body.message).toContain("Erro ao buscar estatísticas");
  });
});
