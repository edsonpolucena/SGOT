import { useEffect, useState } from "react";
import styled from "styled-components";
import { useAuth } from "../../../shared/context/AuthContext";
import http from "../../../shared/services/http";
import WelcomeCard from "../../../shared/ui/WelcomeCard"; 
import { FaEye, FaDownload, FaTrashAlt } from "../../../shared/icons";
import IconButton from "../../../shared/ui/IconButton";
import IconGroup from "../../../shared/ui/IconGroup";
import { useMonthlySummary } from "../../analytics/hooks/useAnalyticsData.js";
import TaxesPieChart from "../../analytics/components/charts/TaxesPieChart";
import { useMonthlyVariationByTax } from "../../analytics/hooks/useAnalyticsData";
import VariationByTaxChart from "../../analytics/components/charts/VariationByTaxChart";

import {
  Wrapper,
  Header,
  CompanyInfo,
  LogoutBtn,
  Dashboard,
  Card,
  Calendar,
} from '../styles/ClientDashboard.styles.js';

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${(props) => props.color || "#667eea"};
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${(props) => props.color || "#333"};
  margin-bottom: 10px;
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
`;

const Th = styled.th`
  padding: 12px;
  text-align: left;
  background: #f9fafb;
  cursor: pointer;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #eee;
`;

const Pagination = styled.div`
  margin-top: 15px;
  display: flex;
  justify-content: center;
  gap: 10px;

  button {
    padding: 6px 12px;
    border: 1px solid #ccc;
    background: white;
    cursor: pointer;
    border-radius: 6px;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function ClientDashboard() {
  const { user } = useAuth();
  const empresaId = user?.company?.id;
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError } =
  useMonthlySummary(user?.company?.id, "2025-09");
  const { data: variationByTaxData, loading: variationByTaxLoading, error: variationByTaxError } =
  useMonthlyVariationByTax(user?.company?.id, "2025-09");
  const [obligations, setObligations] = useState([]);

  const stats = {
  totalObligations: obligations.length,
  pendingObligations: obligations.filter(o => o.status === "PENDING").length,
  lateObligations: obligations.filter(o => o.status === "LATE").length,
  paidObligations: obligations.filter(o => o.status === "PAID").length,
};
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    loadObligations();
  }, []);

  const loadObligations = async () => {
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
        };
      });

      setObligations(obligations);
    } catch (err) {
      console.error("Erro ao carregar obrigações:", err);
    } finally {
      setLoading(false);
    }
  };

  // Função para visualizar obrigação
  const handleViewObligation = async (obligationId) => {
    try {
      // Buscar arquivos da obrigação
      const filesResponse = await http.get(`/api/obligations/${obligationId}/files`);
      const files = filesResponse.data;
      
      if (files.length === 0) {
        alert('Esta obrigação não possui arquivos anexados.');
        return;
      }
      
      // Se há apenas um arquivo, abrir diretamente
      if (files.length === 1) {
        const viewResponse = await http.get(`/api/obligations/files/${files[0].id}/view`);
        window.open(viewResponse.data.viewUrl, '_blank');
        return;
      }
      
      // Se há múltiplos arquivos, mostrar lista simples
      const fileNames = files.map((file, index) => `${index + 1}. ${file.originalName}`).join('\n');
      const choice = prompt(`Múltiplos arquivos encontrados:\n\n${fileNames}\n\nDigite o número do arquivo (1-${files.length}):`);
      
      const fileIndex = parseInt(choice) - 1;
      if (fileIndex >= 0 && fileIndex < files.length) {
        const selectedFile = files[fileIndex];
        const viewResponse = await http.get(`/api/obligations/files/${selectedFile.id}/view`);
        window.open(viewResponse.data.viewUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao visualizar arquivo:', error);
      alert('Erro ao visualizar arquivo. Tente novamente.');
    }
  };

  // Função para download de arquivos
  const handleDownloadFiles = async (obligationId) => {
    try {
      // Buscar arquivos da obrigação
      const filesResponse = await http.get(`/api/obligations/${obligationId}/files`);
      const files = filesResponse.data;
      
      if (files.length === 0) {
        alert('Esta obrigação não possui arquivos anexados.');
        return;
      }
      
      // Baixar todos os arquivos sequencialmente
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const downloadResponse = await http.get(`/api/obligations/files/${file.id}/download`);
          
          // Criar link temporário para download direto
          const link = document.createElement('a');
          link.href = downloadResponse.data.downloadUrl;
          link.download = file.originalName;
          link.style.display = 'none';
          
          // Adicionar ao DOM, clicar e remover
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Pequena pausa entre downloads para evitar conflitos
          if (i < files.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (fileError) {
          console.error(`Erro ao baixar arquivo ${file.originalName}:`, fileError);
        }
      }
      
      if (files.length > 1) {
        alert(`${files.length} arquivos iniciaram o download.`);
      }
    } catch (error) {
      console.error('Erro ao baixar arquivos:', error);
      alert('Erro ao baixar arquivos. Tente novamente.');
    }
  };

  // Função para excluir obrigação
  const handleDeleteObligation = async (obligationId) => {
    if (!confirm('Tem certeza que deseja excluir esta obrigação? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      // Primeiro, excluir todos os arquivos da obrigação
      const filesResponse = await http.get(`/api/obligations/${obligationId}/files`);
      const files = filesResponse.data;
      
      for (const file of files) {
        try {
          await http.delete(`/api/obligations/files/${file.id}`);
        } catch (fileError) {
          console.error(`Erro ao excluir arquivo ${file.originalName}:`, fileError);
        }
      }
      
      // Depois, excluir a obrigação
      await http.delete(`/api/obligations/${obligationId}`);
      
      // Recarregar dados
      await loadObligations();
      
      alert('Obrigação excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir obrigação:', error);
      alert('Erro ao excluir obrigação. Tente novamente.');
    }
  };

  const handleSort = (col) => {
    const order = sortColumn === col && sortOrder === "asc" ? "desc" : "asc";
    setSortColumn(col);
    setSortOrder(order);
  };

  const filteredObligations = [...obligations]
    .filter((o) =>
      o.docType?.toLowerCase().includes(search.toLowerCase()) ||
      o.competence?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortColumn) return 0;
      let aVal = a[sortColumn], bVal = b[sortColumn];
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredObligations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredObligations.length / itemsPerPage);

  return (
    <>
      <WelcomeCard
        variant="client"
        title={`Bem-vindo(a), ${user?.name}`}
        subtitle="Acompanhe suas obrigações tributárias"
        info={[
          `Email: ${user?.email}`,
          `Empresa: ${user?.company?.nome}`,
          `CNPJ: ${user?.company?.cnpj}`,
          `Código: ${user?.company?.codigo}`,
        ]}
      />

      <Wrapper>


      <StatsGrid>
   
    <StatCard color="#3b82f6" style={{ gridColumn: "span 2" }}>
  <h4 style={{ marginBottom: "10px", color: "#3b82f6" }}>
    Comparativo de Valores de Impostos – Mês Atual vs. Mês Anterior (R$)
  </h4>
  {variationByTaxLoading && <p>Carregando...</p>}
  {variationByTaxError && <p>Erro ao carregar dados</p>}
{variationByTaxData && (
  <VariationByTaxChart data={variationByTaxData.impostos || []} />
)}
</StatCard>

        <StatCard color="#3b82f6" style={{ gridColumn: "span 2" }}>
          <h4 style={{ marginBottom: "10px", color: "#3b82f6" }}>
            Distribuição dos Impostos por Tipo (em R$)
          </h4>
          {analyticsData && (
            <p style={{ marginBottom: "15px", fontWeight: "bold", color: "#374151" }}>
              Total arrecadado no mês:{" "}
              R$ {analyticsData.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          )}
          {analyticsLoading ? (<p>Carregando...</p>)
           : analyticsData ? ( <TaxesPieChart data={analyticsData.impostos} /> 
           ) : analyticsError ? ( <p>Erro ao carregar dados</p>) : null
           }
         
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

        {loading ? (
          <p>Carregando...</p>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th onClick={() => handleSort("createdAt")}>Data Upload</Th>
                  <Th onClick={() => handleSort("docType")}>Tipo</Th>
                  <Th onClick={() => handleSort("competence")}>Competência</Th>
                  <Th onClick={() => handleSort("dueDate")}>Vencimento</Th>
                  <Th onClick={() => handleSort("amount")}>Valor</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <Td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                      Nenhuma obrigação encontrada
                    </Td>
                  </tr>
                ) : (
                  currentItems.map((o) => (
                    <tr key={o.id}>
                      <Td>{new Date(o.createdAt).toLocaleDateString("pt-BR")}</Td>
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
              <span>Página {currentPage} de {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                Próxima
              </button>
            </Pagination>
          </>
        )}
      </Wrapper>
    </>
  );
}
