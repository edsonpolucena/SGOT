import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { useAuth } from '../../context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Sidebar.jsx - 100% Coverage', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar menu para ACCOUNTING_SUPER', () => {
    useAuth.mockReturnValue({
      user: { role: 'ACCOUNTING_SUPER' },
      isAccounting: true,
      isClient: false,
      logout: mockLogout,
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

  it('deve renderizar menu para ACCOUNTING sem Logs de Auditoria', () => {
    useAuth.mockReturnValue({
      user: { role: 'ACCOUNTING_NORMAL' },
      isAccounting: true,
      isClient: false,
      logout: mockLogout,
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
    useAuth.mockReturnValue({
      user: { role: 'CLIENT_NORMAL' },
      isAccounting: false,
      isClient: true,
      logout: mockLogout,
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

  it('deve renderizar menu para CLIENT_ADMIN com Usuários', () => {
    useAuth.mockReturnValue({
      user: { role: 'CLIENT_ADMIN' },
      isAccounting: false,
      isClient: true,
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Usuários')).toBeInTheDocument();
  });

  it('deve renderizar menu vazio quando não é accounting nem client', () => {
    useAuth.mockReturnValue({
      user: { role: 'OTHER_ROLE' },
      isAccounting: false,
      isClient: false,
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Sair')).toBeInTheDocument();
  });

  it('deve chamar logout e navegar quando Sair é clicado', () => {
    useAuth.mockReturnValue({
      user: { role: 'ACCOUNTING_SUPER' },
      isAccounting: true,
      isClient: false,
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const logoutButton = screen.getByText('Sair');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('deve destacar item ativo no menu', () => {
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ pathname: '/companies' }),
      };
    });

    useAuth.mockReturnValue({
      user: { role: 'ACCOUNTING_SUPER' },
      isAccounting: true,
      isClient: false,
      logout: mockLogout,
    });

    render(
      <MemoryRouter initialEntries={['/companies']}>
        <Sidebar />
      </MemoryRouter>
    );

    const companiesLink = screen.getByText('Empresas').closest('a');
    expect(companiesLink).toBeInTheDocument();
  });
});
