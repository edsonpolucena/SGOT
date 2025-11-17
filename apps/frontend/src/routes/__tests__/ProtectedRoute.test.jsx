import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute, { UsersProtectedRoute } from '../ProtectedRoute';

const mockUseAuth = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../shared/context/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }) => <div data-testid="redirect">Redirecting to {to}</div>,
    useNavigate: () => mockNavigate
  };
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar children se autenticado', () => {
    mockUseAuth.mockReturnValue({ token: 'valid-token', user: { id: '1' } });

    const { container } = render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(container.textContent).toContain('Protected Content');
  });

  it('deve redirecionar para /login se não autenticado', () => {
    mockUseAuth.mockReturnValue({ token: null, user: null });

    const { container } = render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(container.textContent).toContain('/login');
  });
});

describe('UsersProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve permitir acesso para ACCOUNTING_SUPER', () => {
    mockUseAuth.mockReturnValue({ 
      user: { id: '1', role: 'ACCOUNTING_SUPER' } 
    });

    const { container } = render(
      <BrowserRouter>
        <UsersProtectedRoute>
          <div>Users Content</div>
        </UsersProtectedRoute>
      </BrowserRouter>
    );

    expect(container.textContent).toContain('Users Content');
  });

  it('deve bloquear CLIENT_NORMAL', () => {
    mockUseAuth.mockReturnValue({ 
      user: { id: '2', role: 'CLIENT_NORMAL' } 
    });

    const { container } = render(
      <BrowserRouter>
        <UsersProtectedRoute>
          <div>Users Content</div>
        </UsersProtectedRoute>
      </BrowserRouter>
    );

    expect(container.textContent).toContain('/dashboard/client');
  });
});

