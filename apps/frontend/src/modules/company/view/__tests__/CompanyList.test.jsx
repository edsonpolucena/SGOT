import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CompanyList from '../CompanyList';
import { useCompanyController } from '../../controller/useCompanyController';
import { useAuth } from '../../../../shared/context/AuthContext';

vi.mock('../../controller/useCompanyController', () => ({
  useCompanyController: vi.fn(),
}));

vi.mock('../../../../shared/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../../shared/ui/WelcomeCard', () => ({
  default: ({ title, subtitle }) => (
    <div data-testid="welcome-card">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  ),
}));

describe('CompanyList.jsx - 100% Coverage', () => {
  const mockGetCompanies = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { name: 'Test User' },
    });

    useCompanyController.mockReturnValue({
      getCompanies: mockGetCompanies,
      loading: false,
      error: null,
    });
  });

  it('deve renderizar loading', () => {
    useCompanyController.mockReturnValue({
      getCompanies: mockGetCompanies,
      loading: true,
      error: null,
    });

    render(
      <BrowserRouter>
        <CompanyList />
      </BrowserRouter>
    );

    expect(screen.getByText('Carregando empresas...')).toBeInTheDocument();
  });

  it('deve renderizar erro', () => {
    useCompanyController.mockReturnValue({
      getCompanies: mockGetCompanies,
      loading: false,
      error: 'Erro ao carregar',
    });

    render(
      <BrowserRouter>
        <CompanyList />
      </BrowserRouter>
    );

    expect(screen.getByText('Erro ao carregar empresas: Erro ao carregar')).toBeInTheDocument();
  });

  it('deve carregar e exibir empresas', async () => {
    const mockCompanies = [
      {
        id: '1',
        codigo: 'EMP001',
        nome: 'Empresa 1',
        cnpj: '12345678000190',
        email: 'emp1@test.com',
        status: 'ativa',
      },
      {
        id: '2',
        codigo: 'EMP002',
        nome: 'Empresa 2',
        cnpj: '98765432000100',
        email: null,
        status: 'inativa',
      },
    ];

    useCompanyController.mockReturnValue({
      getCompanies: mockGetCompanies,
      loading: false,
      error: null,
    });

    mockGetCompanies.mockResolvedValue(mockCompanies);

    render(
      <BrowserRouter>
        <CompanyList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Empresa 1')).toBeInTheDocument();
      expect(screen.getByText('Empresa 2')).toBeInTheDocument();
      expect(screen.getByText('12.345.678/0001-90')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('deve exibir mensagem quando não há empresas', async () => {
    useCompanyController.mockReturnValue({
      getCompanies: mockGetCompanies,
      loading: false,
      error: null,
    });

    mockGetCompanies.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <CompanyList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nenhuma empresa cadastrada')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('deve formatar CNPJ corretamente', async () => {
    const mockCompanies = [
      {
        id: '1',
        codigo: 'EMP001',
        nome: 'Empresa 1',
        cnpj: '12345678000190',
        email: 'emp1@test.com',
        status: 'ativa',
      },
    ];

    useCompanyController.mockReturnValue({
      getCompanies: mockGetCompanies,
      loading: false,
      error: null,
    });

    mockGetCompanies.mockResolvedValue(mockCompanies);

    render(
      <BrowserRouter>
        <CompanyList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('12.345.678/0001-90')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('deve exibir — quando email é null', async () => {
    const mockCompanies = [
      {
        id: '1',
        codigo: 'EMP001',
        nome: 'Empresa 1',
        cnpj: '12345678000190',
        email: null,
        status: 'ativa',
      },
    ];

    useCompanyController.mockReturnValue({
      getCompanies: mockGetCompanies,
      loading: false,
      error: null,
    });

    mockGetCompanies.mockResolvedValue(mockCompanies);

    render(
      <BrowserRouter>
        <CompanyList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('deve exibir status badge corretamente', async () => {
    const mockCompanies = [
      {
        id: '1',
        codigo: 'EMP001',
        nome: 'Empresa 1',
        cnpj: '12345678000190',
        email: 'emp1@test.com',
        status: 'ativa',
      },
      {
        id: '2',
        codigo: 'EMP002',
        nome: 'Empresa 2',
        cnpj: '98765432000100',
        email: 'emp2@test.com',
        status: 'inativa',
      },
    ];

    useCompanyController.mockReturnValue({
      getCompanies: mockGetCompanies,
      loading: false,
      error: null,
    });

    mockGetCompanies.mockResolvedValue(mockCompanies);

    render(
      <BrowserRouter>
        <CompanyList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ATIVA')).toBeInTheDocument();
      expect(screen.getByText('INATIVA')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('deve renderizar link para nova empresa', () => {
    useCompanyController.mockReturnValue({
      getCompanies: mockGetCompanies,
      loading: false,
      error: null,
    });

    mockGetCompanies.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <CompanyList />
      </BrowserRouter>
    );

    const newButton = screen.getByText('Nova Empresa');
    expect(newButton.closest('a')).toHaveAttribute('href', '/company/new');
  });

  it('deve lidar com erro ao carregar empresas', async () => {
    useCompanyController.mockReturnValue({
      getCompanies: mockGetCompanies,
      loading: false,
      error: null,
    });

    mockGetCompanies.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <CompanyList />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Componente deve renderizar mesmo com erro
      expect(screen.getByText('Empresas')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

