import React from 'react';
import styled from 'styled-components';
import * as Sentry from '@sentry/react';

const TestButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
`;

const Hint = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
`;

export default function SentryTestButton() {
  const handleTestError = () => {
    try {
      throw new Error('This is your first error!');
    } catch (e) {
      Sentry.captureException(e);
      alert('✅ Erro de teste enviado ao Sentry!\n\nVerifique o dashboard do Sentry para ver o erro capturado.');
    }
  };

  const isSentryEnabled = import.meta.env.VITE_SENTRY_DSN && import.meta.env.MODE !== 'test';

  if (!isSentryEnabled) {
    return (
      <Container>
        <TestButton disabled>
          Testar Sentry (não configurado)
        </TestButton>
        <Hint>Configure VITE_SENTRY_DSN no .env para ativar</Hint>
      </Container>
    );
  }

  return (
    <Container>
      <TestButton onClick={handleTestError}>
        Break the world
      </TestButton>
      <Hint>Clique para testar o monitoramento de erros do Sentry</Hint>
    </Container>
  );
}

