"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import {
  BODY_PARTS,
  BODY_PART_COLORS,
  toBodyPart,
  type BodyPart,
} from "@/lib/muscle-groups";

interface WeekData {
  weekStart: number;
  volumes: Record<string, number | { sets: number; volume: number }>;
}

interface VolumeBarChartProps {
  data: WeekData[];
}

export function VolumeBarChart({ data }: VolumeBarChartProps) {
  const { t } = useAppPreferences();
  const totals = data.reduce(
    (acc, week) => {
      for (const [group, rawValue] of Object.entries(week.volumes)) {
        const part = toBodyPart(group);
        const value =
          typeof rawValue === "number"
            ? { sets: rawValue > 0 ? 1 : 0, volume: rawValue }
            : rawValue;
        acc[part].sets += value.sets;
        acc[part].volume += value.volume;
      }
      return acc;
    },
    Object.fromEntries(
      BODY_PARTS.map((part) => [part, { sets: 0, volume: 0 }])
    ) as Record<
      BodyPart,
      { sets: number; volume: number }
    >
  );

  const formatted = BODY_PARTS.map((part) => ({
    key: part,
    label: t(`muscleGroups.${part}`),
    sets: totals[part].sets,
    volume: totals[part].volume,
    fill: BODY_PART_COLORS[part],
  }));

  return (
    <div
      className="h-[320px] w-full"
      role="img"
      aria-label={t("analytics.weeklyVolume")}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} margin={{ top: 24, right: 12, left: 8, bottom: 18 }}>
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
            width={48}
            allowDecimals={false}
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
            formatter={(value, _name, item) => [
              `${Number(value).toLocaleString()} ${t("common.sets")} · ${Math.round(Number(item.payload.volume)).toLocaleString()} ${t("common.kg")}`,
              t("analytics.weeklySets"),
            ]}
            labelFormatter={(label) => label}
          />
          <Bar dataKey="sets" radius={[6, 6, 0, 0]} maxBarSize={72}>
            {formatted.map((entry) => (
              <Cell key={entry.key} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="sets"
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
