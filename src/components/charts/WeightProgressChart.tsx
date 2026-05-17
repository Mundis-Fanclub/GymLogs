"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface DataPoint {
  date: number;
  weight: number;
  e1rm: number;
}

interface WeightProgressChartProps {
  data: DataPoint[];
}

export function WeightProgressChart({ data }: WeightProgressChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(d.date, "MMM d"),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "color-mix(in oklch, var(--foreground) 76%, transparent)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "color-mix(in oklch, var(--foreground) 76%, transparent)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "var(--foreground)" }}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--primary)" }}
          name="Weight (kg)"
        />
        <Line
          type="monotone"
          dataKey="e1rm"
          stroke="var(--muted-foreground)"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          dot={false}
          name="Est. 1RM"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
