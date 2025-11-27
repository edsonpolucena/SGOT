import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WelcomeCard from '../WelcomeCard';

describe('WelcomeCard.jsx - 100% Coverage', () => {
  it('deve renderizar com variant default', () => {
    render(
      <WelcomeCard title="Bem-vindo" subtitle="Subtítulo" />
    );

    expect(screen.getByText('Bem-vindo')).toBeInTheDocument();
    expect(screen.getByText('Subtítulo')).toBeInTheDocument();
  });

  it('deve renderizar com variant client', () => {
    render(
      <WelcomeCard 
        variant="client" 
        title="Bem-vindo" 
        subtitle="Subtítulo"
        info={['Info 1', 'Info 2']}
      />
    );

    expect(screen.getByText('Bem-vindo')).toBeInTheDocument();
    expect(screen.getByText('Subtítulo')).toBeInTheDocument();
    expect(screen.getByText('Info 1')).toBeInTheDocument();
    expect(screen.getByText('Info 2')).toBeInTheDocument();
  });

  it('deve renderizar sem subtitle', () => {
    render(
      <WelcomeCard title="Bem-vindo" />
    );

    expect(screen.getByText('Bem-vindo')).toBeInTheDocument();
  });

  it('deve renderizar com info array vazio', () => {
    render(
      <WelcomeCard title="Bem-vindo" subtitle="Subtítulo" info={[]} />
    );

    expect(screen.getByText('Bem-vindo')).toBeInTheDocument();
  });

  it('deve renderizar múltiplos itens de info no variant default', () => {
    render(
      <WelcomeCard 
        title="Bem-vindo" 
        subtitle="Subtítulo"
        info={['Info 1', 'Info 2', 'Info 3']}
      />
    );

    expect(screen.getByText('Info 1')).toBeInTheDocument();
    expect(screen.getByText('Info 2')).toBeInTheDocument();
    expect(screen.getByText('Info 3')).toBeInTheDocument();
  });

  it('deve renderizar múltiplos itens de info no variant client', () => {
    render(
      <WelcomeCard 
        variant="client"
        title="Bem-vindo" 
        subtitle="Subtítulo"
        info={['Info 1', 'Info 2', 'Info 3']}
      />
    );

    expect(screen.getByText('Info 1')).toBeInTheDocument();
    expect(screen.getByText('Info 2')).toBeInTheDocument();
    expect(screen.getByText('Info 3')).toBeInTheDocument();
  });

  it('deve renderizar sem info quando não fornecido', () => {
    render(
      <WelcomeCard title="Bem-vindo" subtitle="Subtítulo" />
    );

    expect(screen.getByText('Bem-vindo')).toBeInTheDocument();
  });

  it('deve renderizar sem subtitle no variant client', () => {
    render(
      <WelcomeCard variant="client" title="Bem-vindo" />
    );

    expect(screen.getByText('Bem-vindo')).toBeInTheDocument();
  });
});
