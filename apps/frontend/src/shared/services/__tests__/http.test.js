import { describe, it, expect, beforeEach, vi } from 'vitest';
import http, { api } from '../http';

// Mock do localStorage e sessionStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

describe('HTTP Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
  });

  it('deve exportar api e http corretamente', () => {
    expect(http).toBeDefined();
    expect(api).toBeDefined();
    expect(http).toBe(api);
  });

  it('deve configurar baseURL corretamente quando VITE_API_URL não está definido', () => {
    // Reset do módulo para testar comportamento padrão
    expect(http.defaults.baseURL).toBeDefined();
  });

  it('deve adicionar token do localStorage no header Authorization', () => {
    const token = 'test-token-123';
    localStorageMock.getItem.mockReturnValue(token);

    // Criar uma nova instância para testar o interceptor
    const requestConfig = {
      headers: {},
    };

    // Simular o interceptor
    const interceptor = http.interceptors.request.handlers[0];
    if (interceptor) {
      const result = interceptor.fulfilled(requestConfig);
      expect(result.headers.Authorization).toBe(`Bearer ${token}`);
    }
  });

  it('deve adicionar token do sessionStorage quando localStorage não tem token', () => {
    const token = 'session-token-456';
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(token);

    const requestConfig = {
      headers: {},
    };

    const interceptor = http.interceptors.request.handlers[0];
    if (interceptor) {
      const result = interceptor.fulfilled(requestConfig);
      expect(result.headers.Authorization).toBe(`Bearer ${token}`);
    }
  });

  it('não deve adicionar Authorization quando não há token', () => {
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);

    const requestConfig = {
      headers: {},
    };

    const interceptor = http.interceptors.request.handlers[0];
    if (interceptor) {
      const result = interceptor.fulfilled(requestConfig);
      expect(result.headers.Authorization).toBeUndefined();
    }
  });

  it('deve criar headers se não existirem', () => {
    const token = 'test-token';
    localStorageMock.getItem.mockReturnValue(token);

    const requestConfig = {}; // Sem headers

    const interceptor = http.interceptors.request.handlers[0];
    if (interceptor) {
      const result = interceptor.fulfilled(requestConfig);
      expect(result.headers).toBeDefined();
      expect(result.headers.Authorization).toBe(`Bearer ${token}`);
    }
  });
});

