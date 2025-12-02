import './styles/base.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import Providers from './app/providers.jsx';
import AppRouter from './app/router.jsx';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

if (SENTRY_DSN && import.meta.env.MODE !== 'test') {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE 
      ? parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE) 
      : 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      if (import.meta.env.VITE_SENTRY_FILTER_SENSITIVE_DATA === 'true') {
        if (event.request) {
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
          if (event.request.data) {
            if (typeof event.request.data === 'object') {
              delete event.request.data.password;
            }
          }
        }
      }
      return event;
    },
  });
}

const AppContent = () => (
  <Providers>
    <AppRouter />
  </Providers>
);

const RootComponent = SENTRY_DSN && import.meta.env.MODE !== 'test' 
  ? ({ children }) => (
      <Sentry.ErrorBoundary fallback={({ error, resetError }) => (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        fontFamily: 'Arial, sans-serif' 
      }}>
        <h1 style={{ color: '#dc3545' }}>Algo deu errado</h1>
        <p style={{ color: '#6c757d', marginBottom: '20px' }}>
          Ocorreu um erro inesperado. Por favor, recarregue a página.
        </p>
        <button 
          onClick={resetError}
          style={{
            padding: '10px 20px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Tentar novamente
        </button>
        {import.meta.env.MODE === 'development' && (
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', color: '#6c757d' }}>
              Detalhes do erro (desenvolvimento)
            </summary>
            <pre style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '4px',
              overflow: 'auto'
            }}>
              {error.toString()}
            </pre>
          </details>
        )}
      </div>
      )}>
        {children}
      </Sentry.ErrorBoundary>
    )
  : ({ children }) => <>{children}</>;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootComponent>
      <AppContent />
    </RootComponent>
  </React.StrictMode>
);
