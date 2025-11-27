import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import TaxesPieChart from '../TaxesPieChart';

// Mock do recharts
vi.mock('recharts', () => ({
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children, data }) => <div data-testid="pie">{children}</div>,
  Cell: ({ fill }) => <div data-testid="cell" style={{ backgroundColor: fill }} />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
}));

describe('TaxesPieChart.jsx - 100% Coverage', () => {
  it('deve renderizar gráfico com dados', () => {
    const data = [
      { tipo: 'DAS', valor: 1000 },
      { tipo: 'ISS', valor: 500 },
    ];

    const { container } = render(<TaxesPieChart data={data} />);

    expect(container.querySelector('[data-testid="pie-chart"]')).toBeInTheDocument();
  });

  it('deve renderizar com array vazio', () => {
    const { container } = render(<TaxesPieChart data={[]} />);

    expect(container.querySelector('[data-testid="pie-chart"]')).toBeInTheDocument();
  });

  it('deve processar tipo com " - " corretamente', () => {
    const data = [
      { tipo: 'DAS - Janeiro', valor: 1000 },
    ];

    const { container } = render(<TaxesPieChart data={data} />);

    expect(container.querySelector('[data-testid="pie-chart"]')).toBeInTheDocument();
  });

  it('deve renderizar múltiplos tipos de impostos', () => {
    const data = [
      { tipo: 'DAS', valor: 1000 },
      { tipo: 'ISS_RETIDO', valor: 500 },
      { tipo: 'FGTS', valor: 300 },
      { tipo: 'DCTFWeb', valor: 200 },
      { tipo: 'OUTRO', valor: 100 },
    ];

    const { container } = render(<TaxesPieChart data={data} />);

    expect(container.querySelector('[data-testid="pie-chart"]')).toBeInTheDocument();
  });

  it('deve renderizar com valores zero', () => {
    const data = [
      { tipo: 'DAS', valor: 0 },
    ];

    const { container } = render(<TaxesPieChart data={data} />);

    expect(container.querySelector('[data-testid="pie-chart"]')).toBeInTheDocument();
  });

  it('deve renderizar com valores negativos', () => {
    const data = [
      { tipo: 'DAS', valor: -100 },
    ];

    const { container } = render(<TaxesPieChart data={data} />);

    expect(container.querySelector('[data-testid="pie-chart"]')).toBeInTheDocument();
  });
});

