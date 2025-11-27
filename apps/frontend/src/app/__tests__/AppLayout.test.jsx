import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppLayout from '../AppLayout';

// Mock do Sidebar
vi.mock('../../shared/ui/Sidebar.jsx', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>
}));

describe('AppLayout', () => {
  it('deve renderizar Sidebar e children', () => {
    render(
      <AppLayout>
        <div data-testid="content">Test Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toHaveTextContent('Test Content');
  });

  it('deve renderizar múltiplos children', () => {
    render(
      <AppLayout>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
      </AppLayout>
    );

    expect(screen.getByTestId('child1')).toBeInTheDocument();
    expect(screen.getByTestId('child2')).toBeInTheDocument();
  });
});

