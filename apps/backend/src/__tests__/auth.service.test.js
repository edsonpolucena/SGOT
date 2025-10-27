const {
  registerUser,
  loginUser,
  forgotPassword
} = require('../modules/auth/auth.service');
const { prisma } = require('../prisma');
const bcrypt = require('bcryptjs');

describe('Auth Service', () => {
  afterAll(async () => {
    await prisma.user.deleteMany();
  });

  describe('registerUser', () => {
    test('deve registrar novo usuário', async () => {
      const timestamp = Date.now();
      const result = await registerUser(
        'Test User',
        `test${timestamp}@register.com`,
        'password123',
        'CLIENT_NORMAL',
        null,
        'ACTIVE',
        true
      );

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(`test${timestamp}@register.com`);
    });

    test('não deve registrar usuário com email duplicado', async () => {
      // Criar primeiro usuário
      await registerUser('Test', 'duplicate@test.com', 'password', 'CLIENT_NORMAL', null, 'ACTIVE', true);
      
      // Tentar criar duplicado
      await expect(
        registerUser('Test', 'duplicate@test.com', 'password', 'CLIENT_NORMAL', null, 'ACTIVE', true)
      ).rejects.toThrow();
    });
  });

  describe('loginUser', () => {
    test('deve fazer login com credenciais válidas', async () => {
      const timestamp = Date.now();
      await registerUser('Login Test', `login${timestamp}@test.com`, 'password123', 'CLIENT_NORMAL', null, 'ACTIVE', true);
      
      const result = await loginUser(`login${timestamp}@test.com`, 'password123');
      
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
    });

    test('não deve fazer login com credenciais inválidas', async () => {
      await expect(loginUser('invalid@test.com', 'wrongpassword'))
        .rejects.toThrow('INVALID_CREDENTIALS');
    });
  });
});
