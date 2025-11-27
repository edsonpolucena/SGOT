import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import http from '../../services/http';

// Mock do http service
vi.mock('../../services/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

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
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Componente de teste para usar o hook
function TestComponent() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="token">{auth.token || 'no-token'}</div>
      <div data-testid="user">{auth.user ? JSON.stringify(auth.user) : 'no-user'}</div>
      <div data-testid="isAccounting">{auth.isAccounting ? 'true' : 'false'}</div>
      <div data-testid="isClient">{auth.isClient ? 'true' : 'false'}</div>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
  });

  it('deve fornecer valores padrão quando não há token', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('token')).toHaveTextContent('no-token');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it('deve carregar token do localStorage', () => {
    const token = 'test-token-123';
    localStorageMock.getItem.mockReturnValue(token);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('token')).toHaveTextContent(token);
  });

  it('deve carregar token do sessionStorage quando localStorage não tem', () => {
    const token = 'session-token-456';
    sessionStorageMock.getItem.mockReturnValue(token);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('token')).toHaveTextContent(token);
  });

  it('deve buscar dados do usuário quando há token', async () => {
    const token = 'valid-token';
    const userData = { id: '1', email: 'test@test.com', role: 'ACCOUNTING_SUPER' };
    
    localStorageMock.getItem.mockReturnValue(token);
    http.get.mockResolvedValue({ data: userData });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(http.get).toHaveBeenCalledWith('/api/auth/me');
    });

    await waitFor(() => {
      const userElement = screen.getByTestId('user');
      expect(userElement.textContent).toContain('test@test.com');
    });
  });

  it('deve fazer logout quando a requisição /auth/me falha', async () => {
    const token = 'invalid-token';
    localStorageMock.getItem.mockReturnValue(token);
    http.get.mockRejectedValue(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('token');
    });
  });

  it('deve fazer login e salvar token no localStorage quando remember é true', async () => {
    const loginData = {
      token: 'new-token',
      user: { id: '1', email: 'user@test.com', role: 'CLIENT_NORMAL' },
    };
    http.post.mockResolvedValue({ data: loginData });

    let loginFn;
    function LoginTestComponent() {
      const auth = useAuth();
      loginFn = auth.login;
      return <div data-testid="test">Test</div>;
    }

    render(
      <AuthProvider>
        <LoginTestComponent />
      </AuthProvider>
    );

    await loginFn({ email: 'user@test.com', password: 'password', remember: true });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'new-token');
    expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('deve fazer login e salvar token no sessionStorage quando remember é false', async () => {
    const loginData = {
      token: 'session-token',
      user: { id: '1', email: 'user@test.com', role: 'CLIENT_NORMAL' },
    };
    http.post.mockResolvedValue({ data: loginData });

    let loginFn;
    function LoginTestComponent() {
      const auth = useAuth();
      loginFn = auth.login;
      return <div data-testid="test">Test</div>;
    }

    render(
      <AuthProvider>
        <LoginTestComponent />
      </AuthProvider>
    );

    await loginFn({ email: 'user@test.com', password: 'password', remember: false });

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('token', 'session-token');
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('deve fazer logout corretamente', () => {
    const token = 'test-token';
    localStorageMock.getItem.mockReturnValue(token);

    let logoutFn;
    function LogoutTestComponent() {
      const auth = useAuth();
      logoutFn = auth.logout;
      return <div data-testid="test">Test</div>;
    }

    render(
      <AuthProvider>
        <LogoutTestComponent />
      </AuthProvider>
    );

    logoutFn();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('token');
  });

  it('deve identificar role ACCOUNTING corretamente', async () => {
    const token = 'token';
    const userData = { id: '1', email: 'admin@test.com', role: 'ACCOUNTING_SUPER' };
    
    localStorageMock.getItem.mockReturnValue(token);
    http.get.mockResolvedValue({ data: userData });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isAccounting')).toHaveTextContent('true');
      expect(screen.getByTestId('isClient')).toHaveTextContent('false');
    });
  });

  it('deve identificar role CLIENT corretamente', async () => {
    const token = 'token';
    const userData = { id: '1', email: 'client@test.com', role: 'CLIENT_NORMAL' };
    
    localStorageMock.getItem.mockReturnValue(token);
    http.get.mockResolvedValue({ data: userData });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isClient')).toHaveTextContent('true');
      expect(screen.getByTestId('isAccounting')).toHaveTextContent('false');
    });
  });
});

