import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import CompanyForm from '../CompanyForm';
import { useCompanyController } from '../../controller/useCompanyController';
import { useAuth } from '../../../../shared/context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

describe('CompanyForm.jsx - 100% Coverage', () => {
  const mockCreateCompany = vi.fn();
  const mockUpdateCompany = vi.fn();
  const mockGetCompanies = vi.fn();
  const mockGetCompanyById = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { name: 'Test User' },
    });

    useCompanyController.mockReturnValue({
      createCompany: mockCreateCompany,
      updateCompany: mockUpdateCompany,
      getCompanies: mockGetCompanies,
      getCompanyById: mockGetCompanyById,
      loading: false,
      error: null,
    });
  });

  it('deve renderizar formulário de nova empresa', async () => {
    mockGetCompanies.mockResolvedValue([
      { codigo: 'EMP001' },
      { codigo: 'EMP002' },
    ]);

    render(
      <BrowserRouter>
        <CompanyForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Cadastrar Empresa')).toBeInTheDocument();
      expect(screen.getByLabelText('Nome da Empresa *')).toBeInTheDocument();
    });
  });

  it('deve gerar código automaticamente para nova empresa', async () => {
    mockGetCompanies.mockResolvedValue([
      { codigo: 'EMP001' },
      { codigo: 'EMP002' },
    ]);

    render(
      <BrowserRouter>
        <CompanyForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const codigoInput = screen.getByLabelText('Código');
      expect(codigoInput.value).toBe('EMP003');
    });
  });

  it('deve gerar EMP001 quando não há empresas', async () => {
    mockGetCompanies.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <CompanyForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const codigoInput = screen.getByLabelText('Código');
      expect(codigoInput.value).toBe('EMP001');
    });
  });

  it('deve formatar CNPJ corretamente', async () => {
    mockGetCompanies.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <CompanyForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const cnpjInput = screen.getByLabelText('CNPJ *');
      fireEvent.change(cnpjInput, { target: { value: '12345678000190' } });
      expect(cnpjInput.value).toBe('12.345.678/0001-90');
    });
  });

  it('deve formatar telefone de 10 dígitos', async () => {
    mockGetCompanies.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <CompanyForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const phoneInput = screen.getByLabelText('Telefone');
      fireEvent.change(phoneInput, { target: { value: '4799999999' } });
      expect(phoneInput.value).toBe('(47) 9999-9999');
    });
  });

  it('deve formatar telefone de 11 dígitos', async () => {
    mockGetCompanies.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <CompanyForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const phoneInput = screen.getByLabelText('Telefone');
      fireEvent.change(phoneInput, { target: { value: '47999999999' } });
      expect(phoneInput.value).toBe('(47) 99999-9999');
    });
  });

  it('deve criar empresa com sucesso', async () => {
    mockGetCompanies.mockResolvedValue([]);
    mockCreateCompany.mockResolvedValue({ id: '1', nome: 'Nova Empresa' });
    global.alert = vi.fn();

    render(
      <BrowserRouter>
        <CompanyForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const nomeInput = screen.getByLabelText('Nome da Empresa *');
      fireEvent.change(nomeInput, { target: { value: 'Nova Empresa' } });
    });

    const cnpjInput = screen.getByLabelText('CNPJ *');
    fireEvent.change(cnpjInput, { target: { value: '12345678000190' } });

    const submitButton = screen.getByText('Salvar');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateCompany).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Nova Empresa',
          cnpj: '12345678000190', // Sem máscara
        })
      );
      expect(global.alert).toHaveBeenCalledWith('Empresa cadastrada com sucesso: Nova Empresa');
      expect(mockNavigate).toHaveBeenCalledWith('/companies');
    });
  });

  it('deve carregar dados da empresa para edição', async () => {
    const mockCompany = {
      id: '1',
      codigo: 'EMP001',
      nome: 'Empresa Test',
      cnpj: '12345678000190',
      email: 'test@test.com',
      telefone: '47999999999',
      endereco: 'Rua Test',
      status: 'ativa',
    };

    mockGetCompanyById.mockResolvedValue(mockCompany);

    render(
      <MemoryRouter initialEntries={['/company/edit/1']}>
        <CompanyForm />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Editar Empresa')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Empresa Test')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@test.com')).toBeInTheDocument();
    });
  });

  it('deve atualizar empresa com sucesso', async () => {
    const mockCompany = {
      id: '1',
      codigo: 'EMP001',
      nome: 'Empresa Test',
      cnpj: '12345678000190',
      email: 'test@test.com',
      telefone: '47999999999',
      endereco: 'Rua Test',
      status: 'ativa',
    };

    mockGetCompanyById.mockResolvedValue(mockCompany);
    mockUpdateCompany.mockResolvedValue(mockCompany);
    global.alert = vi.fn();

    render(
      <MemoryRouter initialEntries={['/company/edit/1']}>
        <CompanyForm />
      </MemoryRouter>
    );

    await waitFor(() => {
      const nomeInput = screen.getByLabelText('Nome da Empresa *');
      fireEvent.change(nomeInput, { target: { value: 'Empresa Atualizada' } });
    });

    const submitButton = screen.getByText('Atualizar');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateCompany).toHaveBeenCalledWith('1', expect.objectContaining({
        nome: 'Empresa Atualizada',
      }));
      expect(global.alert).toHaveBeenCalledWith('Empresa atualizada com sucesso: Empresa Atualizada');
      expect(mockNavigate).toHaveBeenCalledWith('/companies');
    });
  });

  it('deve mostrar erro ao salvar', async () => {
    mockGetCompanies.mockResolvedValue([]);
    mockCreateCompany.mockRejectedValue({
      response: { data: { message: 'Erro ao salvar' } },
    });
    global.alert = vi.fn();

    render(
      <BrowserRouter>
        <CompanyForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const nomeInput = screen.getByLabelText('Nome da Empresa *');
      fireEvent.change(nomeInput, { target: { value: 'Nova Empresa' } });
    });

    const cnpjInput = screen.getByLabelText('CNPJ *');
    fireEvent.change(cnpjInput, { target: { value: '12345678000190' } });

    const submitButton = screen.getByText('Salvar');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Erro ao salvar');
    });
  });

  it('deve cancelar e navegar para lista', async () => {
    mockGetCompanies.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <CompanyForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);
      expect(mockNavigate).toHaveBeenCalledWith('/companies');
    });
  });

  it('deve atualizar todos os campos do formulário', async () => {
    mockGetCompanies.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <CompanyForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const nomeInput = screen.getByLabelText('Nome da Empresa *');
      fireEvent.change(nomeInput, { target: { value: 'Test Company' } });

      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });

      const enderecoInput = screen.getByLabelText('Endereço');
      fireEvent.change(enderecoInput, { target: { value: 'Rua Test, 123' } });

      const statusSelect = screen.getByLabelText('Status');
      fireEvent.change(statusSelect, { target: { value: 'inativa' } });

      expect(nomeInput.value).toBe('Test Company');
      expect(emailInput.value).toBe('test@test.com');
      expect(enderecoInput.value).toBe('Rua Test, 123');
      expect(statusSelect.value).toBe('inativa');
    });
  });

  it('deve remover máscaras antes de enviar', async () => {
    mockGetCompanies.mockResolvedValue([]);
    mockCreateCompany.mockResolvedValue({ id: '1', nome: 'Test' });
    global.alert = vi.fn();

    render(
      <BrowserRouter>
        <CompanyForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const nomeInput = screen.getByLabelText('Nome da Empresa *');
      fireEvent.change(nomeInput, { target: { value: 'Test Company' } });
    });

    const cnpjInput = screen.getByLabelText('CNPJ *');
    fireEvent.change(cnpjInput, { target: { value: '12345678000190' } });

    const phoneInput = screen.getByLabelText('Telefone');
    fireEvent.change(phoneInput, { target: { value: '47999999999' } });

    const submitButton = screen.getByText('Salvar');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateCompany).toHaveBeenCalledWith(
        expect.objectContaining({
          cnpj: '12345678000190', // Sem máscara
          telefone: '47999999999', // Sem máscara
        })
      );
    });
  });

  it('deve lidar com erro ao carregar próximo código', async () => {
    mockGetCompanies.mockRejectedValue(new Error('Load failed'));

    render(
      <BrowserRouter>
        <CompanyForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const codigoInput = screen.getByLabelText('Código');
      // Deve usar EMP001 como fallback
      expect(codigoInput.value).toBe('EMP001');
    });
  });

  it('deve lidar com erro ao carregar empresa para edição', async () => {
    mockGetCompanyById.mockRejectedValue(new Error('Load failed'));

    render(
      <MemoryRouter initialEntries={['/company/edit/1']}>
        <CompanyForm />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Editar Empresa')).toBeInTheDocument();
    });
  });

  it('deve mostrar loading durante salvamento', async () => {
    mockGetCompanies.mockResolvedValue([]);
    useCompanyController.mockReturnValue({
      createCompany: mockCreateCompany,
      updateCompany: mockUpdateCompany,
      getCompanies: mockGetCompanies,
      getCompanyById: mockGetCompanyById,
      loading: true,
      error: null,
    });

    render(
      <BrowserRouter>
        <CompanyForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Salvando...')).toBeInTheDocument();
    });
  });

  it('deve mostrar erro quando error existe', async () => {
    mockGetCompanies.mockResolvedValue([]);
    useCompanyController.mockReturnValue({
      createCompany: mockCreateCompany,
      updateCompany: mockUpdateCompany,
      getCompanies: mockGetCompanies,
      getCompanyById: mockGetCompanyById,
      loading: false,
      error: 'Erro ao carregar',
    });

    render(
      <BrowserRouter>
        <CompanyForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar')).toBeInTheDocument();
    });
  });

  it('deve lidar com campos opcionais vazios na atualização', async () => {
    const mockCompany = {
      id: '1',
      codigo: 'EMP001',
      nome: 'Empresa Test',
      cnpj: '12345678000190',
      email: null,
      telefone: null,
      endereco: null,
      status: 'ativa',
    };

    mockGetCompanyById.mockResolvedValue(mockCompany);
    mockUpdateCompany.mockResolvedValue(mockCompany);
    global.alert = vi.fn();

    render(
      <MemoryRouter initialEntries={['/company/edit/1']}>
        <CompanyForm />
      </MemoryRouter>
    );

    await waitFor(() => {
      const submitButton = screen.getByText('Atualizar');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockUpdateCompany).toHaveBeenCalledWith('1', expect.objectContaining({
        email: null,
        telefone: null,
        endereco: null,
      }));
    });
  });
});

