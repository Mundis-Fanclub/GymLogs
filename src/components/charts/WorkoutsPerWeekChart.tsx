"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";

export type FrequencyPeriod = "week" | "month" | "year";

interface FrequencyBucket {
  bucketStart: number;
  count: number;
}

interface WorkoutsPerWeekChartProps {
  data: {
    total: number;
    buckets: FrequencyBucket[];
  };
  period: FrequencyPeriod;
}

function labelForBucket(
  bucketStart: number,
  period: FrequencyPeriod,
  locale: "de" | "en"
) {
  const dateLocale = locale === "de" ? de : enUS;
  if (period === "week") return format(bucketStart, "EEE", { locale: dateLocale });
  if (period === "month") return format(bucketStart, "'KW' w", { locale: dateLocale });
  return format(bucketStart, "MMM", { locale: dateLocale });
}

export function WorkoutsPerWeekChart({
  data,
  period,
}: WorkoutsPerWeekChartProps) {
  const { locale, t } = useAppPreferences();

  const formatted = data.buckets.map((bucket) => ({
    label: labelForBucket(bucket.bucketStart, period, locale),
    workouts: bucket.count,
  }));

  return (
    <div
      className="h-[280px] w-full"
      role="img"
      aria-label={t("analytics.workoutFrequency")}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} margin={{ top: 24, right: 12, left: 8, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            interval={0}
            tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={36}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--foreground) / 0.06)" }}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
              fontSize: "12px",
            }}
            formatter={(value) => [value, t("analytics.workouts")]}
          />
          <Bar dataKey="workouts" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={72}>
            <LabelList
              dataKey="workouts"
              position="top"
              fill="hsl(var(--foreground))"
              fontSize={12}
              formatter={(value) => {
                const numericValue = Number(value ?? 0);
                return numericValue > 0 ? numericValue : "0";
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
