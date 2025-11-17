const bcrypt = require('bcrypt');

const mockUserFindUnique = jest.fn();
const mockPasswordResetTokenCreate = jest.fn();
const mockPasswordResetTokenFindUnique = jest.fn();
const mockPasswordResetTokenDeleteMany = jest.fn();
const mockUserUpdate = jest.fn();
const mockTransaction = jest.fn();

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn(() => ({
      user: {
        findUnique: mockUserFindUnique,
        update: mockUserUpdate
      },
      passwordResetToken: {
        create: mockPasswordResetTokenCreate,
        findUnique: mockPasswordResetTokenFindUnique,
        deleteMany: mockPasswordResetTokenDeleteMany
      },
      $transaction: mockTransaction
    }))
  };
});

const mockSendPasswordResetEmail = jest.fn();
const mockSendPasswordChangedConfirmation = jest.fn();

jest.mock('../services/email.service', () => ({
  sendPasswordResetEmail: (...args) => mockSendPasswordResetEmail(...args),
  sendPasswordChangedConfirmation: (...args) => mockSendPasswordChangedConfirmation(...args)
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn()
}));

const {
  requestPasswordReset,
  validateResetToken,
  resetPassword,
  cleanExpiredTokens
} = require('../modules/auth/password-reset.service');

describe('password-reset.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPasswordReset', () => {
    it('deve retornar sucesso mesmo quando usuário não existe', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const result = await requestPasswordReset('naoexiste@test.com');

      expect(mockUserFindUnique).toHaveBeenCalledWith({ where: { email: 'naoexiste@test.com' } });
      expect(mockPasswordResetTokenCreate).not.toHaveBeenCalled();
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ success: true }));
    });

    it('deve lançar erro para usuário inativo', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        status: 'INACTIVE'
      });

      await expect(requestPasswordReset('user@test.com'))
        .rejects.toThrow('Usuário inativo. Contate o administrador.');
    });

    it('deve criar token e enviar email para usuário ativo', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        name: 'User',
        status: 'ACTIVE'
      });

      mockPasswordResetTokenCreate.mockResolvedValue({ id: 'token-1' });
      mockSendPasswordResetEmail.mockResolvedValue({ success: true });

      const result = await requestPasswordReset('user@test.com');

      expect(mockPasswordResetTokenCreate).toHaveBeenCalledTimes(1);
      expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expect.objectContaining({ success: true }));
    });
  });

  describe('validateResetToken', () => {
    it('deve retornar inválido quando token não existe', async () => {
      mockPasswordResetTokenFindUnique.mockResolvedValue(null);

      const result = await validateResetToken('token-invalido');
      expect(result).toEqual({ valid: false, reason: 'Token inválido' });
    });

    it('deve detectar token já utilizado', async () => {
      mockPasswordResetTokenFindUnique.mockResolvedValue({
        token: 'token-1',
        used: true,
        expiresAt: new Date(Date.now() + 3600000),
        user: { status: 'ACTIVE', email: 'user@test.com' }
      });

      const result = await validateResetToken('token-1');
      expect(result).toEqual({ valid: false, reason: 'Token já foi utilizado' });
    });

    it('deve detectar token expirado', async () => {
      mockPasswordResetTokenFindUnique.mockResolvedValue({
        token: 'token-1',
        used: false,
        expiresAt: new Date(Date.now() - 3600000),
        user: { status: 'ACTIVE', email: 'user@test.com' }
      });

      const result = await validateResetToken('token-1');
      expect(result).toEqual({ valid: false, reason: 'Token expirado' });
    });

    it('deve detectar usuário inativo', async () => {
      mockPasswordResetTokenFindUnique.mockResolvedValue({
        token: 'token-1',
        used: false,
        expiresAt: new Date(Date.now() + 3600000),
        user: { status: 'INACTIVE', email: 'user@test.com' }
      });

      const result = await validateResetToken('token-1');
      expect(result).toEqual({ valid: false, reason: 'Usuário inativo' });
    });

    it('deve retornar token válido com email mascarado', async () => {
      mockPasswordResetTokenFindUnique.mockResolvedValue({
        token: 'token-1',
        used: false,
        expiresAt: new Date(Date.now() + 3600000),
        user: { status: 'ACTIVE', email: 'user@test.com' }
      });

      const result = await validateResetToken('token-1');
      expect(result.valid).toBe(true);
      expect(result.email).toBe('u***@test.com');
    });
  });

  describe('resetPassword', () => {
    it('deve redefinir senha com sucesso e enviar email de confirmação', async () => {
      // Mock para validateResetToken - primeiro findUnique com include user
      mockPasswordResetTokenFindUnique
        .mockResolvedValueOnce({
          id: 'reset-1',
          token: 'token-1',
          userId: 'user-1',
          used: false,
          expiresAt: new Date(Date.now() + 3600000),
          user: { status: 'ACTIVE', email: 'user@test.com' }
        })
        // Mock para o segundo findUnique dentro de resetPassword (sem include)
        .mockResolvedValueOnce({
          id: 'reset-1',
          userId: 'user-1'
        });

      bcrypt.hash.mockResolvedValue('hashed-password');

      mockTransaction.mockResolvedValue(true);

      mockUserFindUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        name: 'User'
      });

      const result = await resetPassword('token-1', 'novaSenha123');

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockSendPasswordChangedConfirmation).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expect.objectContaining({ success: true }));
    });
  });

  describe('cleanExpiredTokens', () => {
    it('deve deletar tokens expirados ou usados e retornar quantidade', async () => {
      mockPasswordResetTokenDeleteMany.mockResolvedValue({ count: 5 });

      const result = await cleanExpiredTokens();

      expect(mockPasswordResetTokenDeleteMany).toHaveBeenCalledTimes(1);
      expect(result).toBe(5);
    });
  });
});


