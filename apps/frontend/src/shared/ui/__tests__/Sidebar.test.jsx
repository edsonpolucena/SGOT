import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', role: 'ACCOUNTING_SUPER', name: 'Admin' },
    isAccounting: true,
    isClient: false,
    logout: vi.fn()
  })
}));

describe('Sidebar', () => {
  it('deve renderizar sidebar', () => {
    const { container } = render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
    expect(container).toBeDefined();
    expect(container.textContent).toContain('Dashboard');
  });
});

