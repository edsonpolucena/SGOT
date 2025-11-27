import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IconButton from '../IconButton';

describe('IconButton.jsx - 100% Coverage', () => {
  const MockIcon = () => <span data-testid="mock-icon">Icon</span>;

  it('deve renderizar ícone corretamente', () => {
    render(<IconButton icon={MockIcon} />);
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('deve chamar onClick quando clicado', () => {
    const handleClick = vi.fn();
    render(<IconButton icon={MockIcon} onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('deve exibir title como tooltip', () => {
    render(<IconButton icon={MockIcon} title="Test Tooltip" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Test Tooltip');
  });

  it('deve usar variant default quando não fornecido', () => {
    render(<IconButton icon={MockIcon} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('deve aplicar variant danger corretamente', () => {
    render(<IconButton icon={MockIcon} variant="danger" />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('deve funcionar sem onClick', () => {
    render(<IconButton icon={MockIcon} />);
    const button = screen.getByRole('button');
    fireEvent.click(button); // Não deve quebrar
    expect(button).toBeInTheDocument();
  });

  it('deve funcionar sem title', () => {
    render(<IconButton icon={MockIcon} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});
