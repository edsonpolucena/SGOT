import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppLayout from '../AppLayout';
import Sidebar from '../../shared/ui/Sidebar';

vi.mock('../../shared/ui/Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}));

describe('AppLayout.jsx - 100% Coverage', () => {
  it('deve renderizar Sidebar e children', () => {
    render(
      <BrowserRouter>
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('deve renderizar múltiplos children', () => {
    render(
      <BrowserRouter>
        <AppLayout>
          <div>Child 1</div>
          <div>Child 2</div>
        </AppLayout>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('deve renderizar sem children', () => {
    const { container } = render(
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    );
    
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });
});
