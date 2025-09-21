const request = require("supertest");
const {app} = require("../app");
const { prisma } = require("../prisma");

jest.mock("../prisma", () => ({
  prisma: {
    obligation: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock("../middleware/requireAuth", () => ({
  requireAuth: (_req, _res, next) => {
    _req.userId = "test-user-id";
    _req.user = { role: "ACCOUNTING" };
    next();
  },
}));

describe("ObligationController", () => {
  afterEach(() => jest.clearAllMocks());

  test("deve criar obrigação", async () => {
    prisma.obligation.create.mockResolvedValue({
      id: 1,
      title: "DAS 08/2025",
      status: "PENDING",
    });

    const payload = {
      title: "DAS 08/2025",
      regime: "SIMPLES",
      periodStart: "2025-08-01",
      periodEnd: "2025-08-31",
      dueDate: "2025-09-10",
      companyId: 1,
      amount: 1000,
      notes: "Teste automatizado",
    };

    const res = await request(app).post("/api/obligations").send(payload);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("DAS 08/2025");
  });

  test("deve listar obrigações", async () => {
    prisma.obligation.findMany.mockResolvedValue([
      { id: 1, title: "DAS 08/2025" },
      { id: 2, title: "ISS 08/2025" },
    ]);

    const res = await request(app).get("/api/obligations");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});
