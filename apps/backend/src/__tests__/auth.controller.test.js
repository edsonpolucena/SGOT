const request = require("supertest");
const {app} = require("../app");
const { prisma } = require("../prisma");

jest.mock("../prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("fake-jwt-token"),
}));

describe("AuthController", () => {
  afterEach(() => jest.clearAllMocks());

  test("deve registrar um usuário novo", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ 
      id: "user-id", 
      email: "teste@teste.com",
      name: "Test User",
      role: "CLIENT_NORMAL"
    });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ 
        email: "teste@teste.com", 
        password: "123456",
        name: "Test User"
      });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("teste@teste.com");
  });

  test("não deve registrar usuário existente", async () => {
    prisma.user.findUnique.mockResolvedValue({ 
      id: "user-id", 
      email: "teste@teste.com" 
    });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ 
        email: "teste@teste.com", 
        password: "123456",
        name: "Test User"
      });

    expect(res.status).toBe(409);
  });

  test("deve logar usuário válido", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-id",
      email: "teste@teste.com",
      passwordHash: "$2b$10$fakehash",
      name: "Test User",
      role: "CLIENT_NORMAL"
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "teste@teste.com", password: "123456" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user");
  });
});
