import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A020F0"];

export default function TaxesPieChart({ data }) {
  const cleanData = data.map(item => ({
    ...item,
    nomeImposto: item.tipo.split(" - ")[0] 
  }));

  return (
    <div style={{ textAlign: "center" }}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={cleanData}
            dataKey="valor"
            nameKey="nomeImposto"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({valor }) => `R$${valor}`}
          >
            {cleanData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`R$ ${value}`, name]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
