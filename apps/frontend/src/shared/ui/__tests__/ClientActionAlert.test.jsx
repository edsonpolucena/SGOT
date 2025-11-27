import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ClientActionAlert from '../ClientActionAlert';

describe('ClientActionAlert', () => {
  const mockHistory = [
    {
      id: '1',
      userName: 'João Silva',
      userEmail: 'joao@test.com',
      action: 'VIEW',
      viewedAt: '2025-01-15T10:30:00Z'
    },
    {
      id: '2',
      userName: 'Maria Santos',
      userEmail: 'maria@test.com',
      action: 'DOWNLOAD',
      viewedAt: '2025-01-14T15:20:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não deve renderizar quando isOpen é false', () => {
    const { container } = render(
      <ClientActionAlert isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar quando isOpen é true', () => {
    render(
      <ClientActionAlert isOpen={true} onClose={vi.fn()} />
    );
    expect(screen.getByText(/documento já/i)).toBeInTheDocument();
  });

  it('deve mostrar título correto para VIEW', () => {
    render(
      <ClientActionAlert 
        isOpen={true} 
        onClose={vi.fn()} 
        actionType="VIEW"
      />
    );
    expect(screen.getByText(/documento já visualizado/i)).toBeInTheDocument();
  });

  it('deve mostrar título correto para DOWNLOAD', () => {
    render(
      <ClientActionAlert 
        isOpen={true} 
        onClose={vi.fn()} 
        actionType="DOWNLOAD"
      />
    );
    expect(screen.getByText(/documento já baixado/i)).toBeInTheDocument();
  });

  it('deve exibir histórico quando fornecido', () => {
    render(
      <ClientActionAlert 
        isOpen={true} 
        onClose={vi.fn()} 
        history={mockHistory}
      />
    );
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
  });

  it('deve exibir mensagem quando não há histórico', () => {
    render(
      <ClientActionAlert 
        isOpen={true} 
        onClose={vi.fn()} 
        history={[]}
      />
    );
    expect(screen.getByText(/nenhum histórico encontrado/i)).toBeInTheDocument();
  });

  it('deve chamar onClose ao clicar no botão OK', () => {
    const onClose = vi.fn();
    render(
      <ClientActionAlert isOpen={true} onClose={onClose} />
    );
    
    const button = screen.getByText('OK');
    fireEvent.click(button);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onClose ao clicar no overlay', () => {
    const onClose = vi.fn();
    render(
      <ClientActionAlert isOpen={true} onClose={onClose} />
    );
    
    const overlay = screen.getByText(/documento já/i).closest('div').parentElement;
    fireEvent.click(overlay);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('não deve chamar onClose ao clicar no modal', () => {
    const onClose = vi.fn();
    render(
      <ClientActionAlert isOpen={true} onClose={onClose} />
    );
    
    const modal = screen.getByText(/documento já/i).closest('div');
    fireEvent.click(modal);
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('deve fechar com tecla ESC', () => {
    const onClose = vi.fn();
    render(
      <ClientActionAlert isOpen={true} onClose={onClose} />
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deve formatar data corretamente', () => {
    render(
      <ClientActionAlert 
        isOpen={true} 
        onClose={vi.fn()} 
        history={mockHistory}
      />
    );
    
    // Verifica se a data formatada está presente
    const dateElements = screen.getAllByText(/\d{2}\/\d{2}\/\d{4}/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('deve mostrar badge correto para VIEW', () => {
    render(
      <ClientActionAlert 
        isOpen={true} 
        onClose={vi.fn()} 
        history={[mockHistory[0]]}
      />
    );
    expect(screen.getByText('Visualização')).toBeInTheDocument();
  });

  it('deve mostrar badge correto para DOWNLOAD', () => {
    render(
      <ClientActionAlert 
        isOpen={true} 
        onClose={vi.fn()} 
        history={[mockHistory[1]]}
      />
    );
    expect(screen.getByText('Download')).toBeInTheDocument();
  });
});

