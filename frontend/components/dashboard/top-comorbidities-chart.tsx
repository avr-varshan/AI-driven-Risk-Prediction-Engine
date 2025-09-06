'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TopComorbiditiesChartProps {
  comorbidities: string[];
}

export function TopComorbiditiesChart({ comorbidities }: TopComorbiditiesChartProps) {
  // Transform the array into chart data with mock frequencies
  const data = comorbidities.slice(0, 8).map((condition, index) => ({
    name: condition,
    count: Math.floor(Math.random() * 50) + 10, // Mock data - replace with real counts
    percentage: ((8 - index) / 8 * 100).toFixed(1),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="horizontal"
        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis 
          dataKey="name" 
          type="category" 
          width={80}
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          formatter={(value: number) => [`${value} patients`, 'Count']}
          labelFormatter={(label: string) => `${label}`}
        />
        <Bar dataKey="count" fill="#6366F1" />
      </BarChart>
    </ResponsiveContainer>
  );
}