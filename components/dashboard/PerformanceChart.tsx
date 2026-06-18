"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
  Bar,
} from "recharts";
import { formatMYR, formatNumber, formatDateDMY } from "@/lib/metrics";

interface PerformanceChartProps {
  // Accept any array of objects with string keys
  data: Array<Record<string, string | number>>;
  type?: "spend" | "ctr-roas" | "conversions" | "custom";
  height?: number;
}

export default function PerformanceChart({
  data,
  type = "spend",
  height = 300,
}: PerformanceChartProps) {
  const tooltipStyle = {
    backgroundColor: "#1A1D27",
    border: "1px solid #2A2D3A",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#F9FAFB",
  };

  const gridStroke = "#2A2D3A";

  if (type === "spend") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis
            dataKey="report_date"
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            tickFormatter={(v: string) => formatDateDMY(v).slice(0, 5)}
            axisLine={{ stroke: gridStroke }}
          />
          <YAxis
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            tickFormatter={(v: number) => `RM${(v / 1000).toFixed(0)}k`}
            axisLine={{ stroke: gridStroke }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, name: string) => [formatMYR(value), name]}
            labelFormatter={(label: string) => formatDateDMY(label)}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#9CA3AF" }}
            iconType="circle"
          />
          <defs>
            <linearGradient id="metaSpendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1877F2" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="googleSpendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EA4335" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EA4335" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="meta_spend"
            name="Meta Spend"
            stroke="#1877F2"
            strokeWidth={2}
            fill="url(#metaSpendGrad)"
          />
          <Area
            type="monotone"
            dataKey="google_spend"
            name="Google Spend"
            stroke="#EA4335"
            strokeWidth={2}
            fill="url(#googleSpendGrad)"
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  if (type === "ctr-roas") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis
            dataKey="report_date"
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            tickFormatter={(v: string) => formatDateDMY(v).slice(0, 5)}
            axisLine={{ stroke: gridStroke }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            tickFormatter={(v: number) => `${v}%`}
            axisLine={{ stroke: gridStroke }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            tickFormatter={(v: number) => `${v}×`}
            axisLine={{ stroke: gridStroke }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, name: string) => [
              name.includes("CTR") ? `${value.toFixed(2)}%` : `${value.toFixed(2)}×`,
              name,
            ]}
            labelFormatter={(label: string) => formatDateDMY(label)}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#9CA3AF" }}
            iconType="circle"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="avg_ctr"
            name="Avg CTR (%)"
            stroke="#6366F1"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="avg_roas"
            name="Avg ROAS (×)"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === "conversions") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis
            dataKey="report_date"
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            tickFormatter={(v: string) => formatDateDMY(v).slice(0, 5)}
            axisLine={{ stroke: gridStroke }}
          />
          <YAxis
            tick={{ fill: "#9CA3AF", fontSize: 11 }}
            axisLine={{ stroke: gridStroke }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, name: string) => [formatNumber(value), name]}
            labelFormatter={(label: string) => formatDateDMY(label)}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#9CA3AF" }}
            iconType="circle"
          />
          <Bar
            type="monotone"
            dataKey="meta_conversions"
            name="Meta Conv."
            fill="#1877F2"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            type="monotone"
            dataKey="google_conversions"
            name="Google Conv."
            fill="#EA4335"
            radius={[4, 4, 0, 0]}
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  // custom: single-line daily chart for campaign detail
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis
          dataKey="report_date"
          tick={{ fill: "#9CA3AF", fontSize: 11 }}
          tickFormatter={(v: string) => formatDateDMY(v).slice(0, 5)}
          axisLine={{ stroke: gridStroke }}
        />
        <YAxis
          tick={{ fill: "#9CA3AF", fontSize: 11 }}
          axisLine={{ stroke: gridStroke }}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(label: string) => formatDateDMY(label)}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px", color: "#9CA3AF" }}
          iconType="circle"
        />
        {Object.keys(data[0] || {})
          .filter((k) => k !== "report_date")
          .map((key, i) => {
            const colors = ["#6366F1", "#10B981", "#F59E0B", "#EA4335"];
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key.replace(/_/g, " ")}
                stroke={colors[i % colors.length]}
                strokeWidth={2}
                dot={false}
              />
            );
          })}
      </LineChart>
    </ResponsiveContainer>
  );
}