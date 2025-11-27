import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRouter from '../router';

// Mock de todos os componentes
vi.mock('../../modules/auth/view/Login', () => ({
  default: () => <div>Login</div>,
}));

vi.mock('../../modules/auth/view/ForgotPassword', () => ({
  default: () => <div>ForgotPassword</div>,
}));

vi.mock('../../modules/auth/view/ResetPassword', () => ({
  default: () => <div>ResetPassword</div>,
}));

vi.mock('../../modules/obligations/view/List', () => ({
  default: () => <div>ObligationsList</div>,
}));

vi.mock('../../modules/obligations/view/Form', () => ({
  default: () => <div>ObligationForm</div>,
}));

vi.mock('../../modules/dashboard/view/Dashboard', () => ({
  default: () => <div>Dashboard</div>,
}));

vi.mock('../../modules/client/view/ClientDashboard', () => ({
  default: () => <div>ClientDashboard</div>,
}));

vi.mock('../../modules/client/view/CompanyProfile', () => ({
  default: () => <div>CompanyProfile</div>,
}));

vi.mock('../../modules/client/view/TaxReport', () => ({
  default: () => <div>TaxReport</div>,
}));

vi.mock('../../modules/company/view/CompanyList', () => ({
  default: () => <div>CompanyList</div>,
}));

vi.mock('../../modules/company/view/CompanyForm', () => ({
  default: () => <div>CompanyForm</div>,
}));

vi.mock('../../modules/users/view/UserList', () => ({
  default: () => <div>UserList</div>,
}));

vi.mock('../../modules/users/view/UserForm', () => ({
  default: () => <div>UserForm</div>,
}));

vi.mock('../../modules/audit/view/AuditLog', () => ({
  default: () => <div>AuditLog</div>,
}));

vi.mock('../../modules/notifications/view/UnviewedDocs', () => ({
  default: () => <div>UnviewedDocs</div>,
}));

vi.mock('../../modules/tax-matrix/view/TaxStatusMatrix', () => ({
  default: () => <div>TaxStatusMatrix</div>,
}));

vi.mock('../../modules/tax-calendar/view/TaxCalendarManagement', () => ({
  default: () => <div>TaxCalendarManagement</div>,
}));

vi.mock('../AppLayout', () => ({
  default: ({ children }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock('../../routes/ProtectedRoute', () => ({
  default: ({ children }) => <div data-testid="protected">{children}</div>,
  UsersProtectedRoute: ({ children }) => <div data-testid="users-protected">{children}</div>,
}));

vi.mock('../../routes/IndexRedirect', () => ({
  default: () => <div>IndexRedirect</div>,
}));

describe('router.jsx - 100% Coverage', () => {
  it('deve renderizar rota raiz (IndexRedirect)', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('IndexRedirect')).toBeInTheDocument();
  });

  it('deve renderizar rota de login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('deve renderizar rota de forgot-password', () => {
    render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('ForgotPassword')).toBeInTheDocument();
  });

  it('deve renderizar rota de reset-password', () => {
    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('ResetPassword')).toBeInTheDocument();
  });

  it('deve renderizar rota de dashboard com ProtectedRoute', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected')).toBeInTheDocument();
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('deve renderizar rota de dashboard/client', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/client']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('ClientDashboard')).toBeInTheDocument();
  });

  it('deve renderizar rota de obligations', () => {
    render(
      <MemoryRouter initialEntries={['/obligations']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('ObligationsList')).toBeInTheDocument();
  });

  it('deve renderizar rota de obligations/new', () => {
    render(
      <MemoryRouter initialEntries={['/obligations/new']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('ObligationForm')).toBeInTheDocument();
  });

  it('deve renderizar rota de obligations/:id/edit', () => {
    render(
      <MemoryRouter initialEntries={['/obligations/123/edit']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('ObligationForm')).toBeInTheDocument();
  });

  it('deve renderizar rota de companies', () => {
    render(
      <MemoryRouter initialEntries={['/companies']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('CompanyList')).toBeInTheDocument();
  });

  it('deve renderizar rota de company/new', () => {
    render(
      <MemoryRouter initialEntries={['/company/new']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('CompanyForm')).toBeInTheDocument();
  });

  it('deve renderizar rota de company/edit/:id', () => {
    render(
      <MemoryRouter initialEntries={['/company/edit/123']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('CompanyForm')).toBeInTheDocument();
  });

  it('deve renderizar rota de company/profile', () => {
    render(
      <MemoryRouter initialEntries={['/company/profile']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('CompanyProfile')).toBeInTheDocument();
  });

  it('deve renderizar rota de client/tax-report', () => {
    render(
      <MemoryRouter initialEntries={['/client/tax-report']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('TaxReport')).toBeInTheDocument();
  });

  it('deve renderizar rota de users com UsersProtectedRoute', () => {
    render(
      <MemoryRouter initialEntries={['/users']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByTestId('users-protected')).toBeInTheDocument();
    expect(screen.getByText('UserList')).toBeInTheDocument();
  });

  it('deve renderizar rota de users/new', () => {
    render(
      <MemoryRouter initialEntries={['/users/new']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('UserForm')).toBeInTheDocument();
  });

  it('deve renderizar rota de users/edit/:id', () => {
    render(
      <MemoryRouter initialEntries={['/users/edit/123']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('UserForm')).toBeInTheDocument();
  });

  it('deve renderizar rota de audit/logs', () => {
    render(
      <MemoryRouter initialEntries={['/audit/logs']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('AuditLog')).toBeInTheDocument();
  });

  it('deve renderizar rota de notifications/unviewed', () => {
    render(
      <MemoryRouter initialEntries={['/notifications/unviewed']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('UnviewedDocs')).toBeInTheDocument();
  });

  it('deve renderizar rota de tax-matrix', () => {
    render(
      <MemoryRouter initialEntries={['/tax-matrix']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('TaxStatusMatrix')).toBeInTheDocument();
  });

  it('deve renderizar rota de tax-calendar', () => {
    render(
      <MemoryRouter initialEntries={['/tax-calendar']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('TaxCalendarManagement')).toBeInTheDocument();
  });

  it('deve redirecionar rota não encontrada para /', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <AppRouter />
      </MemoryRouter>
    );

    // Navigate redireciona, então IndexRedirect deve aparecer
    expect(screen.getByText('IndexRedirect')).toBeInTheDocument();
  });
});
