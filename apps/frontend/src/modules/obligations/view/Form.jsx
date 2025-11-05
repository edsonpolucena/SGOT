import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../data/obligation.api.js';
// import InputMask from "react-input-mask"; // Comentado temporariamente
import {
  Page, Title, Card, FormStyled, Field, FieldRow, FieldSmall, Label, Input, Select, Submit
} from '../styles/Obligation.styles';
import http from '../../../shared/services/http';
import { useAuth } from "../../../shared/context/AuthContext";
import WelcomeCard from "../../../shared/ui/WelcomeCard";

export default function Form() {
  const {user} = useAuth();
  const { id } = useParams();
  const isEdit = !!id;

  const [companyCode, setCompanyCode] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState(null);
  const [docType, setDocType] = useState('DAS');
  const [competence, setCompetence] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);

  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await http.get('/api/empresas');
      setCompanies(response.data);
      setFilteredCompanies(response.data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const handleCompanySearch = (searchValue) => {
    setCompanyCode(searchValue);
    setShowDropdown(true);

    if (searchValue === '') {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company =>
        company.codigo.toLowerCase().includes(searchValue.toLowerCase()) ||
        company.nome.toLowerCase().includes(searchValue.toLowerCase()) ||
        company.cnpj.replace(/\D/g, '').includes(searchValue.replace(/\D/g, ''))
      );
      setFilteredCompanies(filtered);
    }
  };

  const handleCompanySelect = (company) => {
    setCompanyCode(company.codigo);
    setCnpj(company.cnpj);
    setCompanyName(company.nome);
    setCompanyId(company.id); // 👈 Salvar o ID da empresa selecionada
    setShowDropdown(false);
  };

  // Carregar dados se for edição (opcional)
  useEffect(() => {
    if (isEdit) {
      loadObligation();
    }
  }, [isEdit, id]);

  const loadObligation = async () => {
    try {
      const response = await api.get(id);
      const obligation = response.data;

      const meta = JSON.parse(obligation.notes || '{}');

      setCompanyCode(meta.companyCode || '');
      setCnpj(meta.cnpj || '');
      setCompanyName(meta.companyName || '');
      setCompanyId(obligation.companyId); // 👈 Carregar companyId na edição
      setDocType(meta.docType || 'DAS');
      setCompetence(meta.competence || '');
      setDueDate(obligation.dueDate.split('T')[0]);
      setAmount(obligation.amount ? obligation.amount.toString() : '');
      setDescription(obligation.notes || '');
    } catch (error) {
      console.error('Erro ao carregar obrigação:', error);
    }
  };

  // --- Funções de valor ---
  function formatCurrency(value) {
    const number = value.replace(/\D/g, "");
    const options = { style: "currency", currency: "BRL" };
    const formatted = new Intl.NumberFormat("pt-BR", options).format(Number(number) / 100);
    return formatted === "R$ 0,00" ? "" : formatted;
  }

  function handleAmountChange(e) {
    setAmount(formatCurrency(e.target.value));
  }

  // Gerar descrição automática
  function generateDescription() {
    if (companyCode && docType && competence) {
      const formattedCompetence = competence.replace('/', '');
      return `${companyCode}.${docType}.${formattedCompetence}`;
    }
    return '';
  }

  useEffect(() => {
    const autoDescription = generateDescription();
    if (autoDescription) {
      setDescription(autoDescription);
    }
  }, [companyCode, docType, competence]);

  async function onSubmit(e) {
    e.preventDefault();

    // 👈 Validar se empresa foi selecionada
    if (!companyId) {
      setErrorMessage('❌ Por favor, selecione uma empresa.');
      setSuccessMessage('');
      return;
    }

    try {
      const companyInfo = {
        companyCode,
        cnpj,
        companyName,
        docType,
        competence
      };

      const obligationData = {
        title: `${docType} - ${competence}`,
        regime: 'SIMPLES',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: new Date(dueDate),
        amount: amount ? parseFloat(amount.replace(/[^\d,]/g, '').replace(',', '.')) : null,
        notes: JSON.stringify(companyInfo),
        companyId: companyId // 👈 Usar o ID da empresa selecionada
      };

      const response = await api.create(obligationData);
      const obligationId = response.data.id;
      
      // Se há arquivo, fazer upload
      if (file) {
        try {
          const formData = new FormData();
          formData.append('files', file);
          
          await http.post(`/api/obligations/${obligationId}/files`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        } catch (uploadError) {
          console.error('Erro no upload do arquivo:', uploadError);
          // Não falha a criação da obrigação se o upload falhar
        }
      }
      
      setSuccessMessage('✅ Obrigação criada com sucesso!');
      setErrorMessage('');
          setCompanyCode('');
          setCnpj('');
          setCompanyName('');
          setCompanyId(null); // 👈 Limpar companyId também
          setDocType('DAS');
          setCompetence('');
          setDueDate('');
          setAmount('');
          setDescription('');
          setFile(null);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Erro ao salvar obrigação:', error);
      setErrorMessage('❌ Erro ao salvar obrigação. Tente novamente.');
      setSuccessMessage('');
    }
  }

  return (
       <>
        <WelcomeCard
          title={`Bem-vindo(a), ${user?.name}`}
          subtitle="Gerencie as empresas cadastradas no sistema"
        />
    <Page>
      <Card>
        {successMessage && (
          <div style={{
            marginBottom: '15px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: '#d1fae5',
            color: '#065f46',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div style={{
            marginBottom: '15px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {errorMessage}
          </div>
        )}

        <FormStyled onSubmit={onSubmit}>
          <Title>{isEdit ? 'Editar obrigação' : 'Nova obrigação'}</Title>

          {/* Empresa */}
          <FieldRow>
            <Field>
              <Label>Empresa*</Label>
              <div style={{ position: 'relative' }} data-dropdown>
                <Input
                  type="text"
                  placeholder="Digite o código, nome ou CNPJ..."
                  value={companyCode}
                  onChange={e => handleCompanySearch(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  required
                />

                {showDropdown && filteredCompanies.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderTop: 'none',
                    borderRadius: '0 0 6px 6px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}>
                    {filteredCompanies.map(company => (
                      <button
                        key={company.id}
                        onClick={() => handleCompanySelect(company)}
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          width: '100%',
                          textAlign: 'left',
                          background: 'white',
                          border: 'none',
                          borderBottom: '1px solid #f3f4f6',
                          fontFamily: 'inherit',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        aria-label={`Selecionar empresa ${company.codigo} - ${company.nome}`}
                      >
                        <div style={{ fontWeight: 'bold', color: '#374151' }}>
                          {company.codigo}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '12px' }}>
                          {company.nome} — {company.cnpj}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>
            <Field>
              <Label>CNPJ</Label>
              <Input
                value={cnpj}
                disabled
                style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
              />
            </Field>
          </FieldRow>

          {/* Nome */}
          <Field>
            <Label>Nome da empresa</Label>
            <Input
              value={companyName}
              disabled
              style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
            />
          </Field>

          {/* Tipo + Competência */}
          <FieldRow>
            <Field>
              <Label>Tipo do documento*</Label>
              <Select value={docType} onChange={e => setDocType(e.target.value)}>
                <option value="DAS">DAS</option>
                <option value="ISS_RETIDO">ISS Retido</option>
                <option value="FGTS">FGTS</option>
                <option value="DCTFWeb">DCTFWeb	</option>
                <option value="OUTRO">Outro</option>
              </Select>
            </Field>
            <Field>
              <Label>Competência*</Label>
              <Input
                type="text"
                placeholder="MM/AAAA"
                value={competence}
                onChange={e => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 6);
                  }
                  setCompetence(value);
                }}
                maxLength={7}
              />
            </Field>
          </FieldRow>

          {/* Vencimento + Valor */}
          <FieldRow>
            <Field>
              <Label>Vencimento*</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </Field>
            <FieldSmall>
              <Label>Valor</Label>
              <Input value={amount} onChange={handleAmountChange} placeholder="R$ 0,00" />
            </FieldSmall>
          </FieldRow>

          {/* Descrição */}
          <Field>
            <Label>Descrição (gerada automaticamente)</Label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Será preenchida automaticamente"
              style={{ backgroundColor: '#f9f9f9', color: '#666' }}
            />
          </Field>

          {/* Upload */}
          <Field>
            <Label>Upload do documento</Label>
            <Input 
              type="file" 
              accept=".pdf,.xml,.xlsx,.xls"
              onChange={e => setFile(e.target.files?.[0] || null)} 
            />
            {file && (
              <div style={{ 
                marginTop: '8px', 
                padding: '8px', 
                backgroundColor: '#f0f8ff', 
                border: '1px solid #3b82f6', 
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                📄 Arquivo selecionado: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </Field>

          <Submit>{isEdit ? 'Salvar Alterações' : 'Salvar'}</Submit>
        </FormStyled>
      </Card>
    </Page>
    </>
  );
}
