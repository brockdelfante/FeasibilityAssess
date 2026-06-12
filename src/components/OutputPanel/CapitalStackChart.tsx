"use client";

import { CalculationResults, DealInputs } from "@/lib/calculations";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CapitalStackChartProps {
  inputs: DealInputs;
  results: CalculationResults;
}

export function CapitalStackChart({ inputs, results }: CapitalStackChartProps) {
  const data = [
    { name: "Senior Debt", value: results.seniorFunding },
    { name: "Mezzanine", value: inputs.mezzEnabled ? inputs.mezzAmount : 0 },
    { name: "Equity", value: inputs.customerCashEquity },
  ].filter(d => d.value > 0);

  const COLORS = ["#1A4F8A", "#D97706", "#15803D"];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', notation: 'compact' }).format(val);

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
