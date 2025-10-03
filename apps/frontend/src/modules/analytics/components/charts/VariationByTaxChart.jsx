import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";

export default function TaxesComparisonChart({ data, mesAnterior, mesAtual }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="imposto" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="valorAnterior" name={`Mês Anterior`} fill="#60a5fa" />
        <Bar dataKey="valorAtual" name={`Mês Atual`} fill="#1d4ed8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
