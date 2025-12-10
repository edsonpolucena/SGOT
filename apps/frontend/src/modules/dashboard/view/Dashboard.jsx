import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../../../shared/context/AuthContext";
import http from "../../../shared/services/http";
import WelcomeCard from "../../../shared/ui/WelcomeCard";
import { FaEye, FaDownload, FaTrashAlt } from "../../../shared/icons";
import IconButton from "../../../shared/ui/IconButton";
import IconGroup from "../../../shared/ui/IconGroup";
import { FaChartBar } from "react-icons/fa";
import { useObligationActions } from "../../../shared/hooks/useObligationActions";
import SentryTestButton from "../../../shared/ui/SentryTestButton";
import {
  StatsGrid,
  StatCard,
  StatNumber,
  StatLabel,
  Table,
  Th,
  Td,
  Pagination
} from "../../../shared/styles/DashboardCommon.styles";

const DashboardContainer = styled.div`
  padding: 20px;
`;

const TaxStatsSection = styled.div`
  margin: 30px 0;
`;

const TaxStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const TaxCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => {
    if (props.$completionRate === 100) return '#10b981'; // verde
    if (props.$completionRate >= 50) return '#f59e0b'; // amarelo
    return '#ef4444'; // vermelho
  }};
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const TaxName = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
`;

const TaxRatio = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: ${props => {
    if (props.$completionRate === 100) return '#10b981';
    if (props.$completionRate >= 50) return '#f59e0b';
    return '#ef4444';
  }};
  margin-bottom: 8px;
`;

const TaxProgress = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  width: ${props => props.$percentage}%;
  background: ${props => {
    if (props.$percentage === 100) return '#10b981';
    if (props.$percentage >= 50) return '#f59e0b';
    return '#ef4444';
  }};
  transition: width 0.3s ease;
`;

export default function Dashboard() {
  const { user, isAccounting, isClient } = useAuth();
  const navigate = useNavigate();
  const { handleViewObligation, handleDownloadFiles, handleDeleteObligation, alertComponent } = useObligationActions();

  const [stats, setStats] = useState({
    totalObligations: 0,
  });
  const [obligations, setObligations] = useState([]);
  const [taxStats, setTaxStats] = useState([]);
  const [deadlineCompliance, setDeadlineCompliance] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [unviewedAlerts, setUnviewedAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (isClient) {
      navigate("/dashboard/client", { replace: true });
      return;
    }
    loadDashboardData();
  }, [isClient, navigate]);

  useEffect(() => {
    const handleFocus = () => {
      if (!isClient) {
        loadDashboardData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isClient]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const response = await http.get("/api/obligations");

      const obligations = response.data.map((o) => {
        let notes = {};
        try {
          notes = JSON.parse(o.notes || "{}");
        } catch (e) {}

        return {
          ...o,
          companyCode: notes.companyCode || "",
          docType: notes.docType || "",
          competence: notes.competence || "",
          cnpj: notes.cnpj || "",
          companyName: notes.companyName || "",
          placeholder: Boolean(notes.placeholder),
        };
      });

      setStats({
        totalObligations: obligations.length,
      });

      setObligations(obligations);

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      try {
        const taxStatsResponse = await http.get(`/api/analytics/tax-type-stats?month=${currentMonth}`);
        setTaxStats(taxStatsResponse.data.taxStats || []);
      } catch (taxError) {
        console.error("Erro ao carregar estatísticas de impostos:", taxError);
        setTaxStats([]);
      }

      try {
        const deadlineResponse = await http.get(`/api/analytics/deadline-compliance`);
        setDeadlineCompliance(deadlineResponse.data);
      } catch (deadlineError) {
        console.error("Erro ao carregar estatísticas de prazo:", deadlineError);
        setDeadlineCompliance(null);
      }

      try {
        const alertsResponse = await http.get(`/api/analytics/overdue-and-upcoming?month=${currentMonth}`);
        setAlerts(alertsResponse.data);
      } catch (alertsError) {
        console.error("Erro ao carregar alertas:", alertsError);
        setAlerts(null);
      }

      try {
        const unviewedResponse = await http.get('/api/analytics/unviewed-alerts');
        setUnviewedAlerts(unviewedResponse.data);
      } catch (unviewedError) {
        console.error("Erro ao carregar alertas de não visualizados:", unviewedError);
        setUnviewedAlerts(null);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleSort = (col) => {
    const order = sortColumn === col && sortOrder === "asc" ? "desc" : "asc";
    setSortColumn(col);
    setSortOrder(order);
  };

  const filteredObligations = [...obligations]
    .filter((o) => {
      return (
        o.companyCode?.toLowerCase().includes(search.toLowerCase()) ||
        o.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        o.docType?.toLowerCase().includes(search.toLowerCase()) ||
        o.competence?.toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (!sortColumn) return 0;

      let aVal, bVal;
      switch (sortColumn) {
        case "createdAt":
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
          break;
        case "companyCode":
          aVal = a.companyCode || "";
          bVal = b.companyCode || "";
          break;
        case "docType":
          aVal = a.docType || "";
          bVal = b.docType || "";
          break;
        case "competence":
          aVal = a.competence || "";
          bVal = b.competence || "";
          break;
        case "dueDate":
          aVal = new Date(a.dueDate);
          bVal = new Date(b.dueDate);
          break;
        case "amount":
          aVal = a.amount || 0;
          bVal = b.amount || 0;
          break;
        case "postedBy":
          aVal = a.user?.name || "";
          bVal = b.user?.name || "";
          break;
        default:
          aVal = "";
          bVal = "";
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredObligations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredObligations.length / itemsPerPage);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const isInCurrentMonth = (o) => {
    const d = new Date(o.dueDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  const monthObligations = obligations.filter(isInCurrentMonth);
  const totalExpected = monthObligations.length || 0;
  const completedOrPlaceholder = monthObligations.filter(
    (o) => o.placeholder || (o.status && o.status !== "PENDING")
  ).length;
  const compliancePercent = totalExpected
    ? Math.round((completedOrPlaceholder / totalExpected) * 100)
    : 0;

  const complianceColor = compliancePercent >= 90
    ? "#10b981" // verde
    : compliancePercent >= 70
    ? "#f59e0b" // amarelo
    : "#ef4444"; // vermelho

  if (loading) {
    return <DashboardContainer>Carregando dashboard...</DashboardContainer>;
  }

  return (
    <DashboardContainer>
      <WelcomeCard
      title={`Bem-vindo(a), ${user?.name}`}
      subtitle="Gerencie todas as obrigações tributárias"
    />

      {import.meta.env.MODE === 'development' && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '12px', 
          background: '#f3f4f6', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <SentryTestButton />
        </div>
      )}

      <StatsGrid>
        <StatCard color="#667eea">
          <StatNumber color="#667eea">{stats.totalObligations}</StatNumber>
          <StatLabel>Total de Obrigações</StatLabel>
        </StatCard>
        
        {deadlineCompliance && (
          <StatCard color={
            deadlineCompliance.complianceRate >= 90 ? '#10b981' :
            deadlineCompliance.complianceRate >= 70 ? '#f59e0b' :
            '#ef4444'
          }>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <StatNumber style={{ 
                color: deadlineCompliance.complianceRate >= 90 ? '#10b981' :
                       deadlineCompliance.complianceRate >= 70 ? '#f59e0b' :
                       '#ef4444'
              }}>
                {deadlineCompliance.complianceRate}%
              </StatNumber>
              <StatLabel>Prazos Cumpridos</StatLabel>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280', 
                marginTop: '8px',
                textAlign: 'center'
              }}>
                {deadlineCompliance.onTime} no prazo / {deadlineCompliance.late} atrasados
              </div>
              <div style={{ 
                fontSize: '0.7rem', 
                color: '#9ca3af', 
                marginTop: '4px'
              }}>
                (4+ dias antes do vencimento)
              </div>
            </div>
          </StatCard>
        )}
      </StatsGrid>

      {alerts && (alerts.overdue.count > 0 || alerts.dueSoon.count > 0) && (
        <div style={{ 
          margin: '20px 0', 
          padding: '16px', 
          background: '#fef3c7', 
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          {alerts.overdue.count > 0 && (
            <div style={{ flex: '1', minWidth: '250px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#991b1b', marginBottom: '8px' }}>
                ⚠️ {alerts.overdue.count} Impostos Atrasados
              </div>
              <div style={{ fontSize: '0.85rem', color: '#92400e' }}>
                {alerts.overdue.items.slice(0, 3).map((item, i) => (
                  <div key={i} style={{ marginBottom: '4px' }}>
                    • {item.company} - {item.taxType} (venceu há {item.daysOverdue} dias)
                  </div>
                ))}
                {alerts.overdue.count > 3 && (
                  <div style={{ fontStyle: 'italic', marginTop: '4px' }}>
                    + {alerts.overdue.count - 3} mais...
                  </div>
                )}
              </div>
            </div>
          )}
          
          {alerts.dueSoon.count > 0 && (
            <div style={{ flex: '1', minWidth: '250px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#d97706', marginBottom: '8px' }}>
                ⏰ {alerts.dueSoon.count} Impostos Vencendo em 2 Dias
              </div>
              <div style={{ fontSize: '0.85rem', color: '#92400e' }}>
                {alerts.dueSoon.items.slice(0, 3).map((item, i) => (
                  <div key={i} style={{ marginBottom: '4px' }}>
                    • {item.company} - {item.taxType} (vence em {item.daysUntilDue} dias)
                  </div>
                ))}
                {alerts.dueSoon.count > 3 && (
                  <div style={{ fontStyle: 'italic', marginTop: '4px' }}>
                    + {alerts.dueSoon.count - 3} mais...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {unviewedAlerts && unviewedAlerts.total > 0 && (
        <div style={{ 
          margin: '20px 0', 
          padding: '16px', 
          background: '#e0f2fe', 
          border: '1px solid #0ea5e9',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#075985', marginBottom: '12px' }}>
             {unviewedAlerts.total} Documento(s) Não Visualizado(s) pelos Clientes
          </div>
          <div style={{ fontSize: '0.85rem', color: '#0c4a6e', marginBottom: '8px' }}>
            Documentos postados aguardando visualização:
          </div>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '12px' }}>
            {unviewedAlerts.overdue && unviewedAlerts.overdue.length > 0 && (
              <div style={{ flex: '1', minWidth: '220px', background: '#fee2e2', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #dc2626' }}>
                <div style={{ fontWeight: '600', color: '#991b1b', marginBottom: '6px' }}>
                   Vencidos ({unviewedAlerts.overdue.length})
                </div>
                {unviewedAlerts.overdue.slice(0, 2).map((item, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: '#7f1d1d', marginBottom: '3px' }}>
                    • {item.company} - {item.taxType} ({item.daysOverdue || 0} dias atrasado)
                  </div>
                ))}
                {unviewedAlerts.overdue.length > 2 && (
                  <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#991b1b', marginTop: '4px' }}>
                    + {unviewedAlerts.overdue.length - 2} mais...
                  </div>
                )}
              </div>
            )}

            {unviewedAlerts.oneDay.length > 0 && (
              <div style={{ flex: '1', minWidth: '220px', background: '#fef2f2', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #dc2626' }}>
                <div style={{ fontWeight: '600', color: '#991b1b', marginBottom: '6px' }}>
                   Vence em 1 dia ({unviewedAlerts.oneDay.length})
                </div>
                {unviewedAlerts.oneDay.slice(0, 2).map((item, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: '#7f1d1d', marginBottom: '3px' }}>
                    • {item.company} - {item.taxType}
                  </div>
                ))}
                {unviewedAlerts.oneDay.length > 2 && (
                  <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#991b1b', marginTop: '4px' }}>
                    + {unviewedAlerts.oneDay.length - 2} mais...
                  </div>
                )}
              </div>
            )}

            {unviewedAlerts.twoDays.length > 0 && (
              <div style={{ flex: '1', minWidth: '220px', background: '#fef3c7', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '6px' }}>
                  ⚠️ Vence em 2 dias ({unviewedAlerts.twoDays.length})
                </div>
                {unviewedAlerts.twoDays.slice(0, 2).map((item, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: '#78350f', marginBottom: '3px' }}>
                    • {item.company} - {item.taxType}
                  </div>
                ))}
                {unviewedAlerts.twoDays.length > 2 && (
                  <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#92400e', marginTop: '4px' }}>
                    + {unviewedAlerts.twoDays.length - 2} mais...
                  </div>
                )}
              </div>
            )}

            {unviewedAlerts.threeDays.length > 0 && (
              <div style={{ flex: '1', minWidth: '220px', background: '#dbeafe', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontWeight: '600', color: '#1e40af', marginBottom: '6px' }}>
                  ℹ️ Vence em 3 dias ({unviewedAlerts.threeDays.length})
                </div>
                {unviewedAlerts.threeDays.slice(0, 2).map((item, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: '#1e3a8a', marginBottom: '3px' }}>
                    • {item.company} - {item.taxType}
                  </div>
                ))}
                {unviewedAlerts.threeDays.length > 2 && (
                  <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#1e40af', marginTop: '4px' }}>
                    + {unviewedAlerts.threeDays.length - 2} mais...
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <button
              onClick={() => navigate('/notifications/unviewed')}
              style={{
                background: '#0ea5e9',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Ver Documentos Não Visualizados
            </button>
          </div>
        </div>
      )}

      {taxStats.length > 0 && (
        <TaxStatsSection>
          <h2> <FaChartBar/> Status por Tipo de Imposto</h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '8px' }}>
            Progresso de envio por tipo de imposto no mês atual
          </p>
          <TaxStatsGrid>
            {taxStats.map((tax) => (
              <TaxCard key={tax.taxType} $completionRate={tax.completionRate}>
                <TaxName>{tax.taxName}</TaxName>
                <TaxRatio $completionRate={tax.completionRate}>
                  {tax.postedCount}/{tax.expectedCount}
                </TaxRatio>
                <TaxProgress>
                  {tax.completionRate}% concluído
                </TaxProgress>
                <ProgressBarContainer>
                  <ProgressBarFill $percentage={tax.completionRate} />
                </ProgressBarContainer>
              </TaxCard>
            ))}
          </TaxStatsGrid>
        </TaxStatsSection>
      )}

      <h2>Obrigações Recentes</h2>
      <input
        type="text"
        placeholder="Pesquisar..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "10px", padding: "8px", width: "100%", maxWidth: "300px" }}
      />

      <Table>
        <thead>
          <tr>
            <Th onClick={() => handleSort("createdAt")}>Data Upload</Th>
            <Th onClick={() => handleSort("companyCode")}>Empresa</Th>
            <Th onClick={() => handleSort("docType")}>Tipo</Th>
            <Th onClick={() => handleSort("competence")}>Competência</Th>
            <Th onClick={() => handleSort("dueDate")}>Vencimento</Th>
            <Th onClick={() => handleSort("amount")}>Valor</Th>
            <Th onClick={() => handleSort("postedBy")}>Postado</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length === 0 ? (
            <tr>
              <Td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                Nenhuma obrigação encontrada
              </Td>
            </tr>
          ) : (
            currentItems.map((o) => (
              <tr key={o.id}>
                <Td>{new Date(o.createdAt).toLocaleDateString("pt-BR")}</Td>
                <Td>{o.companyCode} - {o.companyName}</Td>
                <Td>{o.docType}</Td>
                <Td>{o.competence}</Td>
                <Td>{new Date(o.dueDate).toLocaleDateString("pt-BR")}</Td>
                <Td>
                  {o.amount
                    ? `R$ ${Number(o.amount).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}`
                    : "-"}
                </Td>
                <Td>{o.user?.name || "N/A"}</Td>
                <Td>
                  <IconGroup>
                      <IconButton 
                       icon={FaEye}
                       onClick={() => handleViewObligation(o.id)}
                        title="Visualizar"
                      />
                      <IconButton 
                        icon={FaDownload}
                        onClick={() => handleDownloadFiles(o.id)}
                        title="Download"
                      />
                      <IconButton 
                        icon={FaTrashAlt}
                        onClick={() => handleDeleteObligation(o.id, loadDashboardData)}
                        title="Excluir"
                        variant="danger"
                      />
                  </IconGroup>
                  
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <Pagination>
        <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
          Anterior
        </button>
        <span>
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Próxima
        </button>
      </Pagination>
      {alertComponent}
    </DashboardContainer>
  );
}
