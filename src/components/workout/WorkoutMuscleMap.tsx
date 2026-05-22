"use client";

import Image from "next/image";
import {
  BODY_PARTS,
  DISPLAY_BODY_PARTS,
  getWeeklySetVolumeColor,
  legsAggregatedSetCount,
  toBodyPart,
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
  glutes: "Glutes",
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
}

function MaskOverlay({ part, setCounts }: MaskOverlayProps) {
  const setCount = setCounts[part];
  if (setCount <= 0) return null;

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
  const captionSetCount = (part: (typeof DISPLAY_BODY_PARTS)[number]) =>
    part === "legs" ? legsAggregatedSetCount(setCounts) : setCounts[part];
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
      {!compact && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold">Bodygraph</h3>
          <p className="text-xs text-muted-foreground">
            Sätze pro Muskelgruppe in dieser Woche
          </p>
        </div>
      )}
      <div
        className={cn(
          "relative mx-auto aspect-[1448/1086] overflow-hidden rounded-[1.65rem] border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950",
          compact ? "max-w-24" : "max-w-[380px]"
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
          sizes={compact ? "112px" : "(max-width: 430px) 92vw, 380px"}
          className="object-contain"
          priority={false}
        />
        {BODY_PARTS.map((part) => (
          <MaskOverlay key={part} part={part} setCounts={setCounts} />
        ))}
      </div>
      {!compact && (
        <figcaption className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {DISPLAY_BODY_PARTS.filter((part) => part !== "other").map((part) => {
            const setCount = captionSetCount(part);
            const color = getWeeklySetVolumeColor(setCount);

            return (
              <span
                key={part}
                className="inline-flex min-w-0 items-center justify-between gap-2 rounded-xl border border-border bg-background/70 px-2.5 py-2"
                style={{ color }}
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full border border-foreground/20"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate">{BODY_LABELS[part]}</span>
                </span>
                <span className="font-semibold">{setCount}</span>
              </span>
            );
          })}
        </figcaption>
      )}
    </figure>
  );
}
