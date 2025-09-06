'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { RiskSplit } from '@/lib/types';

interface RiskDistributionChartProps {
  riskSplit: RiskSplit;
}

const COLORS = {
  high: '#DC2626',
  medium: '#F59E0B',
  low: '#16A34A',
};

export function RiskDistributionChart({ riskSplit }: RiskDistributionChartProps) {
  const data = [
    { name: 'High Risk', value: riskSplit.high, color: COLORS.high },
    { name: 'Medium Risk', value: riskSplit.medium, color: COLORS.medium },
    { name: 'Low Risk', value: riskSplit.low, color: COLORS.low },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}