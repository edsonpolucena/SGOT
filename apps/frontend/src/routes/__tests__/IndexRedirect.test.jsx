import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import IndexRedirect from '../IndexRedirect';

const mockUseAuth = vi.fn();
vi.mock('../../shared/context/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }) => <div data-testid="redirect">Redirecting to {to}</div>
  };
});

describe('IndexRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve redirecionar para /login se não autenticado', () => {
    mockUseAuth.mockReturnValue({ token: null, user: null });

    const { container } = render(
      <BrowserRouter>
        <IndexRedirect />
      </BrowserRouter>
    );

    expect(container.textContent).toContain('/login');
  });

  it('deve redirecionar para /dashboard se autenticado', () => {
    mockUseAuth.mockReturnValue({ 
      token: 'valid-token', 
      user: { role: 'ACCOUNTING_SUPER' } 
    });

    const { container } = render(
      <BrowserRouter>
        <IndexRedirect />
      </BrowserRouter>
    );

    expect(container.textContent).toContain('/dashboard');
  });
});

