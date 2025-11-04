import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../../../shared/context/AuthContext";
import http from "../../../shared/services/http";
import WelcomeCard from "../../../shared/ui/WelcomeCard";
import { FaEye, FaDownload, FaTrashAlt } from "../../../shared/icons";
import IconButton from "../../../shared/ui/IconButton";
import IconGroup from "../../../shared/ui/IconGroup";
import { useObligationActions } from "../../../shared/hooks/useObligationActions";
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

export default function Dashboard() {
  const { user, isAccounting, isClient } = useAuth();
  const navigate = useNavigate();
  const { handleViewObligation, handleDownloadFiles, handleDeleteObligation } = useObligationActions();

  const [stats, setStats] = useState({
    totalObligations: 0,
    pendingObligations: 0,
    lateObligations: 0,
    paidObligations: 0,
  });
  const [obligations, setObligations] = useState([]);
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
        pendingObligations: obligations.filter((o) => o.status === "PENDING").length,
        lateObligations: obligations.filter((o) => o.status === "LATE").length,
        paidObligations: obligations.filter((o) => o.status === "PAID").length,
      });

      setObligations(obligations);
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

  // ===== Compliance (Cumprimento Geral) =====
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


      <StatsGrid>
        {/* Indicador principal: Cumprimento Geral de Obrigações (%) */}
        <StatCard color={complianceColor}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151' }}>Obrigações Cumpridas no Mês</div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Competência atual</div>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: complianceColor }}>
              {compliancePercent}%
            </div>
          </div>
        </StatCard>
        <StatCard color="#667eea">
          <StatNumber color="#667eea">{stats.totalObligations}</StatNumber>
          <StatLabel>Total de Obrigações</StatLabel>
        </StatCard>
        <StatCard color="#f59e0b">
          <StatNumber color="#f59e0b">{stats.pendingObligations}</StatNumber>
          <StatLabel>Pendentes</StatLabel>
        </StatCard>
        <StatCard color="#ef4444">
          <StatNumber color="#ef4444">{stats.lateObligations}</StatNumber>
          <StatLabel>Em Atraso</StatLabel>
        </StatCard>
        <StatCard color="#10b981">
          <StatNumber color="#10b981">{stats.paidObligations}</StatNumber>
          <StatLabel>Pagas</StatLabel>
        </StatCard>
      </StatsGrid>

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
    </DashboardContainer>
  );
}
