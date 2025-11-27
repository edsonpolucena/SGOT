import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import VariationByTaxChart from '../VariationByTaxChart';

// Mock do recharts
vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ dataKey, name, fill }) => <div data-testid={`bar-${dataKey}`} style={{ backgroundColor: fill }} />,
  XAxis: ({ dataKey }) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  CartesianGrid: () => <div data-testid="grid" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
}));

describe('VariationByTaxChart.jsx - 100% Coverage', () => {
  it('deve renderizar gráfico com dados', () => {
    const data = [
      { imposto: 'DAS', valorAnterior: 1000, valorAtual: 1200 },
      { imposto: 'ISS', valorAnterior: 500, valorAtual: 600 },
    ];

    const { container } = render(
      <VariationByTaxChart data={data} mesAnterior="2025-01" mesAtual="2025-02" />
    );

    expect(container.querySelector('[data-testid="bar-chart"]')).toBeInTheDocument();
  });

  it('deve renderizar com array vazio', () => {
    const { container } = render(
      <VariationByTaxChart data={[]} mesAnterior="2025-01" mesAtual="2025-02" />
    );

    expect(container.querySelector('[data-testid="bar-chart"]')).toBeInTheDocument();
  });

  it('deve renderizar com valores zero', () => {
    const data = [
      { imposto: 'DAS', valorAnterior: 0, valorAtual: 0 },
    ];

    const { container } = render(
      <VariationByTaxChart data={data} mesAnterior="2025-01" mesAtual="2025-02" />
    );

    expect(container.querySelector('[data-testid="bar-chart"]')).toBeInTheDocument();
  });

  it('deve renderizar com múltiplos impostos', () => {
    const data = [
      { imposto: 'DAS', valorAnterior: 1000, valorAtual: 1200 },
      { imposto: 'ISS_RETIDO', valorAnterior: 500, valorAtual: 600 },
      { imposto: 'FGTS', valorAnterior: 300, valorAtual: 400 },
    ];

    const { container } = render(
      <VariationByTaxChart data={data} mesAnterior="2025-01" mesAtual="2025-02" />
    );

    expect(container.querySelector('[data-testid="bar-chart"]')).toBeInTheDocument();
  });
});
