import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthController } from '../useAuthController';
import * as authApi from '../../data/auth.api';

vi.mock('../../data/auth.api', () => ({
  login: vi.fn(),
  register: vi.fn(),
  forgotPassword: vi.fn(),
  validateResetToken: vi.fn(),
  resetPassword: vi.fn()
}));

describe('useAuthController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com loading false e err null', () => {
    const { result } = renderHook(() => useAuthController());

    expect(result.current.loading).toBe(false);
    expect(result.current.err).toBe(null);
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const { result } = renderHook(() => useAuthController());
      const mockData = { token: 'token', user: { id: '1' } };
      authApi.login.mockResolvedValue({ data: mockData });

      let response;
      await act(async () => {
        response = await result.current.login({
          email: 'test@test.com',
          password: 'password'
        });
      });

      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password'
      });
      expect(response).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.err).toBe(null);
    });

    it('deve tratar erro no login', async () => {
      const { result } = renderHook(() => useAuthController());
      const error = {
        response: { data: { message: 'Credenciais inválidas' } }
      };
      authApi.login.mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.login({ email: 'test@test.com', password: 'wrong' });
        } catch (e) {
          // Esperado
        }
      });

      expect(result.current.err).toBe('Credenciais inválidas');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('register', () => {
    it('deve registrar com sucesso', async () => {
      const { result } = renderHook(() => useAuthController());
      const mockData = { token: 'token', user: { id: '1' } };
      authApi.register.mockResolvedValue({ data: mockData });

      let response;
      await act(async () => {
        response = await result.current.register({
          name: 'Test User',
          email: 'test@test.com',
          password: 'password'
        });
      });

      expect(authApi.register).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password'
      });
      expect(response).toEqual(mockData);
    });
  });

  describe('forgotPassword', () => {
    it('deve enviar email de recuperação', async () => {
      const { result } = renderHook(() => useAuthController());
      authApi.forgotPassword.mockResolvedValue({ data: { message: 'Email enviado' } });

      await act(async () => {
        await result.current.forgotPassword({ email: 'test@test.com' });
      });

      expect(authApi.forgotPassword).toHaveBeenCalledWith({ email: 'test@test.com' });
    });
  });

  describe('validateResetToken', () => {
    it('deve validar token com sucesso', async () => {
      const { result } = renderHook(() => useAuthController());
      authApi.validateResetToken.mockResolvedValue({ data: { valid: true } });

      let response;
      await act(async () => {
        response = await result.current.validateResetToken('token-123');
      });

      expect(authApi.validateResetToken).toHaveBeenCalledWith('token-123');
      expect(response).toEqual({ valid: true });
    });

    it('deve tratar token inválido', async () => {
      const { result } = renderHook(() => useAuthController());
      const error = {
        response: { data: { reason: 'Token expirado' } }
      };
      authApi.validateResetToken.mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.validateResetToken('invalid-token');
        } catch (e) {
          // Esperado
        }
      });

      expect(result.current.err).toBe('Token expirado');
    });
  });

  describe('resetPassword', () => {
    it('deve redefinir senha com sucesso', async () => {
      const { result } = renderHook(() => useAuthController());
      authApi.resetPassword.mockResolvedValue({ data: { message: 'Senha redefinida' } });

      await act(async () => {
        await result.current.resetPassword({
          token: 'token-123',
          newPassword: 'newpassword'
        });
      });

      expect(authApi.resetPassword).toHaveBeenCalledWith({
        token: 'token-123',
        newPassword: 'newpassword'
      });
    });
  });

  it('deve permitir setErr manual', () => {
    const { result } = renderHook(() => useAuthController());

    act(() => {
      result.current.setErr('Erro manual');
    });

    expect(result.current.err).toBe('Erro manual');
  });
});

