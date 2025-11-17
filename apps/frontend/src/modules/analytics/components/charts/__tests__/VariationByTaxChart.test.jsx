import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import VariationByTaxChart from '../VariationByTaxChart';

// Mock do Recharts
vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div>Bar</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>Grid</div>,
  Tooltip: () => <div>Tooltip</div>,
  Legend: () => <div>Legend</div>,
  ResponsiveContainer: ({ children }) => <div>{children}</div>
}));

describe('VariationByTaxChart', () => {
  it('deve renderizar com dados', () => {
    const mockData = [
      { tipo: 'ICMS', mesAtual: 80000, mesAnterior: 75000 },
      { tipo: 'ISS', mesAtual: 70000, mesAnterior: 68000 }
    ];

    const { container } = render(<VariationByTaxChart data={mockData} />);
    expect(container).toBeDefined();
  });

  it('deve renderizar sem dados', () => {
    const { container } = render(<VariationByTaxChart data={[]} />);
    expect(container).toBeDefined();
  });
});

