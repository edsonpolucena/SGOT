import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthLayout from '../AuthLayout';

describe('AuthLayout.jsx - 100% Coverage', () => {
  it('deve renderizar children dentro do Card', () => {
    render(
      <AuthLayout>
        <div>Test Content</div>
      </AuthLayout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('deve renderizar informações quando hideInfo é false', () => {
    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    );

    expect(screen.getByText('SGOT')).toBeInTheDocument();
    expect(screen.getByText(/Organize seus tributos/)).toBeInTheDocument();
  });

  it('deve renderizar informações quando hideInfo não é fornecido', () => {
    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    );

    expect(screen.getByText('SGOT')).toBeInTheDocument();
  });

  it('não deve renderizar informações quando hideInfo é true', () => {
    render(
      <AuthLayout hideInfo={true}>
        <div>Content</div>
      </AuthLayout>
    );

    expect(screen.queryByText('SGOT')).not.toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('deve renderizar links de privacidade e termos', () => {
    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    );

    const privacyLink = screen.getByText('Política de Privacidade');
    const termsLink = screen.getByText('Termos de Uso');

    expect(privacyLink).toBeInTheDocument();
    expect(termsLink).toBeInTheDocument();
    expect(privacyLink.closest('a')).toHaveAttribute('href', '/privacidade');
    expect(termsLink.closest('a')).toHaveAttribute('href', '/termos');
  });

  it('deve renderizar informações de suporte', () => {
    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    );

    expect(screen.getByText(/Precisa de ajuda/)).toBeInTheDocument();
    expect(screen.getByText(/suporte@sgot.com.br/)).toBeInTheDocument();
  });

  it('deve renderizar múltiplos children', () => {
    render(
      <AuthLayout>
        <div>Child 1</div>
        <div>Child 2</div>
      </AuthLayout>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });
});

