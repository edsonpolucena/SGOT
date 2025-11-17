import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCompanyController } from "../controller/useCompanyController";
import { useAuth } from "../../../shared/context/AuthContext";
import WelcomeCard from "../../../shared/ui/WelcomeCard";

import {
  Wrapper,
  FormContainer,
  Title,
  Field,
  Button,
  ErrorMessage
} from "../styles/CompanyForm.styles";

export default function CompanyForm() {
  const {user} = useAuth();
  const { createCompany, getCompanies, updateCompany, getCompanyById, loading, error } = useCompanyController();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const [form, setForm] = useState({
    codigo: "",
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    endereco: "",
    status: "ativa",
  });
  const [nextCode, setNextCode] = useState("");

  useEffect(() => {
    if (!isEdit) {
      loadNextCode();
    } else {
      loadCompanyData();
    }
  }, [isEdit, id]);

  const loadNextCode = async () => {
    try {
      const companies = await getCompanies();
      const maxCode = companies.reduce((max, company) => {
        const codeNum = parseInt(company.codigo.replace(/\D/g, ''));
        return codeNum > max ? codeNum : max;
      }, 0);
      const nextCodeNum = maxCode + 1;
      setNextCode(`EMP${nextCodeNum.toString().padStart(3, '0')}`);
      setForm(prev => ({ ...prev, codigo: `EMP${nextCodeNum.toString().padStart(3, '0')}` }));
    } catch (err) {
      console.error('Erro ao carregar próximo código:', err);
      setNextCode("EMP001");
      setForm(prev => ({ ...prev, codigo: "EMP001" }));
    }
  };

  const loadCompanyData = async () => {
    try {
      const company = await getCompanyById(id);
      if (company) {
        setForm({
          codigo: company.codigo,
          nome: company.nome,
          cnpj: company.cnpj,
          email: company.email || "",
          telefone: company.telefone || "",
          endereco: company.endereco || "",
          status: company.status,
        });
      }
    } catch (err) {
      console.error('Erro ao carregar dados da empresa:', err);
    }
  };

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function formatCNPJ(value) {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara do CNPJ
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }

  function formatPhone(value) {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara do telefone brasileiro
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    } else {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
  }

  function handleCNPJChange(e) {
    const formatted = formatCNPJ(e.target.value);
    setForm({ ...form, cnpj: formatted });
  }

  function handlePhoneChange(e) {
    const formatted = formatPhone(e.target.value);
    setForm({ ...form, telefone: formatted });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (isEdit) {
        // Para edição, enviar apenas os campos que foram alterados
        const dataToUpdate = {
          nome: form.nome,
          email: form.email || null,
          telefone: form.telefone ? form.telefone.replace(/\D/g, '') : null,
          endereco: form.endereco || null,
          status: form.status
        };
        await updateCompany(id, dataToUpdate);
        alert(`Empresa atualizada com sucesso: ${form.nome}`);
      } else {
        // Remover máscaras dos campos antes de enviar
        const dataToSend = {
          ...form,
          cnpj: form.cnpj.replace(/\D/g, ''), // Remove tudo que não é dígito
          telefone: form.telefone ? form.telefone.replace(/\D/g, '') : null
        };
        const empresa = await createCompany(dataToSend);
        alert(`Empresa cadastrada com sucesso: ${empresa.nome}`);
      }
      navigate('/companies');
    } catch (err) {
      console.error('Erro ao salvar empresa:', err);
      alert(err.response?.data?.message || 'Erro ao salvar empresa');
    }
  }

  return (
     <> 
    <WelcomeCard
      title={isEdit ? "Editar Empresa" : "Cadastrar Empresa"}
      subtitle="Gerencie os dados da sua empresa"
    />
    <Wrapper>
    
      <FormContainer>
        <Title>{isEdit ? 'Editar Empresa' : 'Cadastrar Empresa'}</Title>
        <form onSubmit={handleSubmit}>
          <Field>
            <label>Código</label>
            <input 
              name="codigo" 
              value={form.codigo} 
              disabled 
              style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
            />
            <small style={{ color: '#6c757d', fontSize: '0.8rem' }}>
              Código gerado automaticamente
            </small>
          </Field>

          <Field>
            <label>Nome da Empresa *</label>
            <input 
              name="nome" 
              value={form.nome} 
              onChange={handleChange} 
              placeholder="Digite o nome da empresa"
              required 
            />
          </Field>

          <Field>
            <label>CNPJ *</label>
            <input 
              name="cnpj" 
              value={form.cnpj} 
              onChange={handleCNPJChange} 
              placeholder="00.000.000/0000-00"
              maxLength={18}
              required 
            />
          </Field>

          <Field>
            <label>Email</label>
            <input 
              name="email" 
              type="email"
              value={form.email} 
              onChange={handleChange} 
              placeholder="contato@empresa.com"
            />
          </Field>

          <Field>
            <label>Telefone</label>
            <input 
              name="telefone" 
              value={form.telefone} 
              onChange={handlePhoneChange} 
              placeholder="(47) 99999-9999"
              maxLength={15}
            />
          </Field>

          <Field>
            <label>Endereço</label>
            <input 
              name="endereco" 
              value={form.endereco} 
              onChange={handleChange} 
              placeholder="Rua, número, bairro, cidade/UF"
            />
          </Field>

          <Field>
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="ativa">Ativa</option>
              <option value="inativa">Inativa</option>
            </select>
          </Field>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : (isEdit ? "Atualizar" : "Salvar")}
            </Button>
            <Button 
              type="button" 
              onClick={() => navigate('/companies')}
              style={{ backgroundColor: '#6c757d' }}
            >
              Cancelar
            </Button>
          </div>
        </form>

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </FormContainer>
    </Wrapper>
    </>
  );
}
