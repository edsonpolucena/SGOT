import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../Header';

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => mockUseAuth()
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar links de navegação', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'test@test.com' },
      logout: vi.fn()
    });

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    expect(screen.getByText('Obrigações')).toBeInTheDocument();
    expect(screen.getByText('Nova')).toBeInTheDocument();
  });

  it('deve exibir email do usuário', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'user@test.com' },
      logout: vi.fn()
    });

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    expect(screen.getByText('user@test.com')).toBeInTheDocument();
  });

  it('deve chamar logout ao clicar no botão Sair', () => {
    const logout = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { email: 'test@test.com' },
      logout
    });

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    const logoutButton = screen.getByText('Sair');
    fireEvent.click(logoutButton);

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('deve lidar com usuário sem email', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: vi.fn()
    });

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    expect(screen.getByText('Obrigações')).toBeInTheDocument();
  });
});

