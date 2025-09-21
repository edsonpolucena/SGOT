const request = require("supertest");
const { app } = require("../app");
const { prisma } = require("../prisma");
const bcrypt = require("bcryptjs");

async function authToken() {
  const email = "inttest@teste.com";
  const password = "123456";

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { 
      email, 
      passwordHash: hash,
      name: "Test User",
      role: "ACCOUNTING"
    },
  });

  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.token;
}

describe("Obligations CRUD", () => {
  let token;
  let company;

  beforeAll(async () => {

    company = await prisma.empresa.create({
      data: { 
        codigo: "TEST001",
        nome: "Empresa Teste", 
        cnpj: "12.345.678/0001-90" 
      },
    });

    token = await authToken();
  });

  afterAll(async () => {
    await prisma.obligation.deleteMany({});
    await prisma.empresa.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it("creates and lists obligations", async () => {
    const payload = {
      title: "DAS 05/2025",
      regime: "SIMPLES",
      periodStart: "2025-05-01",
      periodEnd: "2025-05-31",
      dueDate: "2025-06-10",
      companyId: company.id,
      amount: 500,
      notes: "teste int",
    };

    await request(app)
      .post("/api/obligations")
      .set("Authorization", `Bearer ${token}`)
      .send(payload)
      .expect(201);

    const list = await request(app)
      .get("/api/obligations")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBeGreaterThan(0);
  });
});
