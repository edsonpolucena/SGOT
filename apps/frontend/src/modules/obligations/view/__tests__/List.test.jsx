import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import List from '../List';
import * as api from '../../data/obligation.api';
import Header from '../../../../shared/ui/Header';

vi.mock('../../data/obligation.api', () => ({
  list: vi.fn(),
  remove_: vi.fn(),
}));

vi.mock('../../../../shared/ui/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

// Mock de confirm e alert
global.confirm = vi.fn();
global.alert = vi.fn();

describe('List.jsx - 100% Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar loading inicialmente', () => {
    api.list.mockImplementation(() => new Promise(() => {}));

    render(
      <BrowserRouter>
        <List />
      </BrowserRouter>
    );

    expect(screen.getByText('Carregando…')).toBeInTheDocument();
  });

  it('deve carregar e exibir obrigações', async () => {
    const mockObligations = [
      {
        id: '1',
        title: 'DAS - 01/2025',
        dueDate: '2025-01-15',
        amount: 1000,
        status: 'PENDING',
        notes: JSON.stringify({
          companyName: 'Empresa Test',
          cnpj: '12345678000190',
          docType: 'DAS',
          competence: '01/2025',
        }),
      },
    ];

    api.list.mockResolvedValue({ data: mockObligations });

    render(
      <BrowserRouter>
        <List />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Empresa Test')).toBeInTheDocument();
      expect(screen.getByText('DAS')).toBeInTheDocument();
      expect(screen.getByText('01/2025')).toBeInTheDocument();
    });
  });

  it('deve exibir erro quando carregamento falha', async () => {
    api.list.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <List />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Falha ao carregar obrigações')).toBeInTheDocument();
    });
  });

  it('deve exibir mensagem quando não há obrigações', async () => {
    api.list.mockResolvedValue({ data: [] });

    render(
      <BrowserRouter>
        <List />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nenhum registro.')).toBeInTheDocument();
    });
  });

  it('deve deletar obrigação quando confirmado', async () => {
    const mockObligations = [
      {
        id: '1',
        title: 'DAS - 01/2025',
        dueDate: '2025-01-15',
        amount: 1000,
        status: 'PENDING',
        notes: '{}',
      },
    ];

    api.list.mockResolvedValue({ data: mockObligations });
    global.confirm.mockReturnValue(true);
    api.remove_.mockResolvedValue({});

    render(
      <BrowserRouter>
        <List />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Excluir').length).toBeGreaterThan(0);
    });

    const deleteButtons = screen.getAllByText('Excluir');
    const deleteButton = deleteButtons[0];
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(api.remove_).toHaveBeenCalledWith('1');
      expect(screen.queryByText('DAS - 01/2025')).not.toBeInTheDocument();
    });
  });

  it('não deve deletar quando cancelado', async () => {
    const mockObligations = [
      {
        id: '1',
        title: 'DAS - 01/2025',
        dueDate: '2025-01-15',
        amount: 1000,
        status: 'PENDING',
        notes: '{}',
      },
    ];

    api.list.mockResolvedValue({ data: mockObligations });
    global.confirm.mockReturnValue(false);

    render(
      <BrowserRouter>
        <List />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Excluir').length).toBeGreaterThan(0);
    });

    const deleteButtons = screen.getAllByText('Excluir');
    const deleteButton = deleteButtons[0];
    fireEvent.click(deleteButton);

    expect(api.remove_).not.toHaveBeenCalled();
  });

  it('deve mostrar alerta quando exclusão falha', async () => {
    const mockObligations = [
      {
        id: '1',
        title: 'DAS - 01/2025',
        dueDate: '2025-01-15',
        amount: 1000,
        status: 'PENDING',
        notes: '{}',
      },
    ];

    api.list.mockResolvedValue({ data: mockObligations });
    global.confirm.mockReturnValue(true);
    api.remove_.mockRejectedValue(new Error('Delete failed'));

    render(
      <BrowserRouter>
        <List />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Excluir').length).toBeGreaterThan(0);
    });

    const deleteButtons = screen.getAllByText('Excluir');
    const deleteButton = deleteButtons[0];
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Falha ao excluir');
    });
  });

  it('deve parsear notes corretamente', async () => {
    const mockObligations = [
      {
        id: '1',
        title: 'DAS - 01/2025',
        dueDate: '2025-01-15',
        amount: 1000,
        status: 'PENDING',
        notes: JSON.stringify({
          companyName: 'Test Company',
          cnpj: '12345678000190',
          docType: 'DAS',
          competence: '01/2025',
        }),
      },
    ];

    api.list.mockResolvedValue({ data: mockObligations });

    render(
      <BrowserRouter>
        <List />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });
  });

  it('deve lidar com notes inválidas', async () => {
    const mockObligations = [
      {
        id: '1',
        title: 'DAS - 01/2025',
        dueDate: '2025-01-15',
        amount: 1000,
        status: 'PENDING',
        notes: 'invalid json',
      },
    ];

    api.list.mockResolvedValue({ data: mockObligations });

    render(
      <BrowserRouter>
        <List />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  it('deve formatar valor monetário corretamente', async () => {
    const mockObligations = [
      {
        id: '1',
        title: 'DAS - 01/2025',
        dueDate: '2025-01-15',
        amount: 1234.56,
        status: 'PENDING',
        notes: '{}',
      },
    ];

    api.list.mockResolvedValue({ data: mockObligations });

    render(
      <BrowserRouter>
        <List />
      </BrowserRouter>
    );

    await waitFor(() => {
      const amountCell = screen.getByText(/R\$/);
      expect(amountCell.textContent).toContain('1.234,56');
    });
  });

  it('deve exibir — quando amount é null', async () => {
    const mockObligations = [
      {
        id: '1',
        title: 'DAS - 01/2025',
        dueDate: '2025-01-15',
        amount: null,
        status: 'PENDING',
        notes: '{}',
      },
    ];

    api.list.mockResolvedValue({ data: mockObligations });

    render(
      <BrowserRouter>
        <List />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  it('deve exibir status corretamente', async () => {
    const mockObligations = [
      {
        id: '1',
        title: 'DAS - 01/2025',
        dueDate: '2025-01-15',
        amount: 1000,
        status: 'LATE',
        notes: '{}',
      },
    ];

    api.list.mockResolvedValue({ data: mockObligations });

    render(
      <BrowserRouter>
        <List />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('LATE')).toBeInTheDocument();
    });
  });

  it('deve renderizar link para nova obrigação', () => {
    api.list.mockResolvedValue({ data: [] });

    render(
      <BrowserRouter>
        <List />
      </BrowserRouter>
    );

    const newLinks = screen.getAllByText('+ Nova obrigação');
    expect(newLinks[0].closest('a')).toHaveAttribute('href', '/obligations/new');
  });

  it('deve renderizar link para editar', async () => {
    const mockObligations = [
      {
        id: '1',
        title: 'DAS - 01/2025',
        dueDate: '2025-01-15',
        amount: 1000,
        status: 'PENDING',
        notes: '{}',
      },
    ];

    api.list.mockResolvedValue({ data: mockObligations });

    render(
      <BrowserRouter>
        <List />
      </BrowserRouter>
    );

    await waitFor(() => {
      const editLinks = screen.getAllByText('Editar');
      expect(editLinks[0].closest('a')).toHaveAttribute('href', '/obligations/1/edit');
    });
  });
});

