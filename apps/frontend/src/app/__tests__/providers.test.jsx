import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Providers from '../providers';
import { ThemeProvider } from 'styled-components';
import { AuthProvider } from '../../shared/context/AuthContext';

vi.mock('styled-components', () => ({
  ThemeProvider: ({ children }) => <div data-testid="theme-provider">{children}</div>,
}));

vi.mock('../../shared/context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
}));

vi.mock('../../styles/global', () => ({
  default: () => <div data-testid="global-style">GlobalStyle</div>,
}));

describe('providers.jsx - 100% Coverage', () => {
  it('deve renderizar ThemeProvider, AuthProvider e GlobalStyle', () => {
    render(
      <Providers>
        <div>Test Content</div>
      </Providers>
    );

    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('global-style')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('deve renderizar múltiplos children', () => {
    render(
      <Providers>
        <div>Child 1</div>
        <div>Child 2</div>
      </Providers>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('deve renderizar sem children', () => {
    const { container } = render(<Providers />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('deve manter hierarquia correta de providers', () => {
    const { container } = render(
      <Providers>
        <div>Content</div>
      </Providers>
    );

    const themeProvider = screen.getByTestId('theme-provider');
    const authProvider = screen.getByTestId('auth-provider');
    
    expect(themeProvider).toContainElement(authProvider);
    expect(authProvider).toContainElement(screen.getByTestId('global-style'));
  });
});
