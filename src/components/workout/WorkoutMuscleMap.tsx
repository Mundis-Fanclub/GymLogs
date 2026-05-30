"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
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
  quads: "Vorderer Oberschenkel",
  hamstrings: "Hinterer Oberschenkel",
  calves: "Waden",
  glutes: "Gesäß",
  shoulders: "Schultern",
  other: "Sonstiges",
};

const CHIP_LABELS: Record<BodyPart, string> = {
  ...BODY_LABELS,
  quads: "Quads",
  hamstrings: "Beinbeuger",
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

// Specific sub-zones win over base zones when multiple masks overlap at a click position.
const CLICK_PRIORITY: BodyPart[] = [
  "quads",
  "hamstrings",
  "calves",
  "glutes",
  "chest",
  "back",
  "biceps",
  "triceps",
  "shoulders",
  "core",
  "legs",
  "other",
];

const PIXEL_W = 256;
const PIXEL_H = 192;

const EXERCISE_DE_NAMES: Record<string, string> = {
  "Leg Extension": "Beinstrecker",
  "Leg Curl": "Beinbeuger",
  "Nordic Curl": "Nordic Curl",
  "Standing Calf Raise": "Wadenheben",
  "Seated Calf Raise": "Wadenheben (sitzend)",
  "Donkey Calf Raise": "Wadenheben (Donkey)",
  "Leg Press": "Beinpresse",
};

function localizeExercise(name: string): string {
  return EXERCISE_DE_NAMES[name] ?? name;
}

function zoneStatus(total: number): {
  label: string;
  className: string;
} {
  if (total === 0)
    return {
      label: "nicht trainiert",
      className: "text-muted-foreground",
    };
  if (total < 6) return { label: "unter Ziel", className: "text-info" };
  if (total > 14 * 1.5)
    return { label: "stark über Ziel", className: "text-danger" };
  if (total > 14) return { label: "über Ziel", className: "text-warning" };
  return { label: "im Ziel", className: "text-success" };
}

type ZoneExercise = { name: string; sets: number };

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
      className="pointer-events-none absolute inset-0 bg-current"
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

/**
 * Pre-loads each mask PNG into an offscreen canvas and exposes a sampler
 * that returns the BodyParts whose mask is opaque at a given (rel-x, rel-y)
 * in the [0,1] range. Used for pixel-accurate click detection because the
 * CSS mask-image render does not block pointer events outside the painted
 * region.
 */
function useMaskAlphaSampler() {
  const [alphaMaps, setAlphaMaps] = useState<Map<BodyPart, Uint8ClampedArray>>(
    new Map()
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const next = new Map<BodyPart, Uint8ClampedArray>();

    Promise.all(
      BODY_PARTS.map(
        (part) =>
          new Promise<void>((resolve) => {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = PIXEL_W;
              canvas.height = PIXEL_H;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                resolve();
                return;
              }
              ctx.drawImage(img, 0, 0, PIXEL_W, PIXEL_H);
              try {
                const data = ctx.getImageData(0, 0, PIXEL_W, PIXEL_H);
                const alpha = new Uint8ClampedArray(PIXEL_W * PIXEL_H);
                for (let i = 0; i < alpha.length; i++) {
                  alpha[i] = data.data[i * 4 + 3];
                }
                next.set(part, alpha);
              } catch {
                // CORS or other failure — skip this mask
              }
              resolve();
            };
            img.onerror = () => resolve();
            img.src = BODY_PART_MASKS[part];
          })
      )
    ).then(() => {
      if (!cancelled) setAlphaMaps(next);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return useCallback(
    (relX: number, relY: number): BodyPart[] => {
      if (alphaMaps.size === 0) return [];
      const px = Math.floor(Math.min(1, Math.max(0, relX)) * (PIXEL_W - 1));
      const py = Math.floor(Math.min(1, Math.max(0, relY)) * (PIXEL_H - 1));
      const idx = py * PIXEL_W + px;
      const hits: BodyPart[] = [];
      for (const part of BODY_PARTS) {
        const alpha = alphaMaps.get(part);
        if (alpha && alpha[idx] > 40) hits.push(part);
      }
      return hits;
    },
    [alphaMaps]
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
  /**
   * Top-3-ready exercise breakdowns per BodyPart for this week. When
   * provided, clicking an active muscle zone (or its chip) opens a
   * detail popup. Already sorted by sets desc by the caller.
   */
  exercisesByZone?: Partial<Record<BodyPart, ZoneExercise[]>>;
  className?: string;
  compact?: boolean;
  hideHeader?: boolean;
}

export function WorkoutMuscleMap({
  muscleGroups,
  muscleGroupSets,
  captionSetCounts,
  exercisesByZone,
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
  const captionSetCount = (part: BodyPart) => {
    if (captionSetCounts) return captionSetCounts[part] ?? 0;
    return part === "legs" ? legsAggregatedSetCount(setCounts) : setCounts[part];
  };
  const activeParts = DISPLAY_BODY_PARTS.filter(
    (part) => captionSetCount(part) > 0
  );
  const activeLabel = activeParts
    .map((part) => `${BODY_LABELS[part]}: ${captionSetCount(part)} Sätze`)
    .join(", ");

  const interactive = !compact && Boolean(exercisesByZone);
  const sampleAt = useMaskAlphaSampler();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedZone, setSelectedZone] = useState<BodyPart | null>(null);

  const isZoneActive = useCallback(
    (part: BodyPart) => {
      if (setCounts[part] <= 0) return false;
      const displayPart = toDisplayBodyPart(part);
      return captionSetCount(displayPart) > 0;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setCounts, captionSetCounts]
  );

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const relX = (event.clientX - rect.left) / rect.width;
    const relY = (event.clientY - rect.top) / rect.height;
    const hits = sampleAt(relX, relY);
    const target = CLICK_PRIORITY.find(
      (part) => hits.includes(part) && isZoneActive(part)
    );
    if (target) setSelectedZone(target);
  };

  const selectedExercises = selectedZone
    ? exercisesByZone?.[selectedZone] ?? []
    : [];
  const selectedTotal = selectedExercises.reduce((sum, ex) => sum + ex.sets, 0);

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
        ref={containerRef}
        onClick={handleMapClick}
        className={cn(
          "relative mx-auto aspect-[1448/1086] overflow-hidden rounded-[1.65rem] border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950",
          compact ? "max-w-24" : "max-w-[440px]",
          interactive && "cursor-pointer"
        )}
        role={interactive ? "button" : "img"}
        tabIndex={interactive ? 0 : undefined}
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
            const clickable = interactive && !isInactive;

            const content = (
              <>
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: isInactive ? "currentColor" : color }}
                />
                <span>{CHIP_LABELS[part]}</span>
                <span className="font-semibold tabular-nums">{setCount}</span>
              </>
            );

            const sharedClass = cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5",
              isInactive
                ? "border-border/40 bg-transparent text-muted-foreground/70"
                : "bg-background/90 font-medium shadow-sm",
              clickable && "transition-colors hover:bg-accent/50"
            );

            return clickable ? (
              <button
                key={part}
                type="button"
                onClick={() => setSelectedZone(part)}
                className={sharedClass}
                style={{ color, borderColor: `${color}66` }}
              >
                {content}
              </button>
            ) : (
              <span
                key={part}
                className={sharedClass}
                style={isInactive ? undefined : { color, borderColor: `${color}66` }}
              >
                {content}
              </span>
            );
          })}
        </figcaption>
      )}
      {interactive && selectedZone && (
        <ZoneDetail
          zoneLabel={BODY_LABELS[selectedZone]}
          totalSets={selectedTotal}
          exercises={selectedExercises}
          onClose={() => setSelectedZone(null)}
        />
      )}
    </figure>
  );
}

interface ZoneDetailProps {
  zoneLabel: string;
  totalSets: number;
  exercises: ZoneExercise[];
  onClose: () => void;
}

function ZoneDetail({ zoneLabel, totalSets, exercises, onClose }: ZoneDetailProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const top = exercises.slice(0, 3);
  const remaining = Math.max(0, exercises.length - 3);
  const status = zoneStatus(totalSets);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={zoneLabel}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl border border-border bg-card p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold leading-tight">{zoneLabel}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {totalSets} Sätze · Diese Woche ·{" "}
              <span className={cn("font-medium", status.className)}>
                {status.label}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {exercises.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground">
            Keine Übungen diese Woche.
          </p>
        ) : (
          <>
            <p className="mt-5 text-xs font-medium text-muted-foreground">
              Trainiert durch
            </p>
            <ol className="mt-2.5 space-y-2 text-sm leading-6">
              {top.map((ex, i) => (
                <li
                  key={ex.name}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                      {i + 1}.
                    </span>
                    <span className="truncate">{localizeExercise(ex.name)}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums">
                    {ex.sets} Sätze
                  </span>
                </li>
              ))}
            </ol>
            {remaining > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                +{remaining} weitere Übung{remaining === 1 ? "" : "en"}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
