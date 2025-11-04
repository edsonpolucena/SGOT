import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import IconButton from '../IconButton';

const MockIcon = () => <span>Icon</span>;

describe('IconButton', () => {
  it('deve renderizar botão com ícone', () => {
    const { container } = render(
      <IconButton icon={MockIcon} title="Test" onClick={() => {}} />
    );
    expect(container).toBeDefined();
    expect(container.textContent).toContain('Icon');
  });

  it('deve renderizar com variante danger', () => {
    const { container } = render(
      <IconButton icon={MockIcon} title="Delete" onClick={() => {}} variant="danger" />
    );
    expect(container).toBeDefined();
  });
});

