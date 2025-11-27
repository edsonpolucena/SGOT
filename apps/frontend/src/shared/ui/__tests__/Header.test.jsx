import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../Header';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Header.jsx - 100% Coverage', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { email: 'test@test.com' },
      logout: mockLogout,
    });
  });

  it('deve renderizar links e informações do usuário', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    expect(screen.getByText('Obrigações')).toBeInTheDocument();
    expect(screen.getByText('Nova')).toBeInTheDocument();
    expect(screen.getByText('test@test.com')).toBeInTheDocument();
    expect(screen.getByText('Sair')).toBeInTheDocument();
  });

  it('deve chamar logout quando botão Sair é clicado', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    const logoutButton = screen.getByText('Sair');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar email do usuário', () => {
    useAuth.mockReturnValue({
      user: { email: 'user@example.com' },
      logout: mockLogout,
    });

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('deve renderizar quando user é null', () => {
    useAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
    });

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    expect(screen.getByText('Obrigações')).toBeInTheDocument();
  });
});
