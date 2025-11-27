import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRouter from '../router';

// Mock de todos os componentes de view
vi.mock('../../modules/auth/view/Login.jsx', () => ({
  default: () => <div data-testid="login">Login</div>
}));

vi.mock('../../modules/auth/view/ForgotPassword.jsx', () => ({
  default: () => <div data-testid="forgot-password">Forgot Password</div>
}));

vi.mock('../../modules/auth/view/ResetPassword.jsx', () => ({
  default: () => <div data-testid="reset-password">Reset Password</div>
}));

vi.mock('../../modules/dashboard/view/Dashboard.jsx', () => ({
  default: () => <div data-testid="dashboard">Dashboard</div>
}));

vi.mock('../../modules/obligations/view/List.jsx', () => ({
  default: () => <div data-testid="obligations-list">Obligations List</div>
}));

vi.mock('../../modules/obligations/view/Form.jsx', () => ({
  default: () => <div data-testid="obligations-form">Obligations Form</div>
}));

vi.mock('../../modules/company/view/CompanyList.jsx', () => ({
  default: () => <div data-testid="company-list">Company List</div>
}));

vi.mock('../../modules/company/view/CompanyForm.jsx', () => ({
  default: () => <div data-testid="company-form">Company Form</div>
}));

vi.mock('../../modules/users/view/UserList.jsx', () => ({
  default: () => <div data-testid="user-list">User List</div>
}));

vi.mock('../../modules/users/view/UserForm.jsx', () => ({
  default: () => <div data-testid="user-form">User Form</div>
}));

vi.mock('../../modules/audit/view/AuditLog.jsx', () => ({
  default: () => <div data-testid="audit-log">Audit Log</div>
}));

vi.mock('../../modules/notifications/view/UnviewedDocs.jsx', () => ({
  default: () => <div data-testid="unviewed-docs">Unviewed Docs</div>
}));

vi.mock('../../modules/tax-matrix/view/TaxStatusMatrix.jsx', () => ({
  default: () => <div data-testid="tax-matrix">Tax Matrix</div>
}));

vi.mock('../../modules/tax-calendar/view/TaxCalendarManagement.jsx', () => ({
  default: () => <div data-testid="tax-calendar">Tax Calendar</div>
}));

vi.mock('../../modules/client/view/ClientDashboard.jsx', () => ({
  default: () => <div data-testid="client-dashboard">Client Dashboard</div>
}));

vi.mock('../../modules/client/view/CompanyProfile.jsx', () => ({
  default: () => <div data-testid="company-profile">Company Profile</div>
}));

vi.mock('../../modules/client/view/TaxReport.jsx', () => ({
  default: () => <div data-testid="tax-report">Tax Report</div>
}));

vi.mock('../AppLayout.jsx', () => ({
  default: ({ children }) => <div data-testid="app-layout">{children}</div>
}));

vi.mock('../../routes/ProtectedRoute.jsx', () => ({
  default: ({ children }) => <div data-testid="protected-route">{children}</div>,
  UsersProtectedRoute: ({ children }) => <div data-testid="users-protected-route">{children}</div>
}));

vi.mock('../../routes/IndexRedirect.jsx', () => ({
  default: () => <div data-testid="index-redirect">Index Redirect</div>
}));

describe('AppRouter', () => {
  it('deve renderizar rota de login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByTestId('login')).toBeInTheDocument();
  });

  it('deve renderizar rota de forgot-password', () => {
    render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByTestId('forgot-password')).toBeInTheDocument();
  });

  it('deve renderizar rota de reset-password', () => {
    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByTestId('reset-password')).toBeInTheDocument();
  });

  it('deve renderizar IndexRedirect na rota raiz', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByTestId('index-redirect')).toBeInTheDocument();
  });
});

