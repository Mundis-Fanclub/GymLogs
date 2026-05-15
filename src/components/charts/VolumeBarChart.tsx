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
  getWeeklySetVolumeColor,
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

interface FormattedVolumeDatum {
  key: BodyPart;
  label: string;
  sets: number;
  volume: number;
  fill: string;
}

interface ChartTextProps {
  x?: number;
  y?: number;
  payload?: {
    value?: string;
  };
}

interface ChartLabelProps {
  x?: number;
  y?: number;
  width?: number;
  value?: number | string;
  payload?: FormattedVolumeDatum;
}

function VolumeYAxisTick({
  x = 0,
  y = 0,
  payload,
  data,
}: ChartTextProps & { data: FormattedVolumeDatum[] }) {
  const label = String(payload?.value ?? "");
  const datum = data.find((entry) => entry.label === label);

  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill={datum?.fill ?? "var(--muted-foreground)"}
      fontSize={11}
    >
      {label}
    </text>
  );
}

function VolumeValueLabel({
  x = 0,
  y = 0,
  width = 0,
  value,
  payload,
}: ChartLabelProps) {
  const numericValue = Number(value ?? 0);

  return (
    <text
      x={x + width + 8}
      y={y}
      dy={15}
      fill={payload?.fill ?? "var(--foreground)"}
      fontSize={12}
      fontWeight={600}
    >
      {numericValue > 0 ? numericValue : "0"}
    </text>
  );
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
    fill: getWeeklySetVolumeColor(totals[part].sets),
  }));

  return (
    <div
      className="h-[340px] w-full"
      role="img"
      aria-label={t("analytics.weeklyVolume")}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formatted}
          layout="vertical"
          margin={{ top: 8, right: 36, left: 4, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="color-mix(in oklch, var(--border) 55%, transparent)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "color-mix(in oklch, var(--foreground) 72%, transparent)" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            dataKey="label"
            type="category"
            tick={<VolumeYAxisTick data={formatted} />}
            axisLine={false}
            tickLine={false}
            width={76}
          />
          <Tooltip
            cursor={{ fill: "color-mix(in oklch, var(--foreground) 6%, transparent)" }}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--foreground)",
              fontSize: "12px",
            }}
            formatter={(value, _name, item) => [
              `${Number(value).toLocaleString()} ${t("common.sets")} · ${Math.round(Number(item.payload.volume)).toLocaleString()} ${t("common.kg")}`,
              t("analytics.weeklySets"),
            ]}
            labelFormatter={(label) => label}
          />
          <Bar dataKey="sets" radius={[0, 8, 8, 0]} maxBarSize={22}>
            {formatted.map((entry) => (
              <Cell key={entry.key} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="sets"
              position="right"
              content={<VolumeValueLabel />}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
