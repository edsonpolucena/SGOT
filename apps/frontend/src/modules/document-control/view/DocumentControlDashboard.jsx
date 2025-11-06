import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import http from '../../../shared/services/http';
import {
  Page,
  Header,
  Title,
  Card,
  SummaryCards,
  SummaryCard,
  CardValue,
  CardLabel,
  CompanyList,
  CompanyCard,
  CompanyHeader,
  CompanyName,
  Badge,
  ProgressBar,
  ProgressFill,
  Stats,
  Stat,
  ViewButton,
  MonthSelect
} from '../styles/DocumentControlDashboard.styles';
import WelcomeCard from '../../../shared/ui/WelcomeCard';

export default function DocumentControlDashboard() {
  const { user } = useAuth();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${monthStr}`;
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, [month]);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError('');
      const response = await http.get(`/api/analytics/document-control-dashboard?month=${month}`);
      setData(response.data);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <WelcomeCard
          title={`Bem-vindo(a), ${user?.name}`}
          subtitle="Controle de Documentos Mensais"
        />
        <Page>
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Carregando...
          </div>
        </Page>
      </>
    );
  }

  if (error) {
    return (
      <>
        <WelcomeCard
          title={`Bem-vindo(a), ${user?.name}`}
          subtitle="Controle de Documentos Mensais"
        />
        <Page>
          <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
            {error}
          </div>
        </Page>
      </>
    );
  }

  if (!data) return null;

  const formatMonthYear = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  };

  return (
    <>
      <WelcomeCard
        title={`Bem-vindo(a), ${user?.name}`}
        subtitle="Controle de Documentos Mensais - Acompanhe o envio de obrigações"
      />
      <Page>
        <Header>
          <Title>📊 Controle de Documentos - {formatMonthYear(month)}</Title>
          <MonthSelect type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </Header>

        <SummaryCards>
          <SummaryCard color="green">
            <CardValue>{data.summary.completeCompanies}</CardValue>
            <CardLabel>Empresas Completas</CardLabel>
          </SummaryCard>
          <SummaryCard color="orange">
            <CardValue>{data.summary.incompleteCompanies}</CardValue>
            <CardLabel>Empresas Pendentes</CardLabel>
          </SummaryCard>
          <SummaryCard color="blue">
            <CardValue>{(data.summary.overallCompletion * 100).toFixed(0)}%</CardValue>
            <CardLabel>Taxa de Conclusão</CardLabel>
          </SummaryCard>
          <SummaryCard color="gray">
            <CardValue>{data.summary.totalObligations}</CardValue>
            <CardLabel>Total de Obrigações</CardLabel>
          </SummaryCard>
        </SummaryCards>

        <CompanyList>
          {data.companies.map(company => (
            <CompanyCard key={company.companyId} complete={company.status === 'COMPLETE'}>
              <CompanyHeader>
                <CompanyName>{company.companyName}</CompanyName>
                <Badge status={company.status}>
                  {company.status === 'COMPLETE' ? '✅ Completo' : '⏳ Pendente'}
                </Badge>
              </CompanyHeader>

              <ProgressBar>
                <ProgressFill 
                  percentage={company.completionRate * 100} 
                  color={company.completionRate === 1 ? '#10b981' : '#f59e0b'}
                />
              </ProgressBar>
              <div style={{ 
                fontSize: '12px', 
                color: '#6b7280', 
                marginTop: '4px',
                textAlign: 'right'
              }}>
                {(company.completionRate * 100).toFixed(0)}% concluído
              </div>

              <Stats>
                <Stat color="green">
                  ✅ Postados: <strong>{company.posted}</strong>
                </Stat>
                <Stat color="gray">
                  🚫 Não Aplicável: <strong>{company.notApplicable}</strong>
                </Stat>
                <Stat color="orange">
                  ⏳ Pendentes: <strong>{company.pending}</strong>
                </Stat>
                {company.missing > 0 && (
                  <Stat color="red">
                    ❌ Faltam Criar: <strong>{company.missing}</strong>
                    {company.missingTaxes && company.missingTaxes.length > 0 && (
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>
                        ({company.missingTaxes.join(', ')})
                      </div>
                    )}
                  </Stat>
                )}
              </Stats>

              <ViewButton onClick={() => window.location.href = `/obligations?companyId=${company.companyId}&month=${month}`}>
                Ver Detalhes
              </ViewButton>
            </CompanyCard>
          ))}

          {data.companies.length === 0 && (
            <Card style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Nenhuma empresa encontrada para este mês.
            </Card>
          )}
        </CompanyList>
      </Page>
    </>
  );
}

