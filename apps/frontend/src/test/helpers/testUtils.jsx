import { vi } from 'vitest';

// Mock do AuthContext para testes
export const createMockAuthContext = (user = null, token = null) => {
  return {
    user,
    token,
    isAuthenticated: !!token,
    logout: vi.fn(),
    login: vi.fn(),
    isAccounting: user?.role?.startsWith('ACCOUNTING_') || false,
    isClient: user?.role?.startsWith('CLIENT_') || false
  };
};

// Mock do useAuth
export const mockUseAuth = (authContext) => {
  vi.mock('../../shared/context/AuthContext', () => ({
    useAuth: () => authContext
  }));
};

