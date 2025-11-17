import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import http from '../../../shared/services/http';
import WelcomeCard from '../../../shared/ui/WelcomeCard';
import { FaClipboardList } from "react-icons/fa";
import { arrayToCsv, downloadBlob, openPrintWindowWithTable } from '../../../shared/utils/exportUtils';
import {
  Page,
  Header,
  Title,
  MonthSelect,
  TableContainer,
  Table,
  TableHeader,
  TableCell,
  StatusIcon,
  Legend,
  LegendItem,
  FilterSection,
  CompanyFilter,
  ExportActions,
  ExportButton
} from '../styles/TaxStatusMatrix.styles';

const TAX_TYPES = [
  { code: 'DAS', name: 'DAS' },
  { code: 'ISS_RETIDO', name: 'ISS Retido' },
  { code: 'FGTS', name: 'FGTS' },
  { code: 'DCTFWeb', name: 'DCTFWeb' },
  { code: 'OUTRO', name: 'Outro' }
];

export default function TaxStatusMatrix() {
  const { user } = useAuth();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${monthStr}`;
  });
  const [companies, setCompanies] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMatrix();
  }, [month]);

  // Atualizar quando a janela receber foco
  useEffect(() => {
    const handleFocus = () => {
      loadMatrix();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [month]);

  async function loadMatrix() {
    try {
      setLoading(true);
      setError('');
      
      // Buscar empresas (exceto contabilidade)
      const companiesResponse = await http.get('/api/empresas');
      const allCompanies = companiesResponse.data.filter(c => c.codigo !== 'EMP001');

      // Buscar obrigações do mês
      const obligationsResponse = await http.get(`/api/obligations?referenceMonth=${month}`);
      const obligations = obligationsResponse.data;

      // Montar dados da matriz
      const matrixData = allCompanies.map(company => {
        const companyObligations = obligations.filter(o => o.companyId === company.id);
        
        const taxStatus = {};
        
        TAX_TYPES.forEach(tax => {
          const obl = companyObligations.find(o => o.taxType === tax.code);
          
          // Considera postado se tem arquivo ou valor
          const isPosted = obl && (obl.files?.length > 0 || (obl.amount && Number(obl.amount) > 0));
          
          taxStatus[tax.code] = {
            posted: isPosted,
            notApplicable: obl?.status === 'NOT_APPLICABLE',
            exists: !!obl
          };
        });

        return {
          ...company,
          taxStatus
        };
      });

      setAllCompanies(matrixData);
      setCompanies(matrixData);
    } catch (err) {
      console.error('Erro ao carregar matriz:', err);
      setError('Erro ao carregar dados da matriz');
    } finally {
      setLoading(false);
    }
  }

  // Filtrar por empresa
  useEffect(() => {
    if (selectedCompany === 'all') {
      setCompanies(allCompanies);
    } else {
      setCompanies(allCompanies.filter(c => c.id === parseInt(selectedCompany)));
    }
  }, [selectedCompany, allCompanies]);

  function getStatusIcon(status) {
    if (status.posted) {
      return { icon: '✓', label: 'Postado', color: '#d1fae5', textColor: '#065f46' };
    }
    if (status.notApplicable) {
      return { icon: 'N/A', label: 'Não Aplicável', color: '#f3f4f6', textColor: '#6b7280' };
    }
    return { icon: '—', label: 'Não Postado', color: '#ffffff', textColor: '#9ca3af' };
  }

  const formatMonthYear = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  };

  // Exportar para Excel (CSV)
  const handleExportExcel = () => {
    const rows = companies.map(company => {
      const row = { Empresa: `${company.codigo} - ${company.nome}` };
      TAX_TYPES.forEach(tax => {
        const status = getStatusIcon(company.taxStatus[tax.code]);
        row[tax.name] = status.label;
      });
      return row;
    });

    const csv = arrayToCsv(rows);
    const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
    downloadBlob(csv, `impostos_postados_${month}_${ts}.csv`, 'text/csv;charset=utf-8;');
  };

  // Exportar para PDF (via impressão)
  const handleExportPdf = () => {
    const columns = [
      { key: 'empresa', header: 'Empresa' },
      ...TAX_TYPES.map(tax => ({ key: tax.code, header: tax.name }))
    ];

    const rows = companies.map(company => {
      const row = { empresa: `${company.codigo} - ${company.nome}` };
      TAX_TYPES.forEach(tax => {
        const status = getStatusIcon(company.taxStatus[tax.code]);
        row[tax.code] = status.icon === '✓' ? 'OK' : status.icon === 'N/A' ? 'N/A' : '-';
      });
      return row;
    });

    openPrintWindowWithTable(`Impostos Postados - ${formatMonthYear(month)}`, columns, rows);
  };

  if (loading) {
    return (
      <>
        <WelcomeCard
          title={`Bem-vindo(a), ${user?.name}`}
          subtitle="Matriz de Status de Impostos"
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
          subtitle="Matriz de Status de Impostos"
        />
        <Page>
          <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
            {error}
          </div>
        </Page>
      </>
    );
  }

  return (
    <>
      <WelcomeCard
        title={`Bem-vindo(a), ${user?.name}`}
        subtitle="Visualize rapidamente quais impostos foram postados"
      />
      <Page>
        <Header>
          <Title> <FaClipboardList/> Impostos Postados - {formatMonthYear(month)}</Title>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <MonthSelect type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
        </Header>

        <FilterSection>
          <CompanyFilter value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
            <option value="all">Todas as Empresas</option>
            {allCompanies.map(c => (
              <option key={c.id} value={c.id}>{c.codigo} - {c.nome}</option>
            ))}
          </CompanyFilter>

          <ExportActions>
            <ExportButton onClick={handleExportPdf} $variant="pdf">
              Exportar PDF
            </ExportButton>
            <ExportButton onClick={handleExportExcel} $variant="excel">
              Exportar Excel
            </ExportButton>
          </ExportActions>
        </FilterSection>

        <Legend>
          <LegendItem>
            <StatusIcon $bgColor="#d1fae5" $textColor="#065f46">✓</StatusIcon> Postado
          </LegendItem>
          <LegendItem>
            <StatusIcon $bgColor="#f3f4f6" $textColor="#6b7280">N/A</StatusIcon> Não Aplicável
          </LegendItem>
          <LegendItem>
            <StatusIcon $bgColor="#ffffff" $textColor="#9ca3af">—</StatusIcon> Não Postado
          </LegendItem>
        </Legend>

        <TableContainer>
          <Table>
            <thead>
              <tr>
                <TableHeader $sticky>Empresa</TableHeader>
                {TAX_TYPES.map(tax => (
                  <TableHeader key={tax.code}>{tax.name}</TableHeader>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.map(company => (
                <tr key={company.id}>
                  <TableCell $sticky $fontWeight="600">
                    {company.codigo} - {company.nome}
                  </TableCell>
                  {TAX_TYPES.map(tax => {
                    const status = getStatusIcon(company.taxStatus[tax.code]);
                    return (
                      <TableCell key={tax.code} $textAlign="center">
                        <StatusIcon 
                          $bgColor={status.color} 
                          $textColor={status.textColor}
                          title={status.label}
                        >
                          {status.icon}
                        </StatusIcon>
                      </TableCell>
                    );
                  })}
                </tr>
              ))}

              {companies.length === 0 && (
                <tr>
                  <TableCell colSpan={TAX_TYPES.length + 1} $textAlign="center" $color="#6b7280">
                    Nenhuma empresa encontrada.
                  </TableCell>
                </tr>
              )}
            </tbody>
          </Table>
        </TableContainer>
      </Page>
    </>
  );
}

