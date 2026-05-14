"use client";

import Image from "next/image";
import { BODY_PARTS, toBodyPart, type BodyPart } from "@/lib/muscle-groups";
import { cn } from "@/lib/utils";

const IMAGE_SRC = "/muscle-groups-map.png";

const BODY_LABELS: Record<BodyPart, string> = {
  chest: "Brust",
  back: "Rücken",
  biceps: "Bizeps",
  triceps: "Trizeps",
  core: "Core",
  legs: "Beine",
  shoulders: "Schultern",
  other: "Sonstiges",
};

const rect = (left: number, top: number, right: number, bottom: number) =>
  `polygon(${left}% ${top}%, ${right}% ${top}%, ${right}% ${bottom}%, ${left}% ${bottom}%)`;

const legend = {
  chest: rect(41.2, 27.2, 61.5, 30.6),
  back: rect(41.2, 31.7, 61.5, 35.2),
  biceps: rect(41.2, 36.3, 61.5, 39.8),
  triceps: rect(41.2, 41.1, 61.5, 44.6),
  core: rect(41.2, 45.8, 61.5, 49.3),
  other: rect(41.2, 50.1, 61.5, 55.1),
  legs: [
    rect(41.2, 57.6, 61.5, 61.1),
  ],
  shoulders: [
    rect(41.2, 62.2, 64, 65.7),
  ],
};

const CLIP_ZONES: Record<BodyPart, string[]> = {
  chest: [
    "polygon(8.2% 29.4%, 19.8% 27.2%, 31.5% 29.4%, 34.2% 36.1%, 29.8% 41.4%, 18.5% 41.8%, 8.3% 36.5%)",
    legend.chest,
  ],
  back: [
    "polygon(61.6% 29.1%, 70.8% 23.6%, 78.3% 30.1%, 75.4% 43.4%, 68.9% 53.4%, 61.6% 43.4%)",
    "polygon(77.3% 30.1%, 84.6% 23.6%, 94.3% 29.4%, 94.2% 43.3%, 87% 53.5%, 80.2% 43.6%)",
    legend.back,
  ],
  biceps: [
    "polygon(2.9% 36.5%, 9.7% 34.1%, 14.6% 40.2%, 12.5% 52.2%, 7.6% 55.5%, 3.1% 48.7%)",
    "polygon(29.8% 40.4%, 35.4% 34.2%, 40.3% 36.5%, 39.4% 48.7%, 34.7% 55.4%, 30.5% 52.2%)",
    "polygon(58.2% 35.2%, 65.6% 33.5%, 69.6% 39.7%, 67.4% 52.8%, 61.1% 55.6%, 58% 46.1%)",
    "polygon(91% 35.2%, 97.5% 33.5%, 99.2% 46.2%, 96.1% 55.6%, 90.5% 52.8%, 88.2% 39.7%)",
    legend.biceps,
  ],
  triceps: [
    "polygon(3.2% 49.6%, 12.2% 48.6%, 13.2% 62.8%, 9.1% 70.5%, 4.3% 64%)",
    "polygon(31.8% 48.6%, 39.2% 49.6%, 38.3% 64%, 33.7% 70.5%, 30.2% 62.8%)",
    "polygon(57.7% 39.5%, 66.5% 39.5%, 67.8% 54.6%, 62.6% 63%, 57.2% 56%)",
    "polygon(90.3% 39.5%, 98.8% 39.5%, 99.4% 56%, 94.1% 63%, 89% 54.6%)",
    legend.triceps,
  ],
  core: [
    "polygon(14.7% 38.6%, 28.8% 38.6%, 31.7% 52%, 27.9% 62.2%, 18.3% 62.2%, 13.7% 52%)",
    legend.core,
  ],
  legs: [
    "polygon(6.6% 55.8%, 18.4% 55.6%, 17.1% 72.8%, 13.3% 84.5%, 6.3% 84.2%)",
    "polygon(19.3% 55.6%, 32.5% 55.8%, 34.4% 84.2%, 26% 84.5%, 20.6% 72.8%)",
    "polygon(65.5% 55.7%, 77.5% 55.8%, 76.2% 72.8%, 72.2% 84.7%, 65% 84.1%)",
    "polygon(79.1% 55.8%, 91% 55.7%, 94.3% 84.1%, 86.1% 84.7%, 80.5% 72.8%)",
    ...legend.legs,
  ],
  shoulders: [
    "polygon(4.6% 27.6%, 12.6% 25.4%, 17.7% 29.8%, 15.2% 37.4%, 6.1% 36.5%)",
    "polygon(28.4% 29.8%, 34.5% 25.4%, 39.6% 27.6%, 38.1% 36.5%, 29.6% 37.4%)",
    "polygon(58.7% 28.9%, 67.6% 25.8%, 72.7% 30.5%, 68.8% 38.7%, 60.1% 37.5%)",
    "polygon(84.1% 30.5%, 89.3% 25.8%, 98.1% 28.9%, 96.7% 37.5%, 88.1% 38.7%)",
    ...legend.shoulders,
  ],
  other: [
    "polygon(68.2% 42.4%, 86.4% 42.4%, 88.2% 54.4%, 78.1% 59.8%, 67.4% 54.4%)",
    legend.other,
  ],
};

const INTENSITY_COLORS = {
  low: "#22c55e",
  medium: "#facc15",
  high: "#ef4444",
};

function getIntensity(setCount: number) {
  if (setCount <= 0) return null;
  if (setCount <= 5) return INTENSITY_COLORS.low;
  if (setCount <= 10) return INTENSITY_COLORS.medium;
  return INTENSITY_COLORS.high;
}

interface WorkoutMuscleMapProps {
  muscleGroups: string[];
  muscleGroupSets?: Partial<Record<BodyPart, number>>;
  className?: string;
  compact?: boolean;
}

export function WorkoutMuscleMap({
  muscleGroups,
  muscleGroupSets,
  className,
  compact = false,
}: WorkoutMuscleMapProps) {
  const fallbackActive = new Set(muscleGroups.map(toBodyPart));
  const setCounts = Object.fromEntries(
    BODY_PARTS.map((part) => [
      part,
      muscleGroupSets?.[part] ?? (fallbackActive.has(part) ? 1 : 0),
    ])
  ) as Record<BodyPart, number>;
  const activeParts = BODY_PARTS.filter((part) => setCounts[part] > 0);
  const activeLabel = activeParts
    .map((part) => `${BODY_LABELS[part]}: ${setCounts[part]} Sätze`)
    .join(", ");

  return (
    <figure
      className={cn(
        "rounded-xl border border-border bg-card p-3",
        compact ? "max-w-56" : "w-full",
        className
      )}
    >
      {!compact && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Bodygraph</h3>
            <p className="text-xs text-muted-foreground">
              Sätze pro Muskelgruppe in dieser Woche
            </p>
          </div>
          <div className="hidden items-center gap-2 text-[0.68rem] text-muted-foreground sm:flex">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
              niedrig
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#facc15]" />
              mittel
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
              hoch
            </span>
          </div>
        </div>
      )}
      <div
        className={cn(
          "relative mx-auto aspect-[2/3] w-full overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800",
          compact ? "max-w-16" : "max-w-[min(420px,82vw)]"
        )}
        role="img"
        aria-label={
          activeLabel
            ? `Trainierte Muskelgruppen nach Wochen-Sätzen: ${activeLabel}`
            : "Muskelgruppenmodell ohne aktive Markierung"
        }
      >
        <Image
          src={IMAGE_SRC}
          alt=""
          fill
          sizes={compact ? "224px" : "(max-width: 768px) 100vw, 420px"}
          aria-hidden="true"
          className="object-cover"
        />
        {BODY_PARTS.flatMap((part) => {
          const color = getIntensity(setCounts[part]);

          if (!color) return [];

          return CLIP_ZONES[part].map((clipPath, index) => (
            <div
              key={`${part}-${index}`}
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                backgroundColor: color,
                clipPath,
                mixBlendMode: "color",
                opacity: 0.92,
              }}
            />
          ));
        })}
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10" />
      </div>
      {!compact && (
        <figcaption className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
          {BODY_PARTS.map((part) => {
            const setCount = setCounts[part];
            const color = getIntensity(setCount);

            return (
              <span
                key={part}
                className="inline-flex min-w-0 items-center justify-between gap-1.5 rounded-lg border border-border bg-muted px-2 py-1.5"
              >
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full border border-foreground/20"
                    style={{ backgroundColor: color ?? "hsl(var(--muted-foreground) / 0.35)" }}
                  />
                  <span className="truncate">{BODY_LABELS[part]}</span>
                </span>
                <span className="font-medium text-foreground">{setCount}</span>
              </span>
            );
          })}
        </figcaption>
      )}
    </figure>
  );
}
