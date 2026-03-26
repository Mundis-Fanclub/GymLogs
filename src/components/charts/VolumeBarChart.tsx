"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { MUSCLE_GROUP_COLORS, MUSCLE_GROUP_LABELS, type MuscleGroup } from "@/lib/constants";

interface WeekData {
  weekStart: number;
  volumes: Record<string, number>;
}

interface VolumeBarChartProps {
  data: WeekData[];
}

export function VolumeBarChart({ data }: VolumeBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
        No data yet
      </div>
    );
  }

  const muscleGroups = [
    ...new Set(data.flatMap((d) => Object.keys(d.volumes))),
  ] as MuscleGroup[];

  const formatted = data.map((d) => ({
    label: format(d.weekStart, "MMM d"),
    ...d.volumes,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            fontSize: "12px",
          }}
        />
        {muscleGroups.map((mg) => (
          <Bar
            key={mg}
            dataKey={mg}
            stackId="volume"
            fill={MUSCLE_GROUP_COLORS[mg] ?? "#64748b"}
            name={MUSCLE_GROUP_LABELS[mg] ?? mg}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
