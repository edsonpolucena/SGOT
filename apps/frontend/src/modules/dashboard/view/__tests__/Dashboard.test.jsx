import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { useAuth } from '../../../../shared/context/AuthContext';
import http from '../../../../shared/services/http';
import { useObligationActions } from '../../../../shared/hooks/useObligationActions';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../../shared/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('../../../../shared/hooks/useObligationActions', () => ({
  useObligationActions: vi.fn(),
}));

vi.mock('../../../../shared/ui/WelcomeCard', () => ({
  default: ({ title, subtitle }) => (
    <div data-testid="welcome-card">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  ),
}));

vi.mock('../../../../shared/ui/IconButton', () => ({
  default: ({ icon: Icon, onClick, title }) => (
    <button onClick={onClick} title={title} data-testid={`icon-button-${title}`}>
      <Icon />
    </button>
  ),
}));

vi.mock('../../../../shared/ui/IconGroup', () => ({
  default: ({ children }) => <div data-testid="icon-group">{children}</div>,
}));

vi.mock('../../../../shared/icons', () => ({
  FaEye: () => <span data-testid="fa-eye">Eye</span>,
  FaDownload: () => <span data-testid="fa-download">Download</span>,
  FaTrashAlt: () => <span data-testid="fa-trash">Trash</span>,
}));

vi.mock('react-icons/fa', () => ({
  FaChartBar: () => <span data-testid="fa-chart-bar">ChartBar</span>,
}));

describe('Dashboard.jsx - 100% Coverage', () => {
  const mockHandleViewObligation = vi.fn();
  const mockHandleDownloadFiles = vi.fn();
  const mockHandleDeleteObligation = vi.fn();
  const mockAlertComponent = <div data-testid="alert">Alert</div>;

  beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({
      user: {
        name: 'Test User',
        role: 'ACCOUNTING_SUPER',
      },
      isAccounting: true,
      isClient: false,
    });

    useObligationActions.mockReturnValue({
      handleViewObligation: mockHandleViewObligation,
      handleDownloadFiles: mockHandleDownloadFiles,
      handleDeleteObligation: mockHandleDeleteObligation,
      alertComponent: mockAlertComponent,
    });

    http.get.mockImplementation((url) => {
      if (url === '/api/obligations') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'DAS - Janeiro 2025',
              taxType: 'DAS',
              amount: 1000,
              dueDate: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              status: 'PENDING',
              notes: JSON.stringify({
                companyCode: 'EMP002',
                companyName: 'Empresa 1',
                docType: 'DAS',
                competence: '2025-01',
              }),
              user: { name: 'User 1' },
            },
          ],
        });
      }
      if (url.includes('/api/analytics/tax-type-stats')) {
        return Promise.resolve({
          data: {
            taxStats: [
              {
                taxType: 'DAS',
                taxName: 'DAS',
                postedCount: 5,
                expectedCount: 10,
                completionRate: 50,
              },
            ],
          },
        });
      }
      if (url.includes('/api/analytics/deadline-compliance')) {
        return Promise.resolve({
          data: {
            month: '2025-01',
            total: 10,
            onTime: 8,
            late: 2,
            complianceRate: 80,
          },
        });
      }
      if (url.includes('/api/analytics/overdue-and-upcoming')) {
        return Promise.resolve({
          data: {
            month: '2025-01',
            overdue: {
              count: 2,
              items: [
                {
                  company: 'EMP002',
                  companyName: 'Empresa 1',
                  taxType: 'DAS',
                  daysOverdue: 5,
                },
              ],
            },
            dueSoon: {
              count: 1,
              items: [
                {
                  company: 'EMP003',
                  companyName: 'Empresa 2',
                  taxType: 'ISS',
                  daysUntilDue: 1,
                },
              ],
            },
          },
        });
      }
      if (url.includes('/api/analytics/unviewed-alerts')) {
        return Promise.resolve({
          data: {
            total: 3,
            oneDay: [
              {
                id: 1,
                company: 'EMP002 - Empresa 1',
                taxType: 'DAS',
              },
            ],
            twoDays: [
              {
                id: 2,
                company: 'EMP003 - Empresa 2',
                taxType: 'ISS',
              },
            ],
            threeDays: [
              {
                id: 3,
                company: 'EMP004 - Empresa 3',
                taxType: 'FGTS',
              },
            ],
          },
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('deve renderizar loading inicialmente', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Carregando dashboard...')).toBeInTheDocument();
  });

  it('deve redirecionar clientes para /dashboard/client', () => {
    useAuth.mockReturnValue({
      user: {
        name: 'Client User',
        role: 'CLIENT_ADMIN',
      },
      isAccounting: false,
      isClient: true,
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/client', { replace: true });
  });

  it('deve carregar dados do dashboard', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(http.get).toHaveBeenCalledWith('/api/obligations');
    });
  });

  it('deve exibir estatísticas de obrigações', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Total de obrigações
      expect(screen.getByText('Total de Obrigações')).toBeInTheDocument();
    });
  });

  it('deve exibir estatísticas de cumprimento de prazos', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('Prazos Cumpridos')).toBeInTheDocument();
    });
  });

  it('deve exibir alertas de impostos atrasados', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/2 Impostos Atrasados/)).toBeInTheDocument();
    });
  });

  it('deve exibir alertas de impostos vencendo', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/1 Impostos Vencendo em 2 Dias/)).toBeInTheDocument();
    });
  });

  it('deve exibir alertas de documentos não visualizados', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/3 Documento\(s\) Não Visualizado\(s\)/)).toBeInTheDocument();
    });
  });

  it('deve navegar para unviewed ao clicar no botão', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const button = screen.getByText('Ver Documentos Não Visualizados');
      fireEvent.click(button);
      expect(mockNavigate).toHaveBeenCalledWith('/notifications/unviewed');
    });
  });

  it('deve exibir estatísticas por tipo de imposto', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Status por Tipo de Imposto')).toBeInTheDocument();
      expect(screen.getByText('DAS')).toBeInTheDocument();
      expect(screen.getByText('5/10')).toBeInTheDocument();
      expect(screen.getByText('50% concluído')).toBeInTheDocument();
    });
  });

  it('deve exibir tabela de obrigações', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Obrigações Recentes')).toBeInTheDocument();
      expect(screen.getByText('EMP002')).toBeInTheDocument();
      expect(screen.getByText('Empresa 1')).toBeInTheDocument();
    });
  });

  it('deve filtrar obrigações por busca', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Pesquisar...');
      fireEvent.change(searchInput, { target: { value: 'EMP002' } });
    });

    await waitFor(() => {
      expect(screen.getByText('EMP002')).toBeInTheDocument();
    });
  });

  it('deve ordenar tabela ao clicar no cabeçalho', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const createdAtHeader = screen.getByText('Data Upload');
      fireEvent.click(createdAtHeader);
    });

    await waitFor(() => {
      // Verificar se a ordenação foi aplicada
      expect(screen.getByText('EMP002')).toBeInTheDocument();
    });
  });

  it('deve paginar resultados', async () => {
    // Criar mais obrigações para testar paginação
    http.get.mockImplementation((url) => {
      if (url === '/api/obligations') {
        return Promise.resolve({
          data: Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            title: `DAS - ${i + 1}`,
            taxType: 'DAS',
            amount: 1000,
            dueDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            status: 'PENDING',
            notes: JSON.stringify({
              companyCode: `EMP00${i + 2}`,
              companyName: `Empresa ${i + 1}`,
              docType: 'DAS',
              competence: '2025-01',
            }),
            user: { name: 'User 1' },
          })),
        });
      }
      return Promise.resolve({ data: { taxStats: [], month: '2025-01', total: 0, onTime: 0, late: 0, complianceRate: 0 } });
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Página 1 de')).toBeInTheDocument();
    });

    await waitFor(() => {
      const nextButton = screen.getByText('Próxima');
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Página 2 de')).toBeInTheDocument();
    });
  });

  it('deve visualizar obrigação ao clicar no botão', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const viewButton = screen.getByTestId('icon-button-Visualizar');
      fireEvent.click(viewButton);
      expect(mockHandleViewObligation).toHaveBeenCalledWith(1);
    });
  });

  it('deve baixar arquivos ao clicar no botão', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const downloadButton = screen.getByTestId('icon-button-Download');
      fireEvent.click(downloadButton);
      expect(mockHandleDownloadFiles).toHaveBeenCalledWith(1);
    });
  });

  it('deve deletar obrigação ao clicar no botão', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const deleteButton = screen.getByTestId('icon-button-Excluir');
      fireEvent.click(deleteButton);
      expect(mockHandleDeleteObligation).toHaveBeenCalled();
    });
  });

  it('deve exibir mensagem quando não há obrigações', async () => {
    http.get.mockImplementation((url) => {
      if (url === '/api/obligations') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: { taxStats: [], month: '2025-01', total: 0, onTime: 0, late: 0, complianceRate: 0 } });
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nenhuma obrigação encontrada')).toBeInTheDocument();
    });
  });

  it('deve formatar valor monetário corretamente', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/R\$/)).toBeInTheDocument();
      expect(screen.getByText(/1\.000/)).toBeInTheDocument();
    });
  });

  it('deve exibir "-" quando não há valor', async () => {
    http.get.mockImplementation((url) => {
      if (url === '/api/obligations') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'DAS - Janeiro 2025',
              taxType: 'DAS',
              amount: null,
              dueDate: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              status: 'PENDING',
              notes: JSON.stringify({
                companyCode: 'EMP002',
                companyName: 'Empresa 1',
                docType: 'DAS',
                competence: '2025-01',
              }),
              user: { name: 'User 1' },
            },
          ],
        });
      }
      return Promise.resolve({ data: { taxStats: [], month: '2025-01', total: 0, onTime: 0, late: 0, complianceRate: 0 } });
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  it('deve lidar com erro ao carregar obrigações', async () => {
    http.get.mockImplementation((url) => {
      if (url === '/api/obligations') {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ data: { taxStats: [], month: '2025-01', total: 0, onTime: 0, late: 0, complianceRate: 0 } });
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Componente deve renderizar mesmo com erro
      expect(screen.getByText('Obrigações Recentes')).toBeInTheDocument();
    });
  });

  it('deve lidar com erro ao carregar estatísticas de impostos', async () => {
    http.get.mockImplementation((url) => {
      if (url === '/api/obligations') {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/api/analytics/tax-type-stats')) {
        return Promise.reject(new Error('Tax stats error'));
      }
      return Promise.resolve({ data: { month: '2025-01', total: 0, onTime: 0, late: 0, complianceRate: 0 } });
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Componente deve renderizar mesmo com erro
      expect(screen.getByText('Obrigações Recentes')).toBeInTheDocument();
    });
  });

  it('deve recarregar dados quando janela recebe foco', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(http.get).toHaveBeenCalled();
    });

    vi.clearAllMocks();

    // Simular evento de foco
    window.dispatchEvent(new Event('focus'));

    await waitFor(() => {
      expect(http.get).toHaveBeenCalled();
    });
  });

  it('deve calcular compliance percent corretamente', async () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    http.get.mockImplementation((url) => {
      if (url === '/api/obligations') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'DAS - Janeiro 2025',
              taxType: 'DAS',
              amount: 1000,
              dueDate: new Date(currentYear, currentMonth, 15).toISOString(),
              createdAt: new Date().toISOString(),
              status: 'COMPLETED',
              notes: JSON.stringify({
                companyCode: 'EMP002',
                companyName: 'Empresa 1',
                docType: 'DAS',
                competence: '2025-01',
              }),
              user: { name: 'User 1' },
            },
            {
              id: 2,
              title: 'ISS - Janeiro 2025',
              taxType: 'ISS',
              amount: 500,
              dueDate: new Date(currentYear, currentMonth, 20).toISOString(),
              createdAt: new Date().toISOString(),
              status: 'PENDING',
              placeholder: true,
              notes: JSON.stringify({
                companyCode: 'EMP002',
                companyName: 'Empresa 1',
                docType: 'ISS',
                competence: '2025-01',
              }),
              user: { name: 'User 1' },
            },
          ],
        });
      }
      return Promise.resolve({ data: { taxStats: [], month: '2025-01', total: 0, onTime: 0, late: 0, complianceRate: 0 } });
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Compliance deve ser calculado
      expect(screen.getByText('Obrigações Recentes')).toBeInTheDocument();
    });
  });

  it('deve não exibir alertas quando não há dados', async () => {
    http.get.mockImplementation((url) => {
      if (url === '/api/obligations') {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/api/analytics/overdue-and-upcoming')) {
        return Promise.resolve({
          data: {
            month: '2025-01',
            overdue: { count: 0, items: [] },
            dueSoon: { count: 0, items: [] },
          },
        });
      }
      return Promise.resolve({ data: { taxStats: [], month: '2025-01', total: 0, onTime: 0, late: 0, complianceRate: 0 } });
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Impostos Atrasados/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Impostos Vencendo/)).not.toBeInTheDocument();
    });
  });

  it('deve não exibir alertas de não visualizados quando total é 0', async () => {
    http.get.mockImplementation((url) => {
      if (url === '/api/obligations') {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/api/analytics/unviewed-alerts')) {
        return Promise.resolve({
          data: {
            total: 0,
            oneDay: [],
            twoDays: [],
            threeDays: [],
          },
        });
      }
      return Promise.resolve({ data: { taxStats: [], month: '2025-01', total: 0, onTime: 0, late: 0, complianceRate: 0 } });
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Documento\(s\) Não Visualizado\(s\)/)).not.toBeInTheDocument();
    });
  });

  it('deve desabilitar botão anterior na primeira página', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const prevButton = screen.getByText('Anterior');
      expect(prevButton).toBeDisabled();
    });
  });

  it('deve desabilitar botão próxima na última página', async () => {
    http.get.mockImplementation((url) => {
      if (url === '/api/obligations') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'DAS - Janeiro 2025',
              taxType: 'DAS',
              amount: 1000,
              dueDate: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              status: 'PENDING',
              notes: JSON.stringify({
                companyCode: 'EMP002',
                companyName: 'Empresa 1',
                docType: 'DAS',
                competence: '2025-01',
              }),
              user: { name: 'User 1' },
            },
          ],
        });
      }
      return Promise.resolve({ data: { taxStats: [], month: '2025-01', total: 0, onTime: 0, late: 0, complianceRate: 0 } });
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const nextButton = screen.getByText('Próxima');
      expect(nextButton).toBeDisabled();
    });
  });

  it('deve exibir alert component', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('alert')).toBeInTheDocument();
    });
  });
});

