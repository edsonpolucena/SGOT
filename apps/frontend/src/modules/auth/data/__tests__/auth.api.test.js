import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as authApi from '../auth.api';
import api from '../../../../shared/services/http.js';

vi.mock('../../../../shared/services/http.js', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn()
  }
}));

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('deve fazer POST para /api/auth/login', async () => {
      const mockResponse = { data: { token: 'test-token', user: { id: '1' } } };
      api.post.mockResolvedValue(mockResponse);

      const result = await authApi.login({ email: 'test@test.com', password: 'password' });

      expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@test.com',
        password: 'password'
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('register', () => {
    it('deve fazer POST para /api/auth/register', async () => {
      const mockResponse = { data: { token: 'token', user: { id: '1' } } };
      api.post.mockResolvedValue(mockResponse);

      const result = await authApi.register({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password'
      });

      expect(api.post).toHaveBeenCalledWith('/api/auth/register', {
        name: 'Test User',
        email: 'test@test.com',
        password: 'password'
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('forgotPassword', () => {
    it('deve fazer POST para /api/auth/forgot-password', async () => {
      const mockResponse = { data: { message: 'Email enviado' } };
      api.post.mockResolvedValue(mockResponse);

      const result = await authApi.forgotPassword({ email: 'test@test.com' });

      expect(api.post).toHaveBeenCalledWith('/api/auth/forgot-password', {
        email: 'test@test.com'
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('validateResetToken', () => {
    it('deve fazer GET para /api/auth/validate-reset-token/:token', async () => {
      const mockResponse = { data: { valid: true } };
      api.get.mockResolvedValue(mockResponse);

      const result = await authApi.validateResetToken('test-token');

      expect(api.get).toHaveBeenCalledWith('/api/auth/validate-reset-token/test-token');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('resetPassword', () => {
    it('deve fazer POST para /api/auth/reset-password', async () => {
      const mockResponse = { data: { message: 'Senha redefinida' } };
      api.post.mockResolvedValue(mockResponse);

      const result = await authApi.resetPassword({
        token: 'test-token',
        newPassword: 'newpassword'
      });

      expect(api.post).toHaveBeenCalledWith('/api/auth/reset-password', {
        token: 'test-token',
        newPassword: 'newpassword'
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('me', () => {
    it('deve fazer GET para /api/auth/me', async () => {
      const mockResponse = { data: { id: '1', email: 'test@test.com' } };
      api.get.mockResolvedValue(mockResponse);

      const result = await authApi.me();

      expect(api.get).toHaveBeenCalledWith('/api/auth/me');
      expect(result).toEqual(mockResponse);
    });
  });
});

