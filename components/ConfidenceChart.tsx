"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

type ChartDataPoint = {
  timeRaw: number;
  timeLabel: string;
  score: number;
};

export default function ConfidenceChart({ chartData }: { chartData?: ChartDataPoint[] }) {
  if (!chartData || chartData.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-brand-muted bg-brand-light/30 p-8 text-center text-gray-500 font-medium">
        Confidence timeline data is not available for this session.
      </div>
    );
  }

  // Determine a simple color based on overall average or just use the brand color
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="timeLabel" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#6B7280", fontSize: 12 }} 
            dy={10}
            minTickGap={30}
          />
          <YAxis 
            domain={[0, 100]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#6B7280", fontSize: 12 }} 
          />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}
            formatter={(value: any) => [`${value}%`, "Confidence"]}
            labelStyle={{ fontWeight: "bold", color: "#111827", marginBottom: "4px" }}
          />
          <ReferenceLine y={50} stroke="#9CA3AF" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#10B981" // Green
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
