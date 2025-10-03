import { useMonthlySummary } from "../hooks/useAnalyticsData";
import TaxesPieChart from "../components/charts/TaxesPieChart";

export default function AnalyticsDashboard({ empresaId }) {
  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data, loading, error } = useMonthlySummary(empresaId, mesAtual);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>Erro ao carregar dados</p>;

  return (
    <div>
      <h2>📊 Analytics - Impostos</h2>
      <p>
        Total do mês ({mesAtual}): R$ {data.total.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}
      </p>
      <TaxesPieChart data={data.impostos} />
    </div>
  );
}

