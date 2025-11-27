import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Form from '../Form';
import * as api from '../../data/obligation.api';
import http from '../../../../shared/services/http';
import { useAuth } from '../../../../shared/context/AuthContext';
import WelcomeCard from '../../../../shared/ui/WelcomeCard';

vi.mock('../../data/obligation.api', () => ({
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock('../../../../shared/services/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
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

describe('Form.jsx - 100% Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { name: 'Test User', role: 'ACCOUNTING_SUPER' },
    });

    const mockCompanies = [
      { id: 1, codigo: 'EMP001', nome: 'Empresa 1', cnpj: '12345678000190' },
      { id: 2, codigo: 'EMP002', nome: 'Empresa 2', cnpj: '98765432000100' },
    ];

    http.get.mockResolvedValue({ data: mockCompanies });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve renderizar formulário de nova obrigação', async () => {
    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nova obrigação')).toBeInTheDocument();
      expect(screen.getByLabelText('Empresa*')).toBeInTheDocument();
    });
  });

  it('deve renderizar formulário de edição quando id existe', async () => {
    const mockObligation = {
      id: '1',
      companyId: 1,
      dueDate: '2025-01-15T00:00:00Z',
      amount: 1000,
      notes: JSON.stringify({
        companyCode: 'EMP001',
        cnpj: '12345678000190',
        companyName: 'Empresa 1',
        docType: 'DAS',
        competence: '01/2025',
      }),
    };

    api.get.mockResolvedValue({ data: mockObligation });

    render(
      <MemoryRouter initialEntries={['/obligations/1/edit']}>
        <Form />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Editar obrigação')).toBeInTheDocument();
      expect(screen.getByDisplayValue('EMP001')).toBeInTheDocument();
    });
  });

  it('deve carregar empresas ao montar', async () => {
    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(http.get).toHaveBeenCalledWith('/api/empresas');
    });
  });

  it('deve filtrar empresas ao digitar', async () => {
    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Digite o código, nome ou CNPJ...')).toBeInTheDocument();
    });

    const companyInput = screen.getByPlaceholderText('Digite o código, nome ou CNPJ...');
    fireEvent.change(companyInput, { target: { value: 'EMP001' } });

    await waitFor(() => {
      expect(companyInput.value).toBe('EMP001');
    });
  });

  it('deve selecionar empresa do dropdown', async () => {
    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      const companyInput = screen.getByPlaceholderText('Digite o código, nome ou CNPJ...');
      fireEvent.focus(companyInput);
      fireEvent.change(companyInput, { target: { value: 'EMP' } });
    });

    await waitFor(() => {
      const dropdownButton = screen.getByText(/Empresa 1/);
      fireEvent.click(dropdownButton);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('EMP001')).toBeInTheDocument();
    });
  });

  it('deve atualizar tipo de documento', async () => {
    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      const docTypeSelect = screen.getByLabelText('Tipo do documento*');
      fireEvent.change(docTypeSelect, { target: { value: 'ISS_RETIDO' } });
      expect(docTypeSelect.value).toBe('ISS_RETIDO');
    });
  });

  it('deve formatar competência corretamente', async () => {
    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      const competenceInput = screen.getByPlaceholderText('MM/AAAA');
      fireEvent.change(competenceInput, { target: { value: '012025' } });
      expect(competenceInput.value).toBe('01/2025');
    });
  });

  it('deve atualizar vencimento', async () => {
    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      const dueDateInput = screen.getByLabelText('Vencimento*');
      fireEvent.change(dueDateInput, { target: { value: '2025-01-15' } });
      expect(dueDateInput.value).toBe('2025-01-15');
    });
  });

  it('deve formatar valor monetário', async () => {
    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      const amountInput = screen.getByPlaceholderText('R$ 0,00');
      fireEvent.change(amountInput, { target: { value: '123456' } });
      // O valor será formatado para R$ 1.234,56
      expect(amountInput.value).toContain('1.234,56');
    });
  });

  it('deve gerar descrição automaticamente', async () => {
    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      const companyInput = screen.getByPlaceholderText('Digite o código, nome ou CNPJ...');
      fireEvent.focus(companyInput);
      fireEvent.change(companyInput, { target: { value: 'EMP' } });
    });

    await waitFor(() => {
      const dropdownButton = screen.getByText(/Empresa 1/);
      fireEvent.click(dropdownButton);
    });

    const docTypeSelect = screen.getByLabelText('Tipo do documento*');
    fireEvent.change(docTypeSelect, { target: { value: 'DAS' } });

    const competenceInput = screen.getByPlaceholderText('MM/AAAA');
    fireEvent.change(competenceInput, { target: { value: '012025' } });

    await waitFor(() => {
      const descriptionInput = screen.getByPlaceholderText('Será preenchida automaticamente');
      expect(descriptionInput.value).toContain('EMP001.DAS.012025');
    });
  });

  it('deve validar empresa antes de salvar', async () => {
    api.create.mockResolvedValue({ data: { id: '1' } });

    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      const submitButton = screen.getByText('Salvar');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Por favor, selecione uma empresa/)).toBeInTheDocument();
      expect(api.create).not.toHaveBeenCalled();
    });
  });

  it('deve criar obrigação com sucesso', async () => {
    api.create.mockResolvedValue({ data: { id: '1' } });

    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      const companyInput = screen.getByPlaceholderText('Digite o código, nome ou CNPJ...');
      fireEvent.focus(companyInput);
      fireEvent.change(companyInput, { target: { value: 'EMP' } });
    });

    await waitFor(() => {
      const dropdownButton = screen.getByText(/Empresa 1/);
      fireEvent.click(dropdownButton);
    });

    const docTypeSelect = screen.getByLabelText('Tipo do documento*');
    fireEvent.change(docTypeSelect, { target: { value: 'DAS' } });

    const competenceInput = screen.getByPlaceholderText('MM/AAAA');
    fireEvent.change(competenceInput, { target: { value: '012025' } });

    const dueDateInput = screen.getByLabelText('Vencimento*');
    fireEvent.change(dueDateInput, { target: { value: '2025-01-15' } });

    const submitButton = screen.getByText('Salvar');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.create).toHaveBeenCalled();
      expect(screen.getByText(/Obrigação criada com sucesso/)).toBeInTheDocument();
    });
  });

  it('deve fazer upload de arquivo após criar obrigação', async () => {
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    api.create.mockResolvedValue({ data: { id: '1' } });
    http.post.mockResolvedValue({});

    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      const companyInput = screen.getByPlaceholderText('Digite o código, nome ou CNPJ...');
      fireEvent.focus(companyInput);
      fireEvent.change(companyInput, { target: { value: 'EMP' } });
    });

    await waitFor(() => {
      const dropdownButton = screen.getByText(/Empresa 1/);
      fireEvent.click(dropdownButton);
    });

    const fileInput = screen.getByLabelText('Upload do documento');
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    const docTypeSelect = screen.getByLabelText('Tipo do documento*');
    fireEvent.change(docTypeSelect, { target: { value: 'DAS' } });

    const competenceInput = screen.getByPlaceholderText('MM/AAAA');
    fireEvent.change(competenceInput, { target: { value: '012025' } });

    const dueDateInput = screen.getByLabelText('Vencimento*');
    fireEvent.change(dueDateInput, { target: { value: '2025-01-15' } });

    const submitButton = screen.getByText('Salvar');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(http.post).toHaveBeenCalledWith(
        '/api/obligations/1/files',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
    });
  });

  it('deve lidar com erro no upload de arquivo', async () => {
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    api.create.mockResolvedValue({ data: { id: '1' } });
    http.post.mockRejectedValue(new Error('Upload failed'));

    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      const companyInput = screen.getByPlaceholderText('Digite o código, nome ou CNPJ...');
      fireEvent.focus(companyInput);
      fireEvent.change(companyInput, { target: { value: 'EMP' } });
    });

    await waitFor(() => {
      const dropdownButton = screen.getByText(/Empresa 1/);
      fireEvent.click(dropdownButton);
    });

    const fileInput = screen.getByLabelText('Upload do documento');
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    const docTypeSelect = screen.getByLabelText('Tipo do documento*');
    fireEvent.change(docTypeSelect, { target: { value: 'DAS' } });

    const competenceInput = screen.getByPlaceholderText('MM/AAAA');
    fireEvent.change(competenceInput, { target: { value: '012025' } });

    const dueDateInput = screen.getByLabelText('Vencimento*');
    fireEvent.change(dueDateInput, { target: { value: '2025-01-15' } });

    const submitButton = screen.getByText('Salvar');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.create).toHaveBeenCalled();
      // Upload falha mas não impede criação
    });
  });

  it('deve mostrar erro ao salvar', async () => {
    api.create.mockRejectedValue(new Error('Save failed'));

    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      const companyInput = screen.getByPlaceholderText('Digite o código, nome ou CNPJ...');
      fireEvent.focus(companyInput);
      fireEvent.change(companyInput, { target: { value: 'EMP' } });
    });

    await waitFor(() => {
      const dropdownButton = screen.getByText(/Empresa 1/);
      fireEvent.click(dropdownButton);
    });

    const docTypeSelect = screen.getByLabelText('Tipo do documento*');
    fireEvent.change(docTypeSelect, { target: { value: 'DAS' } });

    const competenceInput = screen.getByPlaceholderText('MM/AAAA');
    fireEvent.change(competenceInput, { target: { value: '012025' } });

    const dueDateInput = screen.getByLabelText('Vencimento*');
    fireEvent.change(dueDateInput, { target: { value: '2025-01-15' } });

    const submitButton = screen.getByText('Salvar');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Erro ao salvar obrigação/)).toBeInTheDocument();
    });
  });

  it('deve mostrar botão "Não Aplicável" para ACCOUNTING', async () => {
    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Não Aplicável Este Mês/)).toBeInTheDocument();
    });
  });

  it('não deve mostrar botão "Não Aplicável" para CLIENT', async () => {
    useAuth.mockReturnValue({
      user: { name: 'Test User', role: 'CLIENT_NORMAL' },
    });

    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Não Aplicável Este Mês/)).not.toBeInTheDocument();
    });
  });

  it('deve abrir modal "Não Aplicável"', async () => {
    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      const notApplicableButton = screen.getByText(/Não Aplicável Este Mês/);
      fireEvent.click(notApplicableButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Por que este imposto não se aplica/)).toBeInTheDocument();
    });
  });

  it('deve fechar modal "Não Aplicável"', async () => {
    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      const notApplicableButton = screen.getByText(/Não Aplicável Este Mês/);
      fireEvent.click(notApplicableButton);
    });

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(screen.queryByText(/Por que este imposto não se aplica/)).not.toBeInTheDocument();
    });
  });

  it('deve marcar como não aplicável com sucesso', async () => {
    api.create.mockResolvedValue({ data: { id: '1' } });

    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      const companyInput = screen.getByPlaceholderText('Digite o código, nome ou CNPJ...');
      fireEvent.focus(companyInput);
      fireEvent.change(companyInput, { target: { value: 'EMP' } });
    });

    await waitFor(() => {
      const dropdownButton = screen.getByText(/Empresa 1/);
      fireEvent.click(dropdownButton);
    });

    const notApplicableButton = screen.getByText(/Não Aplicável Este Mês/);
    fireEvent.click(notApplicableButton);

    await waitFor(() => {
      const reasonTextarea = screen.getByPlaceholderText(/Ex: Empresa sem movimento/);
      fireEvent.change(reasonTextarea, { target: { value: 'Sem movimento no mês' } });
    });

    const confirmButton = screen.getByText('Confirmar');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'NOT_APPLICABLE',
          notApplicableReason: 'Sem movimento no mês',
        })
      );
    });
  });

  it('deve validar motivo antes de marcar como não aplicável', async () => {
    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      const companyInput = screen.getByPlaceholderText('Digite o código, nome ou CNPJ...');
      fireEvent.focus(companyInput);
      fireEvent.change(companyInput, { target: { value: 'EMP' } });
    });

    await waitFor(() => {
      const dropdownButton = screen.getByText(/Empresa 1/);
      fireEvent.click(dropdownButton);
    });

    const notApplicableButton = screen.getByText(/Não Aplicável Este Mês/);
    fireEvent.click(notApplicableButton);

    await waitFor(() => {
      const confirmButton = screen.getByText('Confirmar');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Por favor, informe o motivo/)).toBeInTheDocument();
    });
  });

  it('deve limpar formulário após sucesso', async () => {
    api.create.mockResolvedValue({ data: { id: '1' } });

    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      const companyInput = screen.getByPlaceholderText('Digite o código, nome ou CNPJ...');
      fireEvent.focus(companyInput);
      fireEvent.change(companyInput, { target: { value: 'EMP' } });
    });

    await waitFor(() => {
      const dropdownButton = screen.getByText(/Empresa 1/);
      fireEvent.click(dropdownButton);
    });

    const docTypeSelect = screen.getByLabelText('Tipo do documento*');
    fireEvent.change(docTypeSelect, { target: { value: 'DAS' } });

    const competenceInput = screen.getByPlaceholderText('MM/AAAA');
    fireEvent.change(competenceInput, { target: { value: '012025' } });

    const dueDateInput = screen.getByLabelText('Vencimento*');
    fireEvent.change(dueDateInput, { target: { value: '2025-01-15' } });

    const submitButton = screen.getByText('Salvar');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Obrigação criada com sucesso/)).toBeInTheDocument();
    });

    // Aguardar limpeza do formulário
    await waitFor(() => {
      const companyInputAfter = screen.getByPlaceholderText('Digite o código, nome ou CNPJ...');
      expect(companyInputAfter.value).toBe('');
    }, { timeout: 6000 });
  });

  it('deve atualizar obrigação quando em modo edição', async () => {
    const mockObligation = {
      id: '1',
      companyId: 1,
      dueDate: '2025-01-15T00:00:00Z',
      amount: 1000,
      notes: JSON.stringify({
        companyCode: 'EMP001',
        cnpj: '12345678000190',
        companyName: 'Empresa 1',
        docType: 'DAS',
        competence: '01/2025',
      }),
    };

    api.get.mockResolvedValue({ data: mockObligation });
    api.update.mockResolvedValue({ data: mockObligation });

    render(
      <MemoryRouter initialEntries={['/obligations/1/edit']}>
        <Form />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Editar obrigação')).toBeInTheDocument();
    });

    const docTypeSelect = screen.getByLabelText('Tipo do documento*');
    fireEvent.change(docTypeSelect, { target: { value: 'ISS_RETIDO' } });

    const submitButton = screen.getByText('Salvar Alterações');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.update).toHaveBeenCalledWith('1', expect.any(Object));
    });
  });

  it('deve lidar com erro ao carregar obrigação para edição', async () => {
    api.get.mockRejectedValue(new Error('Load failed'));

    render(
      <MemoryRouter initialEntries={['/obligations/1/edit']}>
        <Form />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Componente deve renderizar mesmo com erro
      expect(screen.getByText('Editar obrigação')).toBeInTheDocument();
    });
  });

  it('deve lidar com notes vazias na edição', async () => {
    const mockObligation = {
      id: '1',
      companyId: 1,
      dueDate: '2025-01-15T00:00:00Z',
      amount: 1000,
      notes: null,
    };

    api.get.mockResolvedValue({ data: mockObligation });

    render(
      <MemoryRouter initialEntries={['/obligations/1/edit']}>
        <Form />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Editar obrigação')).toBeInTheDocument();
    });
  });

  it('deve exibir informações do arquivo selecionado', async () => {
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      const fileInput = screen.getByLabelText('Upload do documento');
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });
      fireEvent.change(fileInput);
    });

    await waitFor(() => {
      expect(screen.getByText(/Arquivo selecionado: test.pdf/)).toBeInTheDocument();
    });
  });

  it('deve limpar dropdown quando busca está vazia', async () => {
    render(
      <BrowserRouter>
        <Form />
      </BrowserRouter>
    );

    await waitFor(() => {
      const companyInput = screen.getByPlaceholderText('Digite o código, nome ou CNPJ...');
      fireEvent.change(companyInput, { target: { value: 'EMP' } });
      fireEvent.change(companyInput, { target: { value: '' } });
    });

    // Dropdown deve mostrar todas as empresas
    await waitFor(() => {
      expect(screen.queryByText(/Empresa 1/)).toBeInTheDocument();
    });
  });
});

