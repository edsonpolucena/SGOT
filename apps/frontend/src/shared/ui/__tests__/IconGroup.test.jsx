import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import IconGroup from '../IconGroup';

describe('IconGroup.jsx - 100% Coverage', () => {
  it('deve renderizar children corretamente', () => {
    render(
      <IconGroup>
        <span>Child 1</span>
        <span>Child 2</span>
      </IconGroup>
    );
    
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('deve renderizar sem children', () => {
    const { container } = render(<IconGroup />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('deve renderizar com múltiplos elementos', () => {
    render(
      <IconGroup>
        <button>Button 1</button>
        <button>Button 2</button>
        <button>Button 3</button>
      </IconGroup>
    );
    
    expect(screen.getByText('Button 1')).toBeInTheDocument();
    expect(screen.getByText('Button 2')).toBeInTheDocument();
    expect(screen.getByText('Button 3')).toBeInTheDocument();
  });
});
