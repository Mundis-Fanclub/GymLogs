"use client";

import Image from "next/image";
import {
  BODY_PARTS,
  DISPLAY_BODY_PARTS,
  getWeeklySetVolumeColor,
  legsAggregatedSetCount,
  toBodyPart,
  toDisplayBodyPart,
  type BodyPart,
} from "@/lib/muscle-groups";
import { cn } from "@/lib/utils";

const IMAGE_SRC = "/bodygraph-muscle-map-transparent.png";

const BODY_LABELS: Record<BodyPart, string> = {
  chest: "Brust",
  back: "Rücken",
  biceps: "Bizeps",
  triceps: "Trizeps",
  core: "Core",
  legs: "Beine",
  quads: "Quads",
  hamstrings: "Beinbeuger",
  calves: "Waden",
  glutes: "Gesäß",
  shoulders: "Schultern",
  other: "Sonstiges",
};

const BODY_PART_MASKS: Record<BodyPart, string> = {
  chest: "/bodygraph-masks/chest.png",
  back: "/bodygraph-masks/back.png",
  biceps: "/bodygraph-masks/biceps.png",
  triceps: "/bodygraph-masks/triceps.png",
  core: "/bodygraph-masks/core.png",
  legs: "/bodygraph-masks/legs.png",
  quads: "/bodygraph-masks/quads.png",
  hamstrings: "/bodygraph-masks/hamstrings.png",
  calves: "/bodygraph-masks/calves.png",
  glutes: "/bodygraph-masks/glutes.png",
  shoulders: "/bodygraph-masks/shoulders.png",
  other: "/bodygraph-masks/other.png",
};

interface MaskOverlayProps {
  part: BodyPart;
  setCounts: Record<BodyPart, number>;
  displayGroupActive: boolean;
}

function MaskOverlay({ part, setCounts, displayGroupActive }: MaskOverlayProps) {
  const setCount = setCounts[part];
  if (setCount <= 0) return null;
  if (!displayGroupActive) return null;

  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 bg-current"
      style={{
        color: getWeeklySetVolumeColor(setCount),
        maskImage: `url(${BODY_PART_MASKS[part]})`,
        WebkitMaskImage: `url(${BODY_PART_MASKS[part]})`,
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}

interface WorkoutMuscleMapProps {
  muscleGroups: string[];
  muscleGroupSets?: Partial<Record<BodyPart, number>>;
  /**
   * Optional per-display-group counts shown in the caption chips.
   * Lets callers decouple "what the chip text shows" (e.g. primary
   * muscle-group statistic) from "what the mask paints" (multi-zone
   * coloring). When omitted, falls back to the mask counts.
   */
  captionSetCounts?: Partial<Record<BodyPart, number>>;
  className?: string;
  compact?: boolean;
  hideHeader?: boolean;
}

export function WorkoutMuscleMap({
  muscleGroups,
  muscleGroupSets,
  captionSetCounts,
  className,
  compact = false,
  hideHeader = false,
}: WorkoutMuscleMapProps) {
  const fallbackActive = new Set(muscleGroups.map(toBodyPart));
  const setCounts = Object.fromEntries(
    BODY_PARTS.map((part) => [
      part,
      muscleGroupSets?.[part] ?? (fallbackActive.has(part) ? 1 : 0),
    ])
  ) as Record<BodyPart, number>;
  const captionSetCount = (part: (typeof DISPLAY_BODY_PARTS)[number]) => {
    if (captionSetCounts) return captionSetCounts[part] ?? 0;
    return part === "legs" ? legsAggregatedSetCount(setCounts) : setCounts[part];
  };
  const activeParts = DISPLAY_BODY_PARTS.filter(
    (part) => captionSetCount(part) > 0
  );
  const activeLabel = activeParts
    .map((part) => `${BODY_LABELS[part]}: ${captionSetCount(part)} Sätze`)
    .join(", ");

  return (
    <figure
      className={cn(
        "rounded-3xl border border-border bg-card p-3 shadow-sm",
        compact ? "max-w-28" : "w-full",
        className
      )}
    >
      {!compact && !hideHeader && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold">Körperdiagramm</h3>
          <p className="text-xs text-muted-foreground">
            Sätze pro Muskelgruppe in dieser Woche
          </p>
        </div>
      )}
      <div
        className={cn(
          "relative mx-auto aspect-[1448/1086] overflow-hidden rounded-[1.65rem] border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950",
          compact ? "max-w-24" : "max-w-[440px]"
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
          sizes={compact ? "112px" : "(max-width: 430px) 92vw, 440px"}
          className="object-contain"
          priority={false}
        />
        {BODY_PARTS.map((part) => (
          <MaskOverlay
            key={part}
            part={part}
            setCounts={setCounts}
            displayGroupActive={captionSetCount(toDisplayBodyPart(part)) > 0}
          />
        ))}
      </div>
      {!compact && (
        <figcaption className="mt-3 flex flex-wrap gap-1.5 text-xs">
          {DISPLAY_BODY_PARTS.filter((part) => part !== "other").map((part) => {
            const setCount = captionSetCount(part);
            const isInactive = setCount === 0;
            const color = getWeeklySetVolumeColor(setCount);

            return (
              <span
                key={part}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5",
                  isInactive
                    ? "border-border/40 bg-transparent text-muted-foreground/70"
                    : "bg-background/90 font-medium shadow-sm"
                )}
                style={
                  isInactive
                    ? undefined
                    : { color, borderColor: `${color}66` }
                }
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: isInactive ? "currentColor" : color }}
                />
                <span>{BODY_LABELS[part]}</span>
                <span className="font-semibold tabular-nums">{setCount}</span>
              </span>
            );
          })}
        </figcaption>
      )}
    </figure>
  );
}
