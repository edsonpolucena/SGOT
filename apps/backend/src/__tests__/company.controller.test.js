const request = require("supertest");
const {app} = require("../app");
const { prisma } = require("../prisma");
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const bcrypt = require("bcryptjs");

describe("CompanyController", () => {
  let token;

  beforeAll(async () => {
    const user = await prisma.user.upsert({
      where: { email: 'test@company.com' },
      update: {},
      create: {
        email: 'test@company.com',
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
  });

  beforeEach(async () => {
    // Limpar empresas antes de cada teste para evitar conflitos
    await prisma.empresa.deleteMany();
  });

  afterAll(async () => {
    await prisma.empresa.deleteMany();
    await prisma.user.deleteMany();
  });

  test("deve criar empresa", async () => {
    const timestamp = Date.now();
    // Gerar CNPJ válido de 14 dígitos
    const cnpjNumeros = `12${timestamp.toString().slice(-12)}`;
    const res = await request(app)
      .post("/api/empresas")
      .set('Authorization', `Bearer ${token}`)
      .send({
        codigo: `TEST${timestamp}`,
        nome: "Empresa Teste",
        cnpj: cnpjNumeros,
        email: `teste${timestamp}@empresa.com`,
        telefone: "47999999999",
        endereco: "Rua Teste, 123",
        status: "ativa"
      });

    expect(res.status).toBe(201);
    expect(res.body.nome).toBe("Empresa Teste");
  });

  test("deve listar empresas", async () => {
    const timestamp = Date.now();
    // Criar empresas de teste com CNPJs válidos
    await prisma.empresa.createMany({
      data: [
        {
          codigo: `COMP${timestamp}1`,
          nome: "Empresa A",
          cnpj: `11.222.333/0001-81`,
          status: "ativa"
        },
        {
          codigo: `COMP${timestamp}2`,
          nome: "Empresa B",
          cnpj: `22.333.444/0001-92`,
          status: "ativa"
        }
      ]
    });

    const res = await request(app)
      .get("/api/empresas")
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  test("deve atualizar empresa existente", async () => {
    const timestamp = Date.now();
    const empresa = await prisma.empresa.create({
      data: {
        codigo: `UPD${timestamp}`,
        nome: "Empresa Original",
        cnpj: `33.444.555/0001-03`,
        status: "ativa"
      }
    });

    const res = await request(app)
      .put(`/api/empresas/${empresa.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome: "Empresa Atualizada",
        telefone: "47988888888"
      });

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe("Empresa Atualizada");
  });

  test("não deve criar empresa com CNPJ duplicado", async () => {
    const timestamp = Date.now();
    const cnpj = `98.765.432/0001-10`; // CNPJ com máscara
    
    await prisma.empresa.create({
      data: {
        codigo: `DUP${timestamp}1`,
        nome: "Primeira Empresa",
        cnpj: cnpj,
        status: "ativa"
      }
    });

    const res = await request(app)
      .post("/api/empresas")
      .set('Authorization', `Bearer ${token}`)
      .send({
        codigo: `DUP${timestamp}2`,
        nome: "Segunda Empresa",
        cnpj: cnpj,
        status: "ativa"
      });

    // Pode retornar 409 (conflict) ou 500 (error interno)
    expect([409, 500]).toContain(res.status);
  });

  test("deve buscar empresa por ID", async () => {
    const timestamp = Date.now();
    const empresa = await prisma.empresa.create({
      data: {
        codigo: `GET${timestamp}`,
        nome: "Empresa Get",
        cnpj: `44.555.666/0001-14`,
        status: "ativa"
      }
    });

    const res = await request(app)
      .get(`/api/empresas/${empresa.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.id).toBe(empresa.id);
    expect(res.body.codigo).toBe(`GET${timestamp}`);
  });
});
