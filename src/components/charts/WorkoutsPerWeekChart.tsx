"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";

interface WeekData {
  weekStart: number;
  count: number;
}

interface WorkoutsPerWeekChartProps {
  data: WeekData[];
}

export function WorkoutsPerWeekChart({ data }: WorkoutsPerWeekChartProps) {
  const { locale, t } = useAppPreferences();
  if (data.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
        {t("common.noData")}
      </div>
    );
  }

  const formatted = data.map((d) => ({
    label: format(d.weekStart, "MMM d", {
      locale: locale === "de" ? de : enUS,
    }),
    workouts: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
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
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="workouts" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
