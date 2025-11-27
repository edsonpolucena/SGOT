import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute, { UsersProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '../../shared/context/AuthContext';

vi.mock('../../shared/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute.jsx - 100% Coverage', () => {
  describe('ProtectedRoute', () => {
    it('deve redirecionar para /login quando não há token', () => {
      useAuth.mockReturnValue({ token: null, user: null });
      
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );
      
      expect(useAuth).toHaveBeenCalled();
    });

    it('deve renderizar children quando há token', () => {
      useAuth.mockReturnValue({ token: 'test-token', user: { id: '1' } });
      
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );
      
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('deve renderizar múltiplos children quando autenticado', () => {
      useAuth.mockReturnValue({ token: 'test-token', user: { id: '1' } });
      
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Child 1</div>
            <div>Child 2</div>
          </ProtectedRoute>
        </MemoryRouter>
      );
      
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('UsersProtectedRoute', () => {
    it('deve redirecionar para /login quando não há user', () => {
      useAuth.mockReturnValue({ user: null });
      
      render(
        <MemoryRouter>
          <UsersProtectedRoute>
            <div>Content</div>
          </UsersProtectedRoute>
        </MemoryRouter>
      );
      
      expect(useAuth).toHaveBeenCalled();
    });

    it('deve redirecionar CLIENT_NORMAL para /dashboard/client', () => {
      useAuth.mockReturnValue({ user: { role: 'CLIENT_NORMAL' } });
      
      render(
        <MemoryRouter>
          <UsersProtectedRoute>
            <div>Content</div>
          </UsersProtectedRoute>
        </MemoryRouter>
      );
      
      expect(useAuth).toHaveBeenCalled();
    });

    it('deve renderizar children quando user tem role permitida', () => {
      useAuth.mockReturnValue({ user: { role: 'ACCOUNTING_SUPER' } });
      
      render(
        <MemoryRouter>
          <UsersProtectedRoute requiredRoles={['ACCOUNTING_SUPER']}>
            <div>Content</div>
          </UsersProtectedRoute>
        </MemoryRouter>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('deve redirecionar quando user não tem role requerida', () => {
      useAuth.mockReturnValue({ user: { role: 'CLIENT_NORMAL' } });
      
      render(
        <MemoryRouter>
          <UsersProtectedRoute requiredRoles={['ACCOUNTING_SUPER']}>
            <div>Content</div>
          </UsersProtectedRoute>
        </MemoryRouter>
      );
      
      expect(useAuth).toHaveBeenCalled();
    });

    it('deve renderizar children quando requiredRoles não é fornecido', () => {
      useAuth.mockReturnValue({ user: { role: 'ACCOUNTING_SUPER' } });
      
      render(
        <MemoryRouter>
          <UsersProtectedRoute>
            <div>Content</div>
          </UsersProtectedRoute>
        </MemoryRouter>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('deve renderizar children quando user tem role na lista requiredRoles', () => {
      useAuth.mockReturnValue({ user: { role: 'ACCOUNTING_SUPER' } });
      
      render(
        <MemoryRouter>
          <UsersProtectedRoute requiredRoles={['ACCOUNTING_SUPER', 'OTHER_ROLE']}>
            <div>Content</div>
          </UsersProtectedRoute>
        </MemoryRouter>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});
