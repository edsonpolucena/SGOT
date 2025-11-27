import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';

const mockUseAuth = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar menu para ACCOUNTING_SUPER', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'ACCOUNTING_SUPER' },
      isAccounting: true,
      isClient: false,
      logout: vi.fn()
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Empresas')).toBeInTheDocument();
    expect(screen.getByText('Usuários')).toBeInTheDocument();
    expect(screen.getByText('Obrigações')).toBeInTheDocument();
    expect(screen.getByText('Logs de Auditoria')).toBeInTheDocument();
  });

  it('deve renderizar menu para ACCOUNTING_ADMIN (sem Logs de Auditoria)', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'ACCOUNTING_ADMIN' },
      isAccounting: true,
      isClient: false,
      logout: vi.fn()
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Logs de Auditoria')).not.toBeInTheDocument();
  });

  it('deve renderizar menu para CLIENT_NORMAL', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'CLIENT_NORMAL' },
      isAccounting: false,
      isClient: true,
      logout: vi.fn()
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Perfil da Empresa')).toBeInTheDocument();
    expect(screen.getByText('Relatório de Impostos')).toBeInTheDocument();
    expect(screen.queryByText('Usuários')).not.toBeInTheDocument();
  });

  it('deve renderizar menu para CLIENT_ADMIN (com Usuários)', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'CLIENT_ADMIN' },
      isAccounting: false,
      isClient: true,
      logout: vi.fn()
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Usuários')).toBeInTheDocument();
  });

  it('deve chamar logout e navegar para /login ao clicar em Sair', () => {
    const logout = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { role: 'ACCOUNTING_SUPER' },
      isAccounting: true,
      isClient: false,
      logout
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const logoutButton = screen.getByText('Sair');
    fireEvent.click(logoutButton);

    expect(logout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('deve marcar item ativo baseado na rota atual', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'ACCOUNTING_SUPER' },
      isAccounting: true,
      isClient: false,
      logout: vi.fn()
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar />
      </MemoryRouter>
    );

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  it('deve retornar array vazio quando não é accounting nem client', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'UNKNOWN' },
      isAccounting: false,
      isClient: false,
      logout: vi.fn()
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    // Não deve ter itens de menu, apenas botão de logout
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.getByText('Sair')).toBeInTheDocument();
  });
});
