"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatMYR } from "@/lib/metrics";

interface PlatformBreakdownProps {
  data: { name: string; value: number; color: string }[];
}

export default function PlatformBreakdown({ data }: PlatformBreakdownProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const tooltipStyle = {
    backgroundColor: "#1A1D27",
    border: "1px solid #2A2D3A",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#F9FAFB",
  };

  return (
    <div className="flex items-center justify-center" style={{ height: 250 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, name: string) => [
              `${formatMYR(value)} (${((value / total) * 100).toFixed(1)}%)`,
              name,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#9CA3AF" }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}