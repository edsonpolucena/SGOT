const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../app');
const { prisma } = require('../prisma');
const { env } = require('../config/env');

describe('JWT Middleware Tests', () => {
  let validToken;
  let expiredToken;
  let invalidToken;
  let testUser;

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: {
        email: 'jwt-test@example.com',
        passwordHash: 'hashed-password',
        name: 'JWT Test User',
        role: 'ACCOUNTING'
      }
    });

    validToken = jwt.sign(
      { sub: testUser.id, email: testUser.email },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    expiredToken = jwt.sign(
      { sub: testUser.id, email: testUser.email },
      env.JWT_SECRET,
      { expiresIn: '-1h' } 
    );

    invalidToken = jwt.sign(
      { sub: testUser.id, email: testUser.email },
      'wrong-secret-key',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.user.deleteMany({
      where: { email: 'jwt-test@example.com' }
    });
    await prisma.$disconnect();
  });

  describe('Token válido', () => {
    it('deve permitir acesso com token válido', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', testUser.id);
      expect(res.body).toHaveProperty('email', testUser.email);
      expect(res.body).toHaveProperty('name', testUser.name);
      expect(res.body).toHaveProperty('role', testUser.role);
    });

    it('deve permitir acesso a rotas protegidas com token válido', async () => {
      const res = await request(app)
        .get('/api/obligations')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Token inválido', () => {
    it('deve rejeitar token assinado com chave incorreta', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Invalid token');
    });

    it('deve rejeitar token malformado', async () => {
      const malformedToken = 'invalid.jwt.token';
      
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${malformedToken}`)
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Invalid token');
    });

    it('deve rejeitar token com formato incorreto', async () => {
      const wrongFormatToken = 'not-a-jwt-token';
      
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${wrongFormatToken}`)
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Invalid token');
    });
  });

  describe('Token expirado', () => {
    it('deve rejeitar token expirado', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Invalid token');
    });
  });

  describe('Token ausente', () => {
    it('deve rejeitar requisição sem token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Missing token');
    });

    it('deve rejeitar requisição com header Authorization vazio', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', '')
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Missing token');
    });

    it('deve rejeitar requisição sem prefixo Bearer', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', validToken)
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Missing token');
    });

    it('deve rejeitar requisição com prefixo Bearer incorreto', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Token ${validToken}`)
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Missing token');
    });
  });

  describe('Usuário não encontrado', () => {
    it('deve rejeitar token válido de usuário que não existe mais', async () => {
      const deletedUserToken = jwt.sign(
        { sub: 'non-existent-user-id', email: 'deleted@example.com' },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${deletedUserToken}`)
        .expect(401);

      expect(res.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('Diferentes rotas protegidas', () => {
    it('deve proteger rota de obrigações', async () => {
      const res = await request(app)
        .get('/api/obligations')
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Missing token');
    });

    it('deve proteger rota de empresas', async () => {
      const res = await request(app)
        .get('/api/empresas')
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Missing token');
    });

    it('deve permitir acesso a rota de saúde sem autenticação', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body).toEqual({ ok: true });
    });

    it('deve permitir acesso a rotas de auth sem autenticação', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(401); // 401 porque credenciais são inválidas, mas não por falta de token

      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('Informações do usuário no request', () => {
    it('deve adicionar userId e user ao request com token válido', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(res.body.id).toBe(testUser.id);
    });
  });
});
