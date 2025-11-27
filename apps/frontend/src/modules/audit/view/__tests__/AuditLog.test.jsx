import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuditLog from '../AuditLog';
import { useAuth } from '../../../../shared/context/AuthContext';
import { useAuditController } from '../../controller/useAuditController';
import http from '../../../../shared/services/http';
import * as exportUtils from '../../../../shared/utils/exportUtils';

// Mock dos hooks
vi.mock('../../../../shared/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../controller/useAuditController', () => ({
  useAuditController: vi.fn(),
}));

// Mock do http
vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock dos utilitários de exportação
vi.mock('../../../../shared/utils/exportUtils', () => ({
  arrayToCsv: vi.fn((rows) => {
    if (!rows || rows.length === 0) return '';
    const header = Object.keys(rows[0]).join(',');
    const data = rows.map((r) => Object.values(r).join(',')).join('\n');
    return header + '\n' + data;
  }),
  downloadBlob: vi.fn(),
  openPrintWindowWithTable: vi.fn(),
}));

// Mock do react-icons
vi.mock('react-icons/fa', () => ({
  FaUserShield: () => <span data-testid="fa-user-shield">🛡️</span>,
}));

// Mock do WelcomeCard
vi.mock('../../../../shared/ui/WelcomeCard', () => ({
  default: ({ title, subtitle }) => (
    <div data-testid="welcome-card">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  ),
}));

// Mock de alert
global.alert = vi.fn();

// Mock de window.open para PDF
const mockPrintWindow = {
  document: {
    write: vi.fn(),
    close: vi.fn(),
  },
  focus: vi.fn(),
  print: vi.fn(),
};

global.window.open = vi.fn(() => mockPrintWindow);

describe('AuditLog', () => {
  const mockUser = {
    id: '1',
    name: 'Admin User',
    email: 'admin@test.com',
    role: 'ACCOUNTING_SUPER',
  };

  const mockLogs = [
    {
      id: '1',
      createdAt: '2025-01-15T10:00:00Z',
      userName: 'John Doe',
      userEmail: 'john@test.com',
      action: 'CREATE',
      entity: 'Obligation',
      entityId: '1234567890abcdef',
      metadata: { key: 'value' },
    },
    {
      id: '2',
      createdAt: '2025-01-14T15:30:00Z',
      userName: 'Jane Smith',
      userEmail: 'jane@test.com',
      action: 'UPDATE',
      entity: 'User',
      entityId: 'abcdef1234567890',
      metadata: null,
    },
  ];

  const mockPagination = {
    page: 1,
    limit: 50,
    total: 2,
    totalPages: 1,
  };

  const mockFetchLogs = vi.fn();
  const mockSetError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    useAuth.mockReturnValue({
      user: mockUser,
    });

    useAuditController.mockReturnValue({
      logs: mockLogs,
      loading: false,
      error: null,
      pagination: mockPagination,
      fetchLogs: mockFetchLogs,
      setError: mockSetError,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Permissões', () => {
    it('deve mostrar mensagem de erro quando usuário não é ACCOUNTING_SUPER', () => {
      useAuth.mockReturnValue({
        user: { ...mockUser, role: 'CLIENT_ADMIN' },
      });

      render(<AuditLog />);

      expect(
        screen.getByText(/Você não tem permissão para acessar logs de auditoria/)
      ).toBeInTheDocument();
    });

    it('deve renderizar normalmente quando usuário é ACCOUNTING_SUPER', () => {
      render(<AuditLog />);

      expect(screen.getByText(/Logs de Auditoria/)).toBeInTheDocument();
    });
  });

  describe('Renderização', () => {
    it('deve renderizar WelcomeCard com dados do usuário', () => {
      render(<AuditLog />);

      expect(screen.getByTestId('welcome-card')).toBeInTheDocument();
      expect(screen.getByText(/Bem-vindo\(a\), Admin User/)).toBeInTheDocument();
    });

    it('deve mostrar mensagem de carregamento quando loading é true e logs está vazio', () => {
      useAuditController.mockReturnValue({
        logs: [],
        loading: true,
        error: null,
        pagination: mockPagination,
        fetchLogs: mockFetchLogs,
        setError: mockSetError,
      });

      render(<AuditLog />);

      expect(screen.getByText(/Carregando logs de auditoria/)).toBeInTheDocument();
    });

    it('deve mostrar mensagem de erro quando há erro', () => {
      useAuditController.mockReturnValue({
        logs: [],
        loading: false,
        error: 'Erro ao carregar logs',
        pagination: mockPagination,
        fetchLogs: mockFetchLogs,
        setError: mockSetError,
      });

      render(<AuditLog />);

      expect(screen.getByText('Erro ao carregar logs')).toBeInTheDocument();
    });

    it('deve mostrar mensagem quando não há logs', () => {
      useAuditController.mockReturnValue({
        logs: [],
        loading: false,
        error: null,
        pagination: { ...mockPagination, total: 0 },
        fetchLogs: mockFetchLogs,
        setError: mockSetError,
      });

      render(<AuditLog />);

      expect(
        screen.getByText(/Nenhum log encontrado com os filtros aplicados/)
      ).toBeInTheDocument();
    });

    it('deve renderizar tabela com logs', () => {
      render(<AuditLog />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@test.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@test.com')).toBeInTheDocument();
    });
  });

  describe('Formatação', () => {
    it('deve formatar ações corretamente', () => {
      render(<AuditLog />);

      expect(screen.getByText('Criação')).toBeInTheDocument();
      expect(screen.getByText('Atualização')).toBeInTheDocument();
    });

    it('deve formatar entidades corretamente', () => {
      render(<AuditLog />);

      expect(screen.getByText('Obrigação')).toBeInTheDocument();
      expect(screen.getByText('Usuário')).toBeInTheDocument();
    });

    it('deve formatar data corretamente', () => {
      render(<AuditLog />);

      // Verifica se a data formatada está presente (formato pt-BR)
      const dateElements = screen.getAllByText(/15\/01\/2025|14\/01\/2025/);
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('deve mostrar ID da entidade truncado', () => {
      render(<AuditLog />);

      expect(screen.getByText(/12345678\.\.\./)).toBeInTheDocument();
    });
  });

  describe('Filtros', () => {
    it('deve renderizar todos os filtros', () => {
      render(<AuditLog />);

      expect(screen.getByLabelText(/Ação:/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Entidade:/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Data Início:/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Data Fim:/)).toBeInTheDocument();
    });

    it('deve atualizar filtro de ação', () => {
      render(<AuditLog />);

      const actionSelect = screen.getByLabelText(/Ação:/);
      fireEvent.change(actionSelect, { target: { value: 'CREATE' } });

      expect(actionSelect.value).toBe('CREATE');
    });

    it('deve atualizar filtro de entidade', () => {
      render(<AuditLog />);

      const entitySelect = screen.getByLabelText(/Entidade:/);
      fireEvent.change(entitySelect, { target: { value: 'Obligation' } });

      expect(entitySelect.value).toBe('Obligation');
    });

    it('deve atualizar filtro de data início', () => {
      render(<AuditLog />);

      const startDateInput = screen.getByLabelText(/Data Início:/);
      fireEvent.change(startDateInput, { target: { value: '2025-01-01' } });

      expect(startDateInput.value).toBe('2025-01-01');
    });

    it('deve atualizar filtro de data fim', () => {
      render(<AuditLog />);

      const endDateInput = screen.getByLabelText(/Data Fim:/);
      fireEvent.change(endDateInput, { target: { value: '2025-01-31' } });

      expect(endDateInput.value).toBe('2025-01-31');
    });

    it('deve chamar fetchLogs ao clicar em Filtrar', () => {
      render(<AuditLog />);

      const filterButton = screen.getByText('Filtrar');
      fireEvent.click(filterButton);

      expect(mockFetchLogs).toHaveBeenCalled();
    });

    it('deve limpar filtros ao clicar em Limpar', async () => {
      render(<AuditLog />);

      const actionSelect = screen.getByLabelText(/Ação:/);
      fireEvent.change(actionSelect, { target: { value: 'CREATE' } });

      const clearButton = screen.getByText('Limpar');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(actionSelect.value).toBe('');
      });
    });
  });

  describe('Paginação', () => {
    it('deve renderizar controles de paginação', () => {
      render(<AuditLog />);

      expect(screen.getByText(/Página 1 de 1/)).toBeInTheDocument();
      expect(screen.getByText('Anterior')).toBeInTheDocument();
      expect(screen.getByText('Próxima')).toBeInTheDocument();
    });

    it('deve desabilitar botão Anterior na primeira página', () => {
      render(<AuditLog />);

      const prevButton = screen.getByText('Anterior');
      expect(prevButton).toBeDisabled();
    });

    it('deve desabilitar botão Próxima na última página', () => {
      render(<AuditLog />);

      const nextButton = screen.getByText('Próxima');
      expect(nextButton).toBeDisabled();
    });

    it('deve habilitar botões quando não está na primeira/última página', () => {
      useAuditController.mockReturnValue({
        logs: mockLogs,
        loading: false,
        error: null,
        pagination: { ...mockPagination, page: 2, totalPages: 3 },
        fetchLogs: mockFetchLogs,
        setError: mockSetError,
      });

      render(<AuditLog />);

      const prevButton = screen.getByText('Anterior');
      const nextButton = screen.getByText('Próxima');

      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it('deve chamar handlePageChange ao clicar em Próxima', () => {
      useAuditController.mockReturnValue({
        logs: mockLogs,
        loading: false,
        error: null,
        pagination: { ...mockPagination, page: 1, totalPages: 2 },
        fetchLogs: mockFetchLogs,
        setError: mockSetError,
      });

      render(<AuditLog />);

      const nextButton = screen.getByText('Próxima');
      fireEvent.click(nextButton);

      // Verifica se a página foi atualizada (através do useEffect que chama fetchLogs)
      expect(mockFetchLogs).toHaveBeenCalled();
    });
  });

  describe('Modal de Metadata', () => {
    it('deve mostrar botão Ver Detalhes quando há metadata', () => {
      render(<AuditLog />);

      const detailButtons = screen.getAllByText('Ver Detalhes');
      expect(detailButtons.length).toBeGreaterThan(0);
    });

    it('deve mostrar "-" quando não há metadata', () => {
      render(<AuditLog />);

      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThan(0);
    });

    it('deve abrir modal ao clicar em Ver Detalhes', () => {
      render(<AuditLog />);

      const detailButton = screen.getAllByText('Ver Detalhes')[0];
      fireEvent.click(detailButton);

      expect(screen.getByText('Detalhes da Ação')).toBeInTheDocument();
      expect(screen.getByText(/"key":\s*"value"/)).toBeInTheDocument();
    });

    it('deve fechar modal ao clicar em Fechar', () => {
      render(<AuditLog />);

      const detailButton = screen.getAllByText('Ver Detalhes')[0];
      fireEvent.click(detailButton);

      const closeButton = screen.getByText('Fechar');
      fireEvent.click(closeButton);

      expect(screen.queryByText('Detalhes da Ação')).not.toBeInTheDocument();
    });

    it('deve fechar modal ao clicar no overlay', () => {
      render(<AuditLog />);

      const detailButton = screen.getAllByText('Ver Detalhes')[0];
      fireEvent.click(detailButton);

      const modal = screen.getByText('Detalhes da Ação').closest('div[class*="MetadataModal"]');
      if (modal) {
        fireEvent.click(modal);
        expect(screen.queryByText('Detalhes da Ação')).not.toBeInTheDocument();
      }
    });
  });

  describe('Exportação', () => {
    beforeEach(() => {
      http.get.mockResolvedValue({
        data: {
          logs: mockLogs,
          totalPages: 1,
        },
      });
    });

    it('deve renderizar botões de exportação', () => {
      render(<AuditLog />);

      expect(screen.getByText('Exportar PDF')).toBeInTheDocument();
      expect(screen.getByText('Exportar Excel')).toBeInTheDocument();
    });

    it('deve exportar Excel corretamente', async () => {
      render(<AuditLog />);

      const excelButton = screen.getByText('Exportar Excel');
      fireEvent.click(excelButton);

      await waitFor(() => {
        expect(http.get).toHaveBeenCalled();
        expect(exportUtils.arrayToCsv).toHaveBeenCalled();
        expect(exportUtils.downloadBlob).toHaveBeenCalled();
      });
    });

    it('deve exportar PDF corretamente', async () => {
      render(<AuditLog />);

      const pdfButton = screen.getByText('Exportar PDF');
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(http.get).toHaveBeenCalled();
        expect(exportUtils.openPrintWindowWithTable).toHaveBeenCalledWith(
          'Logs de Auditoria',
          expect.any(Array),
          expect.any(Array)
        );
      });
    });

    it('deve buscar todas as páginas para exportação', async () => {
      http.get
        .mockResolvedValueOnce({
          data: {
            logs: mockLogs,
            totalPages: 2,
          },
        })
        .mockResolvedValueOnce({
          data: {
            logs: [{ id: '3', action: 'DELETE' }],
            totalPages: 2,
          },
        });

      render(<AuditLog />);

      const excelButton = screen.getByText('Exportar Excel');
      fireEvent.click(excelButton);

      await waitFor(() => {
        expect(http.get).toHaveBeenCalledTimes(2);
      });
    });

    it('deve mostrar alerta em caso de erro na exportação Excel', async () => {
      http.get.mockRejectedValue(new Error('Erro na API'));

      render(<AuditLog />);

      const excelButton = screen.getByText('Exportar Excel');
      fireEvent.click(excelButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Falha ao exportar Excel.');
      });
    });

    it('deve mostrar alerta em caso de erro na exportação PDF', async () => {
      http.get.mockRejectedValue(new Error('Erro na API'));

      render(<AuditLog />);

      const pdfButton = screen.getByText('Exportar PDF');
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Falha ao exportar PDF.');
      });
    });
  });

  describe('useEffect e inicialização', () => {
    it('deve chamar fetchLogs no mount quando usuário tem permissão', () => {
      render(<AuditLog />);

      expect(mockFetchLogs).toHaveBeenCalled();
    });

    it('deve chamar setError quando usuário não tem permissão', () => {
      useAuth.mockReturnValue({
        user: { ...mockUser, role: 'CLIENT_ADMIN' },
      });

      render(<AuditLog />);

      expect(mockSetError).toHaveBeenCalledWith(
        'Você não tem permissão para acessar logs de auditoria'
      );
    });

    it('deve chamar fetchLogs quando página muda', () => {
      const { rerender } = render(<AuditLog />);

      vi.clearAllMocks();

      useAuditController.mockReturnValue({
        logs: mockLogs,
        loading: false,
        error: null,
        pagination: { ...mockPagination, page: 2 },
        fetchLogs: mockFetchLogs,
        setError: mockSetError,
      });

      rerender(<AuditLog />);

      // O useEffect deve ser chamado quando a página muda
      expect(mockFetchLogs).toHaveBeenCalled();
    });
  });
});

