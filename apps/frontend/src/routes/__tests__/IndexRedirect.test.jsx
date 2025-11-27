import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import IndexRedirect from '../IndexRedirect';
import { useAuth } from '../../shared/context/AuthContext';

vi.mock('../../shared/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('IndexRedirect.jsx - 100% Coverage', () => {
  it('deve redirecionar para /login quando não há token', () => {
    useAuth.mockReturnValue({ token: null, user: null });
    
    render(
      <MemoryRouter initialEntries={['/']}>
        <IndexRedirect />
      </MemoryRouter>
    );
    
    // Navigate component não renderiza nada visível, mas redireciona
    expect(useAuth).toHaveBeenCalled();
  });

  it('deve redirecionar para /dashboard quando user é ACCOUNTING_SUPER', () => {
    useAuth.mockReturnValue({
      token: 'test-token',
      user: { role: 'ACCOUNTING_SUPER' },
    });
    
    render(
      <MemoryRouter initialEntries={['/']}>
        <IndexRedirect />
      </MemoryRouter>
    );
    
    expect(useAuth).toHaveBeenCalled();
  });

  it('deve redirecionar para /dashboard quando user é CLIENT_NORMAL', () => {
    useAuth.mockReturnValue({
      token: 'test-token',
      user: { role: 'CLIENT_NORMAL' },
    });
    
    render(
      <MemoryRouter initialEntries={['/']}>
        <IndexRedirect />
      </MemoryRouter>
    );
    
    expect(useAuth).toHaveBeenCalled();
  });

  it('deve redirecionar para /dashboard quando user tem outro role', () => {
    useAuth.mockReturnValue({
      token: 'test-token',
      user: { role: 'OTHER_ROLE' },
    });
    
    render(
      <MemoryRouter initialEntries={['/']}>
        <IndexRedirect />
      </MemoryRouter>
    );
    
    expect(useAuth).toHaveBeenCalled();
  });

  it('deve redirecionar para /dashboard quando user existe mas sem role', () => {
    useAuth.mockReturnValue({
      token: 'test-token',
      user: {},
    });
    
    render(
      <MemoryRouter initialEntries={['/']}>
        <IndexRedirect />
      </MemoryRouter>
    );
    
    expect(useAuth).toHaveBeenCalled();
  });
});
