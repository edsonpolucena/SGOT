import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaxStatusMatrix from '../TaxStatusMatrix';
import { useAuth } from '../../../../shared/context/AuthContext';
import http from '../../../../shared/services/http';

vi.mock('../../../../shared/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('../../../../shared/ui/WelcomeCard', () => ({
  default: ({ title, subtitle }) => (
    <div data-testid="welcome-card">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  ),
}));

vi.mock('../../../../shared/utils/exportUtils', () => ({
  arrayToCsv: vi.fn((data) => 'csv,data'),
  downloadBlob: vi.fn(),
  openPrintWindowWithTable: vi.fn(),
}));

vi.mock('react-icons/fa', () => ({
  FaClipboardList: () => <span data-testid="fa-clipboard-list">ClipboardList</span>,
}));

describe('TaxStatusMatrix.jsx - 100% Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    useAuth.mockReturnValue({
      user: {
        name: 'Test User',
        role: 'ACCOUNTING_SUPER',
      },
    });

    http.get.mockImplementation((url) => {
      if (url === '/api/empresas') {
        return Promise.resolve({
          data: [
            { id: 1, codigo: 'EMP001', nome: 'Empresa Contabilidade' },
            { id: 2, codigo: 'EMP002', nome: 'Empresa Cliente 1' },
            { id: 3, codigo: 'EMP003', nome: 'Empresa Cliente 2' },
          ],
        });
      }
      if (url.includes('/api/obligations')) {
        return Promise.resolve({
          data: [
            {
              id: 1,
              companyId: 2,
              taxType: 'DAS',
              status: 'PENDING',
              amount: 1000,
              files: [{ id: 1 }],
            },
            {
              id: 2,
              companyId: 2,
              taxType: 'ISS_RETIDO',
              status: 'NOT_APPLICABLE',
              amount: null,
              files: [],
            },
            {
              id: 3,
              companyId: 3,
              taxType: 'DAS',
              status: 'PENDING',
              amount: 0,
              files: [],
            },
          ],
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('deve renderizar loading inicialmente', async () => {
    render(<TaxStatusMatrix />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('deve carregar e exibir matriz de impostos', async () => {
    render(<TaxStatusMatrix />);

    await waitFor(() => {
      expect(screen.getByText(/Impostos Postados/)).toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByText('Empresa Cliente 1')).toBeInTheDocument();
    });
  });

  it('deve filtrar empresas (excluir EMP001)', async () => {
    render(<TaxStatusMatrix />);

    await waitFor(() => {
      expect(http.get).toHaveBeenCalledWith('/api/empresas');
    });

    await waitFor(() => {
      // EMP001 não deve aparecer
      expect(screen.queryByText('Empresa Contabilidade')).not.toBeInTheDocument();
    });
  });

  it('deve exibir status correto para imposto postado', async () => {
    render(<TaxStatusMatrix />);

    await waitFor(() => {
      expect(screen.getByText('Empresa Cliente 1')).toBeInTheDocument();
    });

    // Verificar se o ícone de postado aparece
    await waitFor(() => {
      const statusIcons = screen.getAllByTitle('Postado');
      expect(statusIcons.length).toBeGreaterThan(0);
    });
  });

  it('deve exibir status N/A para imposto não aplicável', async () => {
    render(<TaxStatusMatrix />);

    await waitFor(() => {
      const naIcons = screen.getAllByTitle('Não Aplicável');
      expect(naIcons.length).toBeGreaterThan(0);
    });
  });

  it('deve exibir status não postado quando não tem arquivo nem valor', async () => {
    render(<TaxStatusMatrix />);

    await waitFor(() => {
      const notPostedIcons = screen.getAllByTitle('Não Postado');
      expect(notPostedIcons.length).toBeGreaterThan(0);
    });
  });

  it('deve filtrar por empresa selecionada', async () => {
    render(<TaxStatusMatrix />);

    await waitFor(() => {
      const companyFilter = screen.getByDisplayValue('Todas as Empresas');
      fireEvent.change(companyFilter, { target: { value: '2' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Empresa Cliente 1')).toBeInTheDocument();
      expect(screen.queryByText('Empresa Cliente 2')).not.toBeInTheDocument();
    });
  });

  it('deve mostrar todas as empresas quando filtro é "all"', async () => {
    render(<TaxStatusMatrix />);

    await waitFor(() => {
      const companyFilter = screen.getByDisplayValue('Todas as Empresas');
      fireEvent.change(companyFilter, { target: { value: 'all' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Empresa Cliente 1')).toBeInTheDocument();
      expect(screen.getByText('Empresa Cliente 2')).toBeInTheDocument();
    });
  });

  it('deve alterar mês e recarregar dados', async () => {
    render(<TaxStatusMatrix />);

    await waitFor(() => {
      const monthInput = screen.getByDisplayValue(/\d{4}-\d{2}/);
      fireEvent.change(monthInput, { target: { value: '2025-02' } });
    });

    await waitFor(() => {
      expect(http.get).toHaveBeenCalledWith('/api/obligations?referenceMonth=2025-02');
    });
  });

  it('deve exportar para Excel', async () => {
    const { arrayToCsv, downloadBlob } = await import('../../../../shared/utils/exportUtils');
    
    render(<TaxStatusMatrix />);

    await waitFor(() => {
      const exportButton = screen.getByText('Exportar Excel');
      fireEvent.click(exportButton);
    });

    await waitFor(() => {
      expect(arrayToCsv).toHaveBeenCalled();
      expect(downloadBlob).toHaveBeenCalled();
    });
  });

  it('deve exportar para PDF', async () => {
    const { openPrintWindowWithTable } = await import('../../../../shared/utils/exportUtils');
    
    render(<TaxStatusMatrix />);

    await waitFor(() => {
      const exportButton = screen.getByText('Exportar PDF');
      fireEvent.click(exportButton);
    });

    await waitFor(() => {
      expect(openPrintWindowWithTable).toHaveBeenCalled();
    });
  });

  it('deve exibir mensagem quando não há empresas', async () => {
    http.get.mockImplementation((url) => {
      if (url === '/api/empresas') {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/api/obligations')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<TaxStatusMatrix />);

    await waitFor(() => {
      expect(screen.getByText('Nenhuma empresa encontrada.')).toBeInTheDocument();
    });
  });

  it('deve exibir erro quando falha ao carregar', async () => {
    http.get.mockRejectedValue(new Error('Network error'));

    render(<TaxStatusMatrix />);

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar dados da matriz')).toBeInTheDocument();
    });
  });

  it('deve formatar mês/ano corretamente', async () => {
    render(<TaxStatusMatrix />);

    await waitFor(() => {
      // Verificar se o formato do mês aparece (ex: "Janeiro/2025")
      const monthText = screen.getByText(/\w+\/\d{4}/);
      expect(monthText).toBeInTheDocument();
    });
  });

  it('deve considerar imposto postado quando tem arquivo', async () => {
    render(<TaxStatusMatrix />);

    await waitFor(() => {
      const postedIcons = screen.getAllByTitle('Postado');
      expect(postedIcons.length).toBeGreaterThan(0);
    });
  });

  it('deve considerar imposto postado quando tem valor > 0', async () => {
    http.get.mockImplementation((url) => {
      if (url === '/api/empresas') {
        return Promise.resolve({
          data: [
            { id: 2, codigo: 'EMP002', nome: 'Empresa Cliente 1' },
          ],
        });
      }
      if (url.includes('/api/obligations')) {
        return Promise.resolve({
          data: [
            {
              id: 1,
              companyId: 2,
              taxType: 'DAS',
              status: 'PENDING',
              amount: 1000,
              files: [],
            },
          ],
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<TaxStatusMatrix />);

    await waitFor(() => {
      const postedIcons = screen.getAllByTitle('Postado');
      expect(postedIcons.length).toBeGreaterThan(0);
    });
  });

  it('deve recarregar quando janela recebe foco', async () => {
    render(<TaxStatusMatrix />);

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

  it('deve exibir legenda correta', async () => {
    render(<TaxStatusMatrix />);

    await waitFor(() => {
      expect(screen.getByText('Postado')).toBeInTheDocument();
      expect(screen.getByText('Não Aplicável')).toBeInTheDocument();
      expect(screen.getByText('Não Postado')).toBeInTheDocument();
    });
  });

  it('deve exibir todos os tipos de impostos na tabela', async () => {
    render(<TaxStatusMatrix />);

    await waitFor(() => {
      expect(screen.getByText('DAS')).toBeInTheDocument();
      expect(screen.getByText('ISS Retido')).toBeInTheDocument();
      expect(screen.getByText('FGTS')).toBeInTheDocument();
      expect(screen.getByText('DCTFWeb')).toBeInTheDocument();
      expect(screen.getByText('Outro')).toBeInTheDocument();
    });
  });
});

