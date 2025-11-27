import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Providers from '../providers';

// Mock dos componentes
vi.mock('../../styles/global', () => ({
  default: () => <div data-testid="global-style">GlobalStyle</div>
}));

vi.mock('../../styles/theme', () => ({
  theme: { colors: { primary: '#000' } }
}));

vi.mock('../../shared/context/AuthContext.jsx', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>
}));

vi.mock('styled-components', () => ({
  ThemeProvider: ({ children }) => <div data-testid="theme-provider">{children}</div>
}));

describe('Providers', () => {
  it('deve renderizar todos os providers', () => {
    render(
      <Providers>
        <div data-testid="child">Test Child</div>
      </Providers>
    );

    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('global-style')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('deve renderizar children corretamente', () => {
    render(
      <Providers>
        <div data-testid="test-content">Content</div>
      </Providers>
    );

    expect(screen.getByTestId('test-content')).toHaveTextContent('Content');
  });
});

