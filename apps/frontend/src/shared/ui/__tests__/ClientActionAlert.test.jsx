import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ClientActionAlert from '../ClientActionAlert';

describe('ClientActionAlert.jsx - 100% Coverage', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('não deve renderizar quando isOpen é false', () => {
    render(
      <ClientActionAlert isOpen={false} onClose={mockOnClose} />
    );

    expect(screen.queryByText(/Documento já/)).not.toBeInTheDocument();
  });

  it('deve renderizar modal quando isOpen é true', () => {
    render(
      <ClientActionAlert isOpen={true} onClose={mockOnClose} actionType="VIEW" />
    );

    expect(screen.getByText(/Documento já visualizado/)).toBeInTheDocument();
  });

  it('deve renderizar com actionType DOWNLOAD', () => {
    render(
      <ClientActionAlert isOpen={true} onClose={mockOnClose} actionType="DOWNLOAD" />
    );

    expect(screen.getByText(/Documento já baixado/)).toBeInTheDocument();
  });

  it('deve exibir histórico quando fornecido', () => {
    const history = [
      {
        id: '1',
        userName: 'User 1',
        action: 'VIEW',
        viewedAt: '2025-01-15T10:00:00Z',
      },
      {
        id: '2',
        userName: 'User 2',
        action: 'DOWNLOAD',
        viewedAt: '2025-01-16T11:00:00Z',
      },
    ];

    render(
      <ClientActionAlert isOpen={true} onClose={mockOnClose} history={history} />
    );

    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
  });

  it('deve exibir mensagem quando não há histórico', () => {
    render(
      <ClientActionAlert isOpen={true} onClose={mockOnClose} history={[]} />
    );

    expect(screen.getByText(/Nenhum histórico encontrado/)).toBeInTheDocument();
  });

  it('deve fechar quando overlay é clicado', () => {
    render(
      <ClientActionAlert isOpen={true} onClose={mockOnClose} />
    );

    const overlay = screen.getByText(/Documento já/).closest('div').parentElement;
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('não deve fechar quando modal é clicado', () => {
    render(
      <ClientActionAlert isOpen={true} onClose={mockOnClose} />
    );

    const modal = screen.getByText(/Documento já/).closest('div');
    fireEvent.click(modal);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('deve fechar quando botão OK é clicado', () => {
    render(
      <ClientActionAlert isOpen={true} onClose={mockOnClose} />
    );

    const okButton = screen.getByText('OK');
    fireEvent.click(okButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('deve fechar quando ESC é pressionado', () => {
    render(
      <ClientActionAlert isOpen={true} onClose={mockOnClose} />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('não deve fechar quando outra tecla é pressionada', () => {
    render(
      <ClientActionAlert isOpen={true} onClose={mockOnClose} />
    );

    fireEvent.keyDown(document, { key: 'Enter' });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('deve formatar data corretamente', () => {
    const history = [
      {
        id: '1',
        userName: 'User 1',
        action: 'VIEW',
        viewedAt: '2025-01-15T10:30:00Z',
      },
    ];

    render(
      <ClientActionAlert isOpen={true} onClose={mockOnClose} history={history} />
    );

    expect(screen.getByText(/15\/01\/2025/)).toBeInTheDocument();
  });

  it('deve exibir badge correto para VIEW', () => {
    const history = [
      {
        id: '1',
        userName: 'User 1',
        action: 'VIEW',
        viewedAt: '2025-01-15T10:00:00Z',
      },
    ];

    render(
      <ClientActionAlert isOpen={true} onClose={mockOnClose} history={history} />
    );

    expect(screen.getByText('Visualização')).toBeInTheDocument();
  });

  it('deve exibir badge correto para DOWNLOAD', () => {
    const history = [
      {
        id: '1',
        userName: 'User 1',
        action: 'DOWNLOAD',
        viewedAt: '2025-01-15T10:00:00Z',
      },
    ];

    render(
      <ClientActionAlert isOpen={true} onClose={mockOnClose} history={history} />
    );

    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  it('deve remover event listener ao desmontar', () => {
    const { unmount } = render(
      <ClientActionAlert isOpen={true} onClose={mockOnClose} />
    );

    unmount();

    fireEvent.keyDown(document, { key: 'Escape' });
    // Não deve chamar onClose após desmontar
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('deve usar actionType padrão VIEW', () => {
    render(
      <ClientActionAlert isOpen={true} onClose={mockOnClose} />
    );

    expect(screen.getByText(/visualizado/)).toBeInTheDocument();
  });
});
