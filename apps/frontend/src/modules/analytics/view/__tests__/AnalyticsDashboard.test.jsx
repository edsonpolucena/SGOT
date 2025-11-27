import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalyticsDashboard from '../AnalyticsDashboard';
import { useMonthlySummary } from '../../hooks/useAnalyticsData';
import TaxesPieChart from '../../components/charts/TaxesPieChart';

vi.mock('../../hooks/useAnalyticsData', () => ({
  useMonthlySummary: vi.fn(),
}));

vi.mock('../../components/charts/TaxesPieChart', () => ({
  default: ({ data }) => <div data-testid="pie-chart">{JSON.stringify(data)}</div>,
}));

describe('AnalyticsDashboard.jsx - 100% Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar loading quando loading é true', () => {
    useMonthlySummary.mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });

    render(<AnalyticsDashboard empresaId={1} />);
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('deve renderizar erro quando error existe', () => {
    useMonthlySummary.mockReturnValue({
      data: null,
      loading: false,
      error: 'Erro ao carregar',
    });

    render(<AnalyticsDashboard empresaId={1} />);
    expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument();
  });

  it('deve renderizar dados quando carregado com sucesso', () => {
    const mockData = {
      total: 1000.50,
      impostos: [{ tipo: 'DAS', valor: 500 }],
    };

    useMonthlySummary.mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
    });

    render(<AnalyticsDashboard empresaId={1} />);

    expect(screen.getByText(/Analytics - Impostos/)).toBeInTheDocument();
    expect(screen.getByText(/Total do mês/)).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('deve calcular mês atual corretamente', () => {
    const mockData = {
      total: 1000,
      impostos: [],
    };

    useMonthlySummary.mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
    });

    const now = new Date();
    const expectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    render(<AnalyticsDashboard empresaId={1} />);

    expect(useMonthlySummary).toHaveBeenCalledWith(1, expectedMonth);
  });

  it('deve passar empresaId para useMonthlySummary', () => {
    const mockData = {
      total: 1000,
      impostos: [],
    };

    useMonthlySummary.mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
    });

    render(<AnalyticsDashboard empresaId={123} />);

    expect(useMonthlySummary).toHaveBeenCalledWith(
      123,
      expect.stringMatching(/\d{4}-\d{2}/)
    );
  });

  it('deve formatar total corretamente', () => {
    const mockData = {
      total: 1234.56,
      impostos: [],
    };

    useMonthlySummary.mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
    });

    render(<AnalyticsDashboard empresaId={1} />);

    const totalText = screen.getByText(/Total do mês/);
    expect(totalText.textContent).toContain('1.234,56');
  });

  it('deve passar impostos para TaxesPieChart', () => {
    const mockImpostos = [
      { tipo: 'DAS', valor: 500 },
      { tipo: 'ISS', valor: 300 },
    ];

    const mockData = {
      total: 800,
      impostos: mockImpostos,
    };

    useMonthlySummary.mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
    });

    render(<AnalyticsDashboard empresaId={1} />);

    const chart = screen.getByTestId('pie-chart');
    expect(chart.textContent).toContain('DAS');
    expect(chart.textContent).toContain('ISS');
  });
});

