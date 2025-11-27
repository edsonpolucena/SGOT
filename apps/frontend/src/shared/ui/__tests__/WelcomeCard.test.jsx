import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WelcomeCard from '../WelcomeCard';

describe('WelcomeCard', () => {
  it('deve renderizar com variant default', () => {
    render(
      <WelcomeCard 
        title="Bem-vindo" 
        subtitle="Subtítulo"
        info={['Info 1', 'Info 2']}
        variant="default"
      />
    );

    expect(screen.getByText('Bem-vindo')).toBeInTheDocument();
    expect(screen.getByText('Subtítulo')).toBeInTheDocument();
    expect(screen.getByText('Info 1')).toBeInTheDocument();
    expect(screen.getByText('Info 2')).toBeInTheDocument();
  });

  it('deve renderizar com variant client', () => {
    render(
      <WelcomeCard 
        title="Dashboard Cliente" 
        subtitle="Bem-vindo ao seu painel"
        info={['CNPJ: 123456789', 'Status: Ativo']}
        variant="client"
      />
    );

    expect(screen.getByText('Dashboard Cliente')).toBeInTheDocument();
    expect(screen.getByText('Bem-vindo ao seu painel')).toBeInTheDocument();
    expect(screen.getByText('CNPJ: 123456789')).toBeInTheDocument();
    expect(screen.getByText('Status: Ativo')).toBeInTheDocument();
  });

  it('deve renderizar sem subtitle quando não fornecido', () => {
    render(
      <WelcomeCard 
        title="Título"
        info={['Info']}
        variant="default"
      />
    );

    expect(screen.getByText('Título')).toBeInTheDocument();
    expect(screen.queryByText(/subtítulo/i)).not.toBeInTheDocument();
  });

  it('deve renderizar sem info quando array vazio', () => {
    render(
      <WelcomeCard 
        title="Título"
        info={[]}
        variant="client"
      />
    );

    expect(screen.getByText('Título')).toBeInTheDocument();
  });

  it('deve usar variant default quando não especificado', () => {
    render(
      <WelcomeCard 
        title="Título"
        info={['Info']}
      />
    );

    expect(screen.getByText('Título')).toBeInTheDocument();
  });
});

