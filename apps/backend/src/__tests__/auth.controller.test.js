// apps/backend/src/__tests__/auth.controller.test.js

const { jest } = require('@jest/globals');

// Mocks dos serviços usados pelo controller
jest.mock('../modules/auth/auth.service', () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn()
}));

jest.mock('../modules/auth/password-reset.service', () => ({
  requestPasswordReset: jest.fn(),
  validateResetToken: jest.fn(),
  resetPassword: jest.fn()
}));

jest.mock('../prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    }
  }
}));

jest.mock('../utils/audit.helper', () => ({
  logAudit: jest.fn().mockResolvedValue()
}));

const { registerUser, loginUser } = require('../modules/auth/auth.service');
const {
  requestPasswordReset,
  validateResetToken,
  resetPassword
} = require('../modules/auth/password-reset.service');
const { prisma } = require('../prisma');
const { logAudit } = require('../utils/audit.helper');

const {
  postRegister,
  postLogin,
  getMe,
  postForgotPassword,
  getValidateResetToken,
  postResetPassword
} = require('../modules/auth/auth.controller');

describe('Auth Controller', () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  // ========== postRegister ==========
  describe('postRegister', () => {
    test('deve retornar 400 se email ou senha não forem enviados', async () => {
      const req = {
        body: { name: 'User sem senha', email: 'user@test.com' },
        user: null
      };

      await postRegister(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email e senha são obrigatórios'
      });
      expect(registerUser).not.toHaveBeenCalled();
    });

    test('deve registrar usuário via admin (req.user presente) e chamar logAudit', async () => {
      registerUser.mockResolvedValue({
        id: 1,
        name: 'Admin Created',
        email: 'admincreated@test.com',
        role: 'CLIENT_NORMAL'
      });

      const req = {
        body: {
          name: 'Admin Created',
          email: 'admincreated@test.com',
          password: '123456',
          role: 'CLIENT_NORMAL',
          companyId: 10,
          status: 'ACTIVE'
        },
        user: { id: 999, role: 'ACCOUNTING_SUPER' },
        userId: 999
      };

      await postRegister(req, res);

      expect(registerUser).toHaveBeenCalledWith(
        'Admin Created',
        'admincreated@test.com',
        '123456',
        'CLIENT_NORMAL',
        10,
        'ACTIVE',
        false // generateToken = !req.user
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          email: 'admincreated@test.com'
        })
      );
      expect(logAudit).toHaveBeenCalledWith(
        req,
        'CREATE',
        'User',
        1,
        expect.objectContaining({
          email: 'admincreated@test.com',
          role: 'CLIENT_NORMAL',
          companyId: 10
        })
      );
    });

    test('deve registrar usuário em auto-registro (sem req.user) sem chamar logAudit', async () => {
      registerUser.mockResolvedValue({
        id: 2,
        name: 'Auto User',
        email: 'auto@test.com',
        role: 'CLIENT_ADMIN'
      });

      const req = {
        body: {
          name: 'Auto User',
          email: 'auto@test.com',
          password: '123456',
          role: 'CLIENT_ADMIN'
        },
        user: null,
        userId: null
      };

      await postRegister(req, res);

      expect(registerUser).toHaveBeenCalledWith(
        'Auto User',
        'auto@test.com',
        '123456',
        'CLIENT_ADMIN',
        undefined,
        undefined,
        true // generateToken = !req.user
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(logAudit).not.toHaveBeenCalled();
    });

    test('deve retornar 409 se serviço lançar EMAIL_IN_USE', async () => {
      registerUser.mockRejectedValue(new Error('EMAIL_IN_USE'));

      const req = {
        body: {
          name: 'Duplicado',
          email: 'dup@test.com',
          password: '123456'
        },
        user: null
      };

      await postRegister(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email já cadastrado'
      });
    });

    test('deve retornar 500 em erro genérico', async () => {
      registerUser.mockRejectedValue(new Error('Erro qualquer'));

      const req = {
        body: {
          name: 'Erro',
          email: 'erro@test.com',
          password: '123456'
        },
        user: null
      };

      await postRegister(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Erro interno'
      });
    });
  });

  // ========== postLogin ==========
  describe('postLogin', () => {
    test('deve retornar 400 se email ou senha não forem enviados', async () => {
      const req = { body: { email: 'user@test.com' } };

      await postLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email e senha são obrigatórios'
      });
      expect(loginUser).not.toHaveBeenCalled();
    });

    test('deve logar com sucesso e chamar logAudit', async () => {
      loginUser.mockResolvedValue({
        token: 'fake-jwt',
        user: { id: 1, email: 'user@test.com', role: 'ACCOUNTING_SUPER' }
      });

      const req = {
        body: {
          email: 'user@test.com',
          password: '123456'
        }
      };

      await postLogin(req, res);

      expect(loginUser).toHaveBeenCalledWith('user@test.com', '123456');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: 'fake-jwt',
        user: expect.objectContaining({
          id: 1,
          email: 'user@test.com'
        })
      });
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'LOGIN',
          headers: { _auditSkipAuth: true }
        }),
        'LOGIN_SUCCESS',
        'User',
        1,
        expect.objectContaining({
          email: 'user@test.com',
          role: 'ACCOUNTING_SUPER'
        })
      );
    });

    test('deve retornar 401 se credenciais forem inválidas', async () => {
      loginUser.mockRejectedValue(new Error('INVALID_CREDENTIALS'));

      const req = {
        body: {
          email: 'user@test.com',
          password: 'wrong'
        }
      };

      await postLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Credenciais inválidas'
      });
    });

    test('deve retornar 403 se usuário estiver inativo', async () => {
      loginUser.mockRejectedValue(new Error('USER_INACTIVE'));

      const req = {
        body: {
          email: 'inactive@test.com',
          password: '123456'
        }
      };

      await postLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuário inativo'
      });
    });

    test('deve retornar 500 em erro genérico', async () => {
      loginUser.mockRejectedValue(new Error('Erro inesperado'));

      const req = {
        body: {
          email: 'user@test.com',
          password: '123456'
        }
      };

      await postLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Erro interno'
      });
    });
  });

  // ========== getMe ==========
  describe('getMe', () => {
    test('deve retornar dados do usuário logado', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        name: 'User Test',
        email: 'me@test.com',
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE',
        companyId: 10
      });

      const req = { userId: 1 };

      await getMe(req, res);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        name: 'User Test',
        email: 'me@test.com',
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE',
        companyId: 10
      });
    });

    test('deve retornar 404 se usuário não for encontrado', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const req = { userId: 999 };

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuário não encontrado'
      });
    });
  });

  // ========== postForgotPassword ==========
  describe('postForgotPassword', () => {
    test('deve retornar 400 se email não for enviado', async () => {
      const req = { body: {} };

      await postForgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email é obrigatório'
      });
      expect(requestPasswordReset).not.toHaveBeenCalled();
    });

    test('deve solicitar reset de senha com sucesso', async () => {
      requestPasswordReset.mockResolvedValue(undefined);

      const req = { body: { email: 'user@test.com' } };

      await postForgotPassword(req, res);

      expect(requestPasswordReset).toHaveBeenCalledWith('user@test.com');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Se o email existir e estiver ativo, enviaremos instruções de redefinição.'
      });
    });

    test('deve retornar 403 se serviço indicar usuário inativo', async () => {
      requestPasswordReset.mockRejectedValue(
        new Error('Usuário inativo na base')
      );

      const req = { body: { email: 'inactive@test.com' } };

      await postForgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuário inativo ou sem permissão para reset de senha'
      });
    });

    test('deve retornar 500 em erro genérico', async () => {
      requestPasswordReset.mockRejectedValue(new Error('Falha inesperada'));

      const req = { body: { email: 'user@test.com' } };

      await postForgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Erro interno'
      });
    });
  });

  // ========== getValidateResetToken ==========
  describe('getValidateResetToken', () => {
    test('deve retornar 400 se token não for fornecido', async () => {
      const req = { params: {} };

      await getValidateResetToken(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        valid: false,
        reason: 'Token não fornecido'
      });
    });

    test('deve validar token com sucesso', async () => {
      validateResetToken.mockResolvedValue({ userId: 1 });

      const req = { params: { token: 'valid-token' } };

      await getValidateResetToken(req, res);

      expect(validateResetToken).toHaveBeenCalledWith('valid-token');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        valid: true,
        userId: 1
      });
    });

    test('deve retornar 500 em erro de validação', async () => {
      validateResetToken.mockRejectedValue(new Error('Erro qualquer'));

      const req = { params: { token: 'invalid' } };

      await getValidateResetToken(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        valid: false,
        reason: 'Erro interno'
      });
    });
  });

  // ========== postResetPassword ==========
  describe('postResetPassword', () => {
    test('deve retornar 400 se token não for enviado', async () => {
      const req = { body: { newPassword: '123456' } };

      await postResetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token e nova senha são obrigatórios'
      });
    });

    test('deve retornar 400 se nova senha não for enviada', async () => {
      const req = { body: { token: 'abc' } };

      await postResetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token e nova senha são obrigatórios'
      });
    });

    test('deve redefinir senha com sucesso', async () => {
      resetPassword.mockResolvedValue(undefined);

      const req = {
        body: { token: 'valid-token', newPassword: 'nova-senha' }
      };

      await postResetPassword(req, res);

      expect(resetPassword).toHaveBeenCalledWith(
        'valid-token',
        'nova-senha'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Senha redefinida com sucesso'
      });
    });

    test('deve retornar 400 se serviço lançar erro de token/senha', async () => {
      resetPassword.mockRejectedValue(
        new Error('Token inválido ou expirado')
      );

      const req = {
        body: { token: 'invalid', newPassword: 'nova' }
      };

      await postResetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token inválido ou senha inválida'
      });
    });

    test('deve retornar 500 em erro genérico', async () => {
      resetPassword.mockRejectedValue(new Error('Erro inesperado'));

      const req = {
        body: { token: 't', newPassword: 'nova' }
      };

      await postResetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Erro interno'
      });
    });
  });
});
