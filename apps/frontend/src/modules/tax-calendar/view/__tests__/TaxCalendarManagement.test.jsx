import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaxCalendarManagement from '../TaxCalendarManagement';
import { useAuth } from '../../../../shared/context/AuthContext';
import http from '../../../../shared/services/http';

vi.mock('../../../../shared/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
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

vi.mock('react-icons/fa', () => ({
  FaCalendarAlt: () => <span data-testid="fa-calendar-alt">CalendarAlt</span>,
}));

describe('TaxCalendarManagement.jsx - 100% Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    useAuth.mockReturnValue({
      user: {
        name: 'Test User',
        role: 'ACCOUNTING_SUPER',
      },
    });

    http.get.mockResolvedValue({
      data: [
        { taxType: 'DAS', dueDay: 20, description: 'Vence todo dia 20' },
        { taxType: 'ISS_RETIDO', dueDay: 15, description: 'Vence todo dia 15' },
      ],
    });

    http.post.mockResolvedValue({ data: { success: true } });
  });

  it('deve renderizar loading inicialmente', async () => {
    render(<TaxCalendarManagement />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('deve carregar calendário fiscal', async () => {
    render(<TaxCalendarManagement />);

    await waitFor(() => {
      expect(http.get).toHaveBeenCalledWith('/api/tax-calendar');
    });

    await waitFor(() => {
      expect(screen.getByText('DAS')).toBeInTheDocument();
      expect(screen.getByText('ISS Retido')).toBeInTheDocument();
      expect(screen.getByText('FGTS')).toBeInTheDocument();
      expect(screen.getByText('DCTFWeb')).toBeInTheDocument();
    });
  });

  it('deve exibir valores carregados do backend', async () => {
    render(<TaxCalendarManagement />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('20')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Vence todo dia 20')).toBeInTheDocument();
    });
  });

  it('deve permitir editar dia de vencimento', async () => {
    render(<TaxCalendarManagement />);

    await waitFor(() => {
      const dayInput = screen.getByDisplayValue('20');
      fireEvent.change(dayInput, { target: { value: '25' } });
      expect(dayInput.value).toBe('25');
    });
  });

  it('deve permitir editar descrição', async () => {
    render(<TaxCalendarManagement />);

    await waitFor(() => {
      const descInput = screen.getByDisplayValue('Vence todo dia 20');
      fireEvent.change(descInput, { target: { value: 'Nova descrição' } });
      expect(descInput.value).toBe('Nova descrição');
    });
  });

  it('deve salvar vencimento com sucesso', async () => {
    render(<TaxCalendarManagement />);

    await waitFor(() => {
      const dayInput = screen.getByDisplayValue('20');
      fireEvent.change(dayInput, { target: { value: '25' } });
    });

    await waitFor(() => {
      const saveButtons = screen.getAllByText('Salvar');
      fireEvent.click(saveButtons[0]);
    });

    await waitFor(() => {
      expect(http.post).toHaveBeenCalledWith('/api/tax-calendar', {
        taxType: 'DAS',
        dueDay: 25,
        description: 'Vence todo dia 20',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Vencimento de DAS salvo com sucesso!/)).toBeInTheDocument();
    });
  });

  it('deve validar dia inválido (< 1)', async () => {
    render(<TaxCalendarManagement />);

    await waitFor(() => {
      const dayInput = screen.getByDisplayValue('20');
      fireEvent.change(dayInput, { target: { value: '0' } });
    });

    await waitFor(() => {
      const saveButtons = screen.getAllByText('Salvar');
      fireEvent.click(saveButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(/Dia inválido para DAS/)).toBeInTheDocument();
    });
  });

  it('deve validar dia inválido (> 31)', async () => {
    render(<TaxCalendarManagement />);

    await waitFor(() => {
      const dayInput = screen.getByDisplayValue('20');
      fireEvent.change(dayInput, { target: { value: '32' } });
    });

    await waitFor(() => {
      const saveButtons = screen.getAllByText('Salvar');
      fireEvent.click(saveButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(/Dia inválido para DAS/)).toBeInTheDocument();
    });
  });

  it('deve desabilitar botão salvar quando dia está vazio', async () => {
    render(<TaxCalendarManagement />);

    await waitFor(() => {
      const dayInput = screen.getByDisplayValue('20');
      fireEvent.change(dayInput, { target: { value: '' } });
    });

    await waitFor(() => {
      const saveButtons = screen.getAllByText('Salvar');
      expect(saveButtons[0]).toBeDisabled();
    });
  });

  it('deve exibir erro quando falha ao carregar', async () => {
    http.get.mockRejectedValue(new Error('Network error'));

    render(<TaxCalendarManagement />);

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar calendário fiscal')).toBeInTheDocument();
    });
  });

  it('deve exibir erro quando falha ao salvar', async () => {
    http.post.mockRejectedValue(new Error('Save error'));

    render(<TaxCalendarManagement />);

    await waitFor(() => {
      const dayInput = screen.getByDisplayValue('20');
      fireEvent.change(dayInput, { target: { value: '25' } });
    });

    await waitFor(() => {
      const saveButtons = screen.getAllByText('Salvar');
      fireEvent.click(saveButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('Erro ao salvar vencimento')).toBeInTheDocument();
    });
  });

  it('deve mesclar dados do backend com tipos padrão', async () => {
    http.get.mockResolvedValue({
      data: [
        { taxType: 'DAS', dueDay: 20, description: 'Vence dia 20' },
      ],
    });

    render(<TaxCalendarManagement />);

    await waitFor(() => {
      // Deve mostrar DAS com dados do backend
      expect(screen.getByDisplayValue('20')).toBeInTheDocument();
      // Deve mostrar outros tipos sem dados (vazios)
      expect(screen.getByText('ISS Retido')).toBeInTheDocument();
      expect(screen.getByText('FGTS')).toBeInTheDocument();
      expect(screen.getByText('DCTFWeb')).toBeInTheDocument();
    });
  });

  it('deve limpar mensagem de sucesso após 3 segundos', async () => {
    vi.useFakeTimers();

    render(<TaxCalendarManagement />);

    await waitFor(() => {
      const dayInput = screen.getByDisplayValue('20');
      fireEvent.change(dayInput, { target: { value: '25' } });
    });

    await waitFor(() => {
      const saveButtons = screen.getAllByText('Salvar');
      fireEvent.click(saveButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(/salvo com sucesso!/)).toBeInTheDocument();
    });

    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText(/salvo com sucesso!/)).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('deve recarregar calendário após salvar', async () => {
    render(<TaxCalendarManagement />);

    await waitFor(() => {
      expect(http.get).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      const dayInput = screen.getByDisplayValue('20');
      fireEvent.change(dayInput, { target: { value: '25' } });
    });

    await waitFor(() => {
      const saveButtons = screen.getAllByText('Salvar');
      fireEvent.click(saveButtons[0]);
    });

    await waitFor(() => {
      // Deve recarregar após salvar
      expect(http.get).toHaveBeenCalledTimes(2);
    });
  });

  it('deve converter dueDay para número ao salvar', async () => {
    render(<TaxCalendarManagement />);

    await waitFor(() => {
      const dayInput = screen.getByDisplayValue('20');
      fireEvent.change(dayInput, { target: { value: '25' } });
    });

    await waitFor(() => {
      const saveButtons = screen.getAllByText('Salvar');
      fireEvent.click(saveButtons[0]);
    });

    await waitFor(() => {
      expect(http.post).toHaveBeenCalledWith(
        '/api/tax-calendar',
        expect.objectContaining({
          dueDay: 25, // Deve ser número, não string
        })
      );
    });
  });

  it('deve exibir observação sobre tipo OUTRO', async () => {
    render(<TaxCalendarManagement />);

    await waitFor(() => {
      expect(screen.getByText(/OUTRO não tem vencimento fixo/)).toBeInTheDocument();
    });
  });
});

