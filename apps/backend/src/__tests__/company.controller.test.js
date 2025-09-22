const request = require("supertest");
const {app} = require("../app");
const { prisma } = require("../prisma");

jest.mock("../prisma", () => ({
  prisma: {
    empresa: {
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

describe("CompanyController", () => {
  afterEach(() => jest.clearAllMocks());

  test("deve criar empresa", async () => {
    prisma.empresa.create.mockResolvedValue({ id: 1, nome: "Empresa X" });

    const res = await request(app)
      .post("/api/empresas")
      .send({ 
        codigo: "EMP001",
        nome: "Empresa X", 
        cnpj: "12.345.678/0001-90" 
      });

    expect(res.status).toBe(201);
    expect(res.body.nome).toBe("Empresa X");
  });

  test("deve listar empresas", async () => {
    prisma.empresa.findMany.mockResolvedValue([
      { id: 1, nome: "Empresa X" },
      { id: 2, nome: "Empresa Y" },
    ]);

    const res = await request(app).get("/api/empresas");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});
