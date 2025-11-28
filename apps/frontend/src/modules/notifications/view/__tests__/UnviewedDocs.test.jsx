import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UnviewedDocs from '../UnviewedDocs';
import { useAuth } from '../../../../shared/context/AuthContext';
import { useNotificationController } from '../../controller/useNotificationController';

vi.mock('../../../../shared/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../controller/useNotificationController', () => ({
  useNotificationController: vi.fn(),
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
  FaFile: () => <span data-testid="fa-file">File</span>,
  FaPaperPlane: () => <span data-testid="fa-paper-plane">PaperPlane</span>,
  FaCheckCircle: () => <span data-testid="fa-check-circle">CheckCircle</span>,
  FaClock: () => <span data-testid="fa-clock">Clock</span>,
  FaExclamationTriangle: () => <span data-testid="fa-exclamation-triangle">ExclamationTriangle</span>,
}));

vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('UnviewedDocs.jsx - 100% Coverage', () => {
  const mockFetchUnviewedDocs = vi.fn();
  const mockResendNotification = vi.fn();
  const mockSetError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.window.confirm = vi.fn(() => true);

    useAuth.mockReturnValue({
      user: {
        name: 'Test User',
        role: 'ACCOUNTING_SUPER',
      },
    });

    useNotificationController.mockReturnValue({
      unviewedDocs: [],
      loading: false,
      error: null,
      fetchUnviewedDocs: mockFetchUnviewedDocs,
      resendNotification: mockResendNotification,
      setError: mockSetError,
    });

    // Mock do import dinâmico de http
    vi.doMock('../../../../shared/services/http', () => ({
      default: {
        get: vi.fn().mockResolvedValue({
          data: [
            { id: 1, codigo: 'EMP002', nome: 'Empresa 1' },
            { id: 2, codigo: 'EMP003', nome: 'Empresa 2' },
          ],
        }),
      },
    }));
  });

  it('deve renderizar loading quando carregando', () => {
    useNotificationController.mockReturnValue({
      unviewedDocs: [],
      loading: true,
      error: null,
      fetchUnviewedDocs: mockFetchUnviewedDocs,
      resendNotification: mockResendNotification,
      setError: mockSetError,
    });

    render(<UnviewedDocs />);

    expect(screen.getByText('Carregando documentos não visualizados...')).toBeInTheDocument();
  });

  it('deve carregar documentos ao montar', () => {
    render(<UnviewedDocs />);

    expect(mockFetchUnviewedDocs).toHaveBeenCalledWith({});
  });

  it('deve exibir lista de documentos não visualizados', async () => {
    const mockDocs = [
      {
        id: 1,
        createdAt: '2025-01-15T10:00:00Z',
        companyCode: 'EMP002',
        companyName: 'Empresa 1',
        docType: 'DAS',
        competence: '2025-01',
        dueDate: '2025-01-20T00:00:00Z',
        user: { name: 'User 1' },
      },
      {
        id: 2,
        createdAt: '2025-01-16T10:00:00Z',
        companyCode: 'EMP003',
        companyName: 'Empresa 2',
        docType: 'ISS',
        competence: '2025-01',
        dueDate: '2025-01-25T00:00:00Z',
        user: { name: 'User 2' },
      },
    ];

    useNotificationController.mockReturnValue({
      unviewedDocs: mockDocs,
      loading: false,
      error: null,
      fetchUnviewedDocs: mockFetchUnviewedDocs,
      resendNotification: mockResendNotification,
      setError: mockSetError,
    });

    render(<UnviewedDocs />);

    await waitFor(() => {
      expect(screen.getByText('EMP002')).toBeInTheDocument();
      expect(screen.getByText('Empresa 1')).toBeInTheDocument();
      expect(screen.getByText('DAS')).toBeInTheDocument();
    });
  });

  it('deve exibir mensagem quando não há documentos', () => {
    useNotificationController.mockReturnValue({
      unviewedDocs: [],
      loading: false,
      error: null,
      fetchUnviewedDocs: mockFetchUnviewedDocs,
      resendNotification: mockResendNotification,
      setError: mockSetError,
    });

    render(<UnviewedDocs />);

    expect(screen.getByText(/Nenhum documento não visualizado!/)).toBeInTheDocument();
  });

  it('deve exibir estatísticas corretas', () => {
    const mockDocs = [
      {
        id: 1,
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Vencido
        createdAt: '2025-01-15T10:00:00Z',
        companyCode: 'EMP002',
        companyName: 'Empresa 1',
        docType: 'DAS',
        competence: '2025-01',
        user: { name: 'User 1' },
      },
      {
        id: 2,
        dueDate: new Date(Date.now() + 3 * 86400000).toISOString(), // Vence em 3 dias
        createdAt: '2025-01-16T10:00:00Z',
        companyCode: 'EMP003',
        companyName: 'Empresa 2',
        docType: 'ISS',
        competence: '2025-01',
        user: { name: 'User 2' },
      },
    ];

    useNotificationController.mockReturnValue({
      unviewedDocs: mockDocs,
      loading: false,
      error: null,
      fetchUnviewedDocs: mockFetchUnviewedDocs,
      resendNotification: mockResendNotification,
      setError: mockSetError,
    });

    render(<UnviewedDocs />);

    expect(screen.getByText('2')).toBeInTheDocument(); // Total
    expect(screen.getByText('1')).toBeInTheDocument(); // Vencidos ou vencem em 7 dias
  });

  it('deve exibir badge de vencido para documentos vencidos', () => {
    const mockDocs = [
      {
        id: 1,
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Vencido
        createdAt: '2025-01-15T10:00:00Z',
        companyCode: 'EMP002',
        companyName: 'Empresa 1',
        docType: 'DAS',
        competence: '2025-01',
        user: { name: 'User 1' },
      },
    ];

    useNotificationController.mockReturnValue({
      unviewedDocs: mockDocs,
      loading: false,
      error: null,
      fetchUnviewedDocs: mockFetchUnviewedDocs,
      resendNotification: mockResendNotification,
      setError: mockSetError,
    });

    render(<UnviewedDocs />);

    expect(screen.getByText('Vencido')).toBeInTheDocument();
  });

  it('deve exibir badge de vence em X dias para documentos próximos', () => {
    const mockDocs = [
      {
        id: 1,
        dueDate: new Date(Date.now() + 5 * 86400000).toISOString(), // Vence em 5 dias
        createdAt: '2025-01-15T10:00:00Z',
        companyCode: 'EMP002',
        companyName: 'Empresa 1',
        docType: 'DAS',
        competence: '2025-01',
        user: { name: 'User 1' },
      },
    ];

    useNotificationController.mockReturnValue({
      unviewedDocs: mockDocs,
      loading: false,
      error: null,
      fetchUnviewedDocs: mockFetchUnviewedDocs,
      resendNotification: mockResendNotification,
      setError: mockSetError,
    });

    render(<UnviewedDocs />);

    expect(screen.getByText(/Vence em \d+ dias/)).toBeInTheDocument();
  });

  it('deve filtrar por empresa', async () => {
    const mockDocs = [
      {
        id: 1,
        createdAt: '2025-01-15T10:00:00Z',
        companyCode: 'EMP002',
        companyName: 'Empresa 1',
        docType: 'DAS',
        competence: '2025-01',
        dueDate: '2025-01-20T00:00:00Z',
        user: { name: 'User 1' },
      },
    ];

    useNotificationController.mockReturnValue({
      unviewedDocs: mockDocs,
      loading: false,
      error: null,
      fetchUnviewedDocs: mockFetchUnviewedDocs,
      resendNotification: mockResendNotification,
      setError: mockSetError,
    });

    render(<UnviewedDocs />);

    await waitFor(() => {
      const companyFilter = screen.getByLabelText('Empresa:');
      fireEvent.change(companyFilter, { target: { value: '1' } });
    });

    await waitFor(() => {
      const filterButton = screen.getByText('Filtrar');
      fireEvent.click(filterButton);
    });

    await waitFor(() => {
      expect(mockFetchUnviewedDocs).toHaveBeenCalledWith({ companyId: '1' });
    });
  });

  it('deve limpar filtros', async () => {
    render(<UnviewedDocs />);

    await waitFor(() => {
      const clearButton = screen.getByText('Limpar');
      fireEvent.click(clearButton);
    });

    await waitFor(() => {
      expect(mockFetchUnviewedDocs).toHaveBeenCalledWith({});
    });
  });

  it('deve reenviar notificação', async () => {
    mockResendNotification.mockResolvedValue({ sent: 2, total: 3 });

    const mockDocs = [
      {
        id: 1,
        createdAt: '2025-01-15T10:00:00Z',
        companyCode: 'EMP002',
        companyName: 'Empresa 1',
        docType: 'DAS',
        competence: '2025-01',
        dueDate: '2025-01-20T00:00:00Z',
        user: { name: 'User 1' },
      },
    ];

    useNotificationController.mockReturnValue({
      unviewedDocs: mockDocs,
      loading: false,
      error: null,
      fetchUnviewedDocs: mockFetchUnviewedDocs,
      resendNotification: mockResendNotification,
      setError: mockSetError,
    });

    render(<UnviewedDocs />);

    await waitFor(() => {
      const resendButtons = screen.getAllByText('Reenviar Aviso');
      fireEvent.click(resendButtons[0]);
    });

    await waitFor(() => {
      expect(global.window.confirm).toHaveBeenCalled();
      expect(mockResendNotification).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(screen.getByText(/Notificação enviada com sucesso!/)).toBeInTheDocument();
    });
  });

  it('deve não reenviar se usuário cancelar confirmação', async () => {
    global.window.confirm = vi.fn(() => false);

    const mockDocs = [
      {
        id: 1,
        createdAt: '2025-01-15T10:00:00Z',
        companyCode: 'EMP002',
        companyName: 'Empresa 1',
        docType: 'DAS',
        competence: '2025-01',
        dueDate: '2025-01-20T00:00:00Z',
        user: { name: 'User 1' },
      },
    ];

    useNotificationController.mockReturnValue({
      unviewedDocs: mockDocs,
      loading: false,
      error: null,
      fetchUnviewedDocs: mockFetchUnviewedDocs,
      resendNotification: mockResendNotification,
      setError: mockSetError,
    });

    render(<UnviewedDocs />);

    await waitFor(() => {
      const resendButtons = screen.getAllByText('Reenviar Aviso');
      fireEvent.click(resendButtons[0]);
    });

    await waitFor(() => {
      expect(mockResendNotification).not.toHaveBeenCalled();
    });
  });

  it('deve mostrar loading durante reenvio', async () => {
    mockResendNotification.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    const mockDocs = [
      {
        id: 1,
        createdAt: '2025-01-15T10:00:00Z',
        companyCode: 'EMP002',
        companyName: 'Empresa 1',
        docType: 'DAS',
        competence: '2025-01',
        dueDate: '2025-01-20T00:00:00Z',
        user: { name: 'User 1' },
      },
    ];

    useNotificationController.mockReturnValue({
      unviewedDocs: mockDocs,
      loading: false,
      error: null,
      fetchUnviewedDocs: mockFetchUnviewedDocs,
      resendNotification: mockResendNotification,
      setError: mockSetError,
    });

    render(<UnviewedDocs />);

    await waitFor(() => {
      const resendButtons = screen.getAllByText('Reenviar Aviso');
      fireEvent.click(resendButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('Enviando...')).toBeInTheDocument();
    });
  });

  it('deve exibir erro quando existe', () => {
    useNotificationController.mockReturnValue({
      unviewedDocs: [],
      loading: false,
      error: 'Erro ao carregar',
      fetchUnviewedDocs: mockFetchUnviewedDocs,
      resendNotification: mockResendNotification,
      setError: mockSetError,
    });

    render(<UnviewedDocs />);

    expect(screen.getByText('Erro ao carregar')).toBeInTheDocument();
  });

  it('deve exportar para Excel', async () => {
    const { arrayToCsv, downloadBlob } = await import('../../../../shared/utils/exportUtils');

    const mockDocs = [
      {
        id: 1,
        createdAt: '2025-01-15T10:00:00Z',
        companyCode: 'EMP002',
        companyName: 'Empresa 1',
        docType: 'DAS',
        competence: '2025-01',
        dueDate: '2025-01-20T00:00:00Z',
        user: { name: 'User 1' },
      },
    ];

    useNotificationController.mockReturnValue({
      unviewedDocs: mockDocs,
      loading: false,
      error: null,
      fetchUnviewedDocs: mockFetchUnviewedDocs,
      resendNotification: mockResendNotification,
      setError: mockSetError,
    });

    render(<UnviewedDocs />);

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

    const mockDocs = [
      {
        id: 1,
        createdAt: '2025-01-15T10:00:00Z',
        companyCode: 'EMP002',
        companyName: 'Empresa 1',
        docType: 'DAS',
        competence: '2025-01',
        dueDate: '2025-01-20T00:00:00Z',
        user: { name: 'User 1' },
      },
    ];

    useNotificationController.mockReturnValue({
      unviewedDocs: mockDocs,
      loading: false,
      error: null,
      fetchUnviewedDocs: mockFetchUnviewedDocs,
      resendNotification: mockResendNotification,
      setError: mockSetError,
    });

    render(<UnviewedDocs />);

    await waitFor(() => {
      const exportButton = screen.getByText('Exportar PDF');
      fireEvent.click(exportButton);
    });

    await waitFor(() => {
      expect(openPrintWindowWithTable).toHaveBeenCalled();
    });
  });

  it('deve formatar data corretamente', () => {
    const mockDocs = [
      {
        id: 1,
        createdAt: '2025-01-15T10:00:00Z',
        companyCode: 'EMP002',
        companyName: 'Empresa 1',
        docType: 'DAS',
        competence: '2025-01',
        dueDate: '2025-01-20T00:00:00Z',
        user: { name: 'User 1' },
      },
    ];

    useNotificationController.mockReturnValue({
      unviewedDocs: mockDocs,
      loading: false,
      error: null,
      fetchUnviewedDocs: mockFetchUnviewedDocs,
      resendNotification: mockResendNotification,
      setError: mockSetError,
    });

    render(<UnviewedDocs />);

    // Verificar se a data formatada aparece (formato pt-BR)
    expect(screen.getByText(/15\/01\/2025/)).toBeInTheDocument();
  });

  it('deve exibir N/A quando usuário não existe', () => {
    const mockDocs = [
      {
        id: 1,
        createdAt: '2025-01-15T10:00:00Z',
        companyCode: 'EMP002',
        companyName: 'Empresa 1',
        docType: 'DAS',
        competence: '2025-01',
        dueDate: '2025-01-20T00:00:00Z',
        user: null,
      },
    ];

    useNotificationController.mockReturnValue({
      unviewedDocs: mockDocs,
      loading: false,
      error: null,
      fetchUnviewedDocs: mockFetchUnviewedDocs,
      resendNotification: mockResendNotification,
      setError: mockSetError,
    });

    render(<UnviewedDocs />);

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('deve limpar mensagem de sucesso após 3 segundos', async () => {
    vi.useFakeTimers();
    mockResendNotification.mockResolvedValue({ sent: 2, total: 3 });

    const mockDocs = [
      {
        id: 1,
        createdAt: '2025-01-15T10:00:00Z',
        companyCode: 'EMP002',
        companyName: 'Empresa 1',
        docType: 'DAS',
        competence: '2025-01',
        dueDate: '2025-01-20T00:00:00Z',
        user: { name: 'User 1' },
      },
    ];

    useNotificationController.mockReturnValue({
      unviewedDocs: mockDocs,
      loading: false,
      error: null,
      fetchUnviewedDocs: mockFetchUnviewedDocs,
      resendNotification: mockResendNotification,
      setError: mockSetError,
    });

    render(<UnviewedDocs />);

    await waitFor(() => {
      const resendButtons = screen.getAllByText('Reenviar Aviso');
      fireEvent.click(resendButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(/Notificação enviada com sucesso!/)).toBeInTheDocument();
    });

    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText(/Notificação enviada com sucesso!/)).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('deve recarregar lista após reenviar', async () => {
    mockResendNotification.mockResolvedValue({ sent: 2, total: 3 });

    const mockDocs = [
      {
        id: 1,
        createdAt: '2025-01-15T10:00:00Z',
        companyCode: 'EMP002',
        companyName: 'Empresa 1',
        docType: 'DAS',
        competence: '2025-01',
        dueDate: '2025-01-20T00:00:00Z',
        user: { name: 'User 1' },
      },
    ];

    useNotificationController.mockReturnValue({
      unviewedDocs: mockDocs,
      loading: false,
      error: null,
      fetchUnviewedDocs: mockFetchUnviewedDocs,
      resendNotification: mockResendNotification,
      setError: mockSetError,
    });

    render(<UnviewedDocs />);

    vi.clearAllMocks();

    await waitFor(() => {
      const resendButtons = screen.getAllByText('Reenviar Aviso');
      fireEvent.click(resendButtons[0]);
    });

    await waitFor(() => {
      // Deve recarregar após 3 segundos
      vi.useFakeTimers();
      vi.advanceTimersByTime(3000);
      expect(mockFetchUnviewedDocs).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});

