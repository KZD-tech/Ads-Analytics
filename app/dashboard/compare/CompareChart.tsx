"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface CompareChartProps {
  data: { metric: string; Meta: number; Google: number }[];
}

export default function CompareChart({ data }: CompareChartProps) {
  const tooltipStyle = {
    backgroundColor: "#1A1D27",
    border: "1px solid #2A2D3A",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#F9FAFB",
  };

  return (
    <div style={{ height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
          <XAxis
            dataKey="metric"
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            axisLine={{ stroke: "#2A2D3A" }}
          />
          <YAxis
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            axisLine={{ stroke: "#2A2D3A" }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#9CA3AF" }}
            iconType="circle"
          />
          <Bar dataKey="Meta" fill="#1877F2" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Google" fill="#EA4335" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}