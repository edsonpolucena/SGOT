import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock do react-dom/client
const mockRender = vi.fn();
const mockCreateRoot = vi.fn(() => ({
  render: mockRender,
}));

vi.mock('react-dom/client', () => ({
  createRoot: mockCreateRoot,
}));

// Mock dos componentes
const MockProviders = ({ children }) => <div data-testid="providers">{children}</div>;
const MockAppRouter = () => <div data-testid="app-router">AppRouter</div>;

vi.mock('../app/providers.jsx', () => ({
  default: MockProviders,
}));

vi.mock('../app/router.jsx', () => ({
  default: MockAppRouter,
}));

// Mock do CSS (não precisa fazer nada, apenas evitar erro de import)
vi.mock('../styles/base.css', () => ({}));

describe('main.jsx - 100% Coverage', () => {
  let mockRootElement;
  let originalGetElementById;

  beforeEach(() => {
    // Limpar mocks
    vi.clearAllMocks();

    // Criar elemento root mockado
    mockRootElement = document.createElement('div');
    mockRootElement.id = 'root';
    
    // Mock do document.getElementById
    originalGetElementById = document.getElementById;
    document.getElementById = vi.fn((id) => {
      if (id === 'root') {
        return mockRootElement;
      }
      return originalGetElementById.call(document, id);
    });
  });

  it('deve criar root e renderizar aplicação com StrictMode, Providers e AppRouter', async () => {
    // Importar main.jsx (isso executa o código)
    await import('../main.jsx');

    // Verificar se getElementById foi chamado com 'root'
    expect(document.getElementById).toHaveBeenCalledWith('root');

    // Verificar se createRoot foi chamado com o elemento root
    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
    expect(mockCreateRoot).toHaveBeenCalledWith(mockRootElement);

    // Verificar se render foi chamado
    expect(mockRender).toHaveBeenCalledTimes(1);

    // Verificar se React.StrictMode foi usado
    const renderCall = mockRender.mock.calls[0][0];
    expect(renderCall.type).toBe(React.StrictMode);

    // Verificar se Providers está dentro de StrictMode
    const strictModeChildren = renderCall.props.children;
    expect(strictModeChildren).toBeDefined();
    expect(typeof strictModeChildren.type).toBe('function');

    // Verificar se AppRouter está dentro de Providers
    const providersChildren = strictModeChildren.props.children;
    expect(providersChildren).toBeDefined();
  });

  it('deve usar React.StrictMode', async () => {
    // Resetar módulos para permitir nova importação
    vi.resetModules();
    vi.clearAllMocks();
    document.getElementById = vi.fn(() => mockRootElement);

    await import('../main.jsx');

    const renderCall = mockRender.mock.calls[0][0];
    expect(renderCall.type).toBe(React.StrictMode);
  });

  it('deve renderizar Providers dentro de StrictMode', async () => {
    vi.resetModules();
    vi.clearAllMocks();
    document.getElementById = vi.fn(() => mockRootElement);

    await import('../main.jsx');

    const renderCall = mockRender.mock.calls[0][0];
    const strictModeChildren = renderCall.props.children;
    expect(strictModeChildren).toBeDefined();
    expect(typeof strictModeChildren.type).toBe('function');
  });

  it('deve renderizar AppRouter dentro de Providers', async () => {
    vi.resetModules();
    vi.clearAllMocks();
    document.getElementById = vi.fn(() => mockRootElement);

    await import('../main.jsx');

    const renderCall = mockRender.mock.calls[0][0];
    const strictModeChildren = renderCall.props.children;
    const providersChildren = strictModeChildren.props.children;
    expect(providersChildren).toBeDefined();
  });

  it('deve chamar createRoot com elemento root correto', async () => {
    vi.resetModules();
    vi.clearAllMocks();
    document.getElementById = vi.fn(() => mockRootElement);

    await import('../main.jsx');

    expect(mockCreateRoot).toHaveBeenCalledWith(mockRootElement);
    expect(mockRender).toHaveBeenCalled();
  });
});

