const { registerUser, loginUser } = require('../modules/auth/auth.service');
const { prisma } = require('../prisma');
const bcrypt = require('bcryptjs');

describe('Auth Service', () => {
  afterAll(async () => {
    // Limpa usuários criados nos testes
    await prisma.user.deleteMany();
  });

  describe('registerUser', () => {
    test('deve registrar novo usuário com token gerado (padrão)', async () => {
      const timestamp = Date.now();
      const email = `user${timestamp}@register.com`;

      const result = await registerUser(
        'Test User',
        email,
        'password123',
        'CLIENT_NORMAL',
        null,
        'ACTIVE',    // status
        true         // generateToken
      );

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(email);
      expect(result.user.role).toBe('CLIENT_NORMAL');
      expect(result.user.status).toBe('ACTIVE');
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
    });

    test('não deve registrar usuário com email duplicado (EMAIL_IN_USE)', async () => {
      const email = `duplicate-${Date.now()}@test.com`;

      // cria o primeiro usuário
      await registerUser(
        'First User',
        email,
        'password123',
        'CLIENT_NORMAL',
        null,
        'ACTIVE',
        true
      );

      // tentativa de criar usuário com o mesmo email
      await expect(
        registerUser(
          'Second User',
          email,
          'password123',
          'CLIENT_NORMAL',
          null,
          'ACTIVE',
          true
        )
      ).rejects.toThrow('EMAIL_IN_USE');
    });

    test('deve registrar usuário sem gerar token quando generateToken é false', async () => {
      const timestamp = Date.now();
      const email = `notoken${timestamp}@test.com`;

      const result = await registerUser(
        'User No Token',
        email,
        'password123',
        'CLIENT_NORMAL',
        null,
        'ACTIVE',
        false // generateToken = false
      );

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(email);
      expect(result.token).toBeUndefined();
    });

    test('deve converter companyId string para inteiro ao registrar usuário', async () => {
      const timestamp = Date.now();
      const email = `company${timestamp}@test.com`;

      const result = await registerUser(
        'User With Company',
        email,
        'password123',
        'CLIENT_NORMAL',
        '123',   // companyId em string
        'ACTIVE',
        false    // não precisa de token aqui
      );

      expect(result.user).toBeDefined();
      expect(result.user.companyId).toBe(123);
    });
  });

  describe('loginUser', () => {
    test('deve fazer login com credenciais válidas', async () => {
      const timestamp = Date.now();
      const email = `login${timestamp}@test.com`;
      const password = 'password123';

      // cria o usuário antes de logar
      await registerUser(
        'Login User',
        email,
        password,
        'CLIENT_NORMAL',
        null,
        'ACTIVE',
        false // não precisamos do token neste momento
      );

      const result = await loginUser(email, password);

      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(email);
      expect(result.user.status).toBe('ACTIVE');
    });

    test('não deve fazer login com email inexistente (INVALID_CREDENTIALS)', async () => {
      await expect(
        loginUser('naoexiste@test.com', 'qualquercoisa')
      ).rejects.toThrow('INVALID_CREDENTIALS');
    });

    test('não deve fazer login com senha incorreta (INVALID_CREDENTIALS)', async () => {
      const timestamp = Date.now();
      const email = `wrongpass${timestamp}@test.com`;
      const password = 'password123';

      await registerUser(
        'Wrong Pass User',
        email,
        password,
        'CLIENT_NORMAL',
        null,
        'ACTIVE',
        false
      );

      await expect(
        loginUser(email, 'senha-errada')
      ).rejects.toThrow('INVALID_CREDENTIALS');
    });

    test('não deve fazer login com usuário inativo (USER_INACTIVE)', async () => {
      const timestamp = Date.now();
      const email = `inactive${timestamp}@test.com`;
      const password = 'password123';

      // cria usuário já inativo
      await registerUser(
        'Inactive User',
        email,
        password,
        'CLIENT_NORMAL',
        null,
        'INACTIVE',
        false
      );

      await expect(
        loginUser(email, password)
      ).rejects.toThrow('USER_INACTIVE');
    });
  });
});
