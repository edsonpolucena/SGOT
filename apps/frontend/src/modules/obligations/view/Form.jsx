import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../data/obligation.api.js';
import {
  Page, Title, Card, FormStyled, Field, FieldRow, FieldSmall, Label, Input, Select, Submit
} from '../styles/Obligation.styles';
import http from '../../../shared/services/http';
import { useAuth } from "../../../shared/context/AuthContext";
import WelcomeCard from "../../../shared/ui/WelcomeCard";
import { FaClipboardList } from "react-icons/fa";

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
  const [showNotApplicableModal, setShowNotApplicableModal] = useState(false);
  const [notApplicableReason, setNotApplicableReason] = useState('');
  const [taxCalendar, setTaxCalendar] = useState({});

  useEffect(() => {
    loadCompanies();
    loadTaxCalendar();
  }, []);

  async function loadTaxCalendar() {
    try {
      const response = await http.get('/api/tax-calendar');
      const calendarMap = {};
      response.data.forEach(item => {
        calendarMap[item.taxType] = item.dueDay;
      });
      setTaxCalendar(calendarMap);
    } catch (err) {
      console.error('Erro ao carregar calendário fiscal:', err);
    }
  }

  const loadCompanies = async () => {
    try {
      const response = await http.get('/api/empresas');
      const activeCompanies = response.data.filter(company => company.status === 'ativa');
      setCompanies(activeCompanies);
      setFilteredCompanies(activeCompanies);
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
    setCompanyId(company.id);
    setShowDropdown(false);
  };

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
      setCompanyId(obligation.companyId);
      setDocType(meta.docType || 'DAS');
      setCompetence(meta.competence || '');
      setDueDate(obligation.dueDate.split('T')[0]);
      setAmount(obligation.amount ? obligation.amount.toString() : '');
      setDescription(obligation.notes || '');
    } catch (error) {
      console.error('Erro ao carregar obrigação:', error);
    }
  };

  function formatCurrency(value) {
    const number = value.replace(/\D/g, "");
    const options = { style: "currency", currency: "BRL" };
    const formatted = new Intl.NumberFormat("pt-BR", options).format(Number(number) / 100);
    return formatted === "R$ 0,00" ? "" : formatted;
  }

  function handleAmountChange(e) {
    setAmount(formatCurrency(e.target.value));
  }

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

  useEffect(() => {
    if (competence && competence.includes('/') && docType && taxCalendar[docType]) {
      const [competenceMonth, competenceYear] = competence.split('/');
      const dueDay = taxCalendar[docType];
      
      const year = parseInt(competenceYear);
      const month = parseInt(competenceMonth);
      
      if (month >= 1 && month <= 12 && year >= 2020 && year <= 2100) {
        let dueYear = year;
        let dueMonth = month + 1;
        
        if (dueMonth > 12) {
          dueMonth = 1;
          dueYear = year + 1;
        }
        
        const lastDayOfMonth = new Date(dueYear, dueMonth, 0).getDate();
        const finalDueDay = Math.min(dueDay, lastDayOfMonth);
        
        const formattedDate = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(finalDueDay).padStart(2, '0')}`;
        
        if (!dueDate || dueDate.startsWith(`${dueYear}-${String(dueMonth).padStart(2, '0')}`)) {
          setDueDate(formattedDate);
        }
      }
    }
  }, [competence, docType, taxCalendar]);

  async function onSubmit(e) {
    e.preventDefault();

    if (!companyId) {
      setErrorMessage('❌ Por favor, selecione uma empresa.');
      setSuccessMessage('');
      return;
    }

    if (!dueDate) {
      setErrorMessage('❌ Por favor, informe a data de vencimento.');
      setSuccessMessage('');
      return;
    }

    if (!file) {
      setErrorMessage('❌ Por favor, anexe um arquivo.');
      setSuccessMessage('');
      return;
    }

    if (!amount || amount.trim() === '') {
      setErrorMessage('❌ Por favor, informe o valor da obrigação.');
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

      const [year, month, day] = dueDate.split('-').map(Number);
      const dueDateObj = new Date(year, month - 1, day);
      const referenceMonth = `${dueDateObj.getFullYear()}-${String(dueDateObj.getMonth() + 1).padStart(2, '0')}`;

      const obligationData = {
        title: `${docType} - ${competence}`,
        regime: 'SIMPLES',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: dueDateObj.toISOString(),
        amount: amount ? parseFloat(amount.replace(/[^\d,]/g, '').replace(',', '.')) : null,
        notes: JSON.stringify(companyInfo),
        companyId: companyId,
        taxType: docType,
        referenceMonth: referenceMonth
      };

      const response = await api.create(obligationData);
      const obligationId = response.data.id;
      
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
        }
      }
      
      setSuccessMessage('✅ Obrigação criada com sucesso!');
      setErrorMessage('');
          setCompanyCode('');
          setCnpj('');
          setCompanyName('');
          setCompanyId(null);
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

  async function handleMarkNotApplicable() {
    if (!companyId) {
      setErrorMessage('❌ Por favor, selecione uma empresa.');
      setSuccessMessage('');
      return;
    }

    if (!competence || !competence.includes('/')) {
      setErrorMessage('❌ Por favor, informe a competência (formato: MM/AAAA).');
      setSuccessMessage('');
      return;
    }

    if (!notApplicableReason.trim()) {
      setErrorMessage('❌ Por favor, informe o motivo.');
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

      const [competenceMonth, competenceYear] = competence.split('/');
      const referenceMonth = `${competenceYear}-${String(competenceMonth).padStart(2, '0')}`;
      
      let dueDateObj;
      let calculatedDueDate = '';
      
      if (dueDate) {
        const [year, month, day] = dueDate.split('-').map(Number);
        dueDateObj = new Date(year, month - 1, day);
        calculatedDueDate = dueDate;
      } else if (competence && competence.includes('/') && taxCalendar[docType]) {
        const [compMonth, compYear] = competence.split('/');
        const year = parseInt(compYear);
        const month = parseInt(compMonth);
        const dueDay = taxCalendar[docType];
        
        if (month >= 1 && month <= 12 && year >= 2020 && year <= 2100) {
          let dueYear = year;
          let dueMonth = month + 1;
          
          if (dueMonth > 12) {
            dueMonth = 1;
            dueYear = year + 1;
          }
          
          const lastDayOfMonth = new Date(dueYear, dueMonth, 0).getDate();
          const finalDueDay = Math.min(dueDay, lastDayOfMonth);
          
          dueDateObj = new Date(dueYear, dueMonth - 1, finalDueDay);
          calculatedDueDate = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(finalDueDay).padStart(2, '0')}`;
          
          setDueDate(calculatedDueDate);
        } else {
          let dueYear = year;
          let dueMonth = month + 1;
          if (dueMonth > 12) {
            dueMonth = 1;
            dueYear = year + 1;
          }
          dueDateObj = new Date(dueYear, dueMonth, 0);
          const lastDay = dueDateObj.getDate();
          calculatedDueDate = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          setDueDate(calculatedDueDate);
        }
      } else {
        const [compMonth, compYear] = competence.split('/');
        const year = parseInt(compYear);
        const month = parseInt(compMonth);
        let dueYear = year;
        let dueMonth = month + 1;
        if (dueMonth > 12) {
          dueMonth = 1;
          dueYear = year + 1;
        }
        dueDateObj = new Date(dueYear, dueMonth, 0);
        const lastDay = dueDateObj.getDate();
        calculatedDueDate = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        setDueDate(calculatedDueDate);
      }

      const obligationData = {
        title: `${docType} - ${competence || referenceMonth}`,
        regime: 'SIMPLES',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: dueDateObj.toISOString(),
        amount: null,
        notes: JSON.stringify(companyInfo),
        companyId: companyId,
        taxType: docType,
        referenceMonth: referenceMonth,
        status: 'NOT_APPLICABLE',
        notApplicableReason: notApplicableReason
      };

      await api.create(obligationData);
      
      setSuccessMessage('✅ Obrigação marcada como "Não Aplicável" com sucesso!');
      setErrorMessage('');
      setShowNotApplicableModal(false);
      setNotApplicableReason('');
      
      setCompanyCode('');
      setCnpj('');
      setCompanyName('');
      setCompanyId(null);
      setDocType('DAS');
      setCompetence('');
      setDueDate('');
      setAmount('');
      setDescription('');
      
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Erro ao marcar como não aplicável:', error);
      setErrorMessage('❌ Erro ao marcar como não aplicável. Tente novamente.');
      setSuccessMessage('');
    }
  }

  return (
       <>
        <WelcomeCard
          title={`Bem-vindo(a), ${user?.name}`}
          subtitle="Cadastre as obrigações fiscais no sistema"
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
          <Title> <FaClipboardList/> {isEdit ? 'Editar obrigação' : 'Nova obrigação'}</Title>

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

          <Field>
            <Label>Nome da empresa</Label>
            <Input
              value={companyName}
              disabled
              style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
            />
          </Field>

          <FieldRow>
            <Field>
              <Label>Tipo do documento*</Label>
              <Select value={docType} onChange={e => setDocType(e.target.value)}>
                <option value="DAS">DAS</option>
                <option value="ISS_RETIDO">ISS Retido</option>
                <option value="FGTS">FGTS</option>
                <option value="DCTFWeb">DCTFWeb</option>
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

          <Field>
            <Label>Descrição (gerada automaticamente)</Label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Será preenchida automaticamente"
              style={{ backgroundColor: '#f9f9f9', color: '#666' }}
            />
          </Field>

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

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <Submit type="submit">{isEdit ? 'Salvar Alterações' : 'Salvar'}</Submit>
            {user?.role?.startsWith('ACCOUNTING_') && !isEdit && (
              <button
                type="button"
                onClick={() => setShowNotApplicableModal(true)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
              >
                🚫 Não Aplicável Este Mês
              </button>
            )}
          </div>
        </FormStyled>
      </Card>

      {showNotApplicableModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', color: '#374151' }}>
              Por que este imposto não se aplica este mês?
            </h3>
            <textarea
              value={notApplicableReason}
              onChange={(e) => setNotApplicableReason(e.target.value)}
              placeholder="Ex: Empresa sem movimento no mês, Imposto não incidente, etc."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowNotApplicableModal(false);
                  setNotApplicableReason('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleMarkNotApplicable}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
    </>
  );
}
