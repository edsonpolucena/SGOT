import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import IconGroup from '../IconGroup';

describe('IconGroup', () => {
  it('deve renderizar children', () => {
    render(
      <IconGroup>
        <button>Button 1</button>
        <button>Button 2</button>
      </IconGroup>
    );

    expect(screen.getByText('Button 1')).toBeDefined();
    expect(screen.getByText('Button 2')).toBeDefined();
  });

  it('deve renderizar vazio sem children', () => {
    const { container } = render(<IconGroup />);
    const wrapper = container.querySelector('div');
    expect(wrapper).toBeDefined();
  });
});

