"use client";

import { BODY_PART_COLORS, BODY_PARTS, toBodyPart, type BodyPart } from "@/lib/muscle-groups";
import { cn } from "@/lib/utils";

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

interface WorkoutMuscleAvatarProps {
  muscleGroups: string[];
  className?: string;
}

function zoneFill(active: Set<BodyPart>, part: BodyPart) {
  return active.has(part) ? BODY_PART_COLORS[part] : "hsl(var(--muted))";
}

function zoneOpacity(active: Set<BodyPart>, part: BodyPart) {
  return active.has(part) ? 1 : 0.38;
}

export function WorkoutMuscleAvatar({
  muscleGroups,
  className,
}: WorkoutMuscleAvatarProps) {
  const active = new Set(muscleGroups.map(toBodyPart));
  const activeLabel = BODY_PARTS.filter((part) => active.has(part))
    .map((part) => BODY_LABELS[part])
    .join(", ");

  return (
    <div
      className={cn(
        "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className
      )}
    >
      <svg
        viewBox="0 0 256 256"
        className="h-full w-full"
        role="img"
        aria-label={
          activeLabel
            ? `Trainierte Muskelgruppen: ${activeLabel}`
            : "Keine Muskelgruppen markiert"
        }
      >
        <title>
          {activeLabel
            ? `Trainierte Muskelgruppen: ${activeLabel}`
            : "Keine Muskelgruppen markiert"}
        </title>
        <rect width="256" height="256" rx="44" fill="hsl(var(--muted) / 0.32)" />

        <circle cx="128" cy="35" r="19" fill="hsl(var(--muted-foreground) / 0.55)" />
        <path
          d="M83 66c14-12 76-12 90 0l-14 44H97L83 66Z"
          fill={zoneFill(active, "shoulders")}
          opacity={zoneOpacity(active, "shoulders")}
        />
        <path
          d="M86 87c7 10 13 25 13 47l-10 38H75l11-85Z"
          fill={zoneFill(active, "back")}
          opacity={zoneOpacity(active, "back")}
        />
        <path
          d="M170 87c-7 10-13 25-13 47l10 38h14l-11-85Z"
          fill={zoneFill(active, "back")}
          opacity={zoneOpacity(active, "back")}
        />
        <path
          d="M96 78c10-8 22-11 32-5v52H88l8-47Z"
          fill={zoneFill(active, "chest")}
          opacity={zoneOpacity(active, "chest")}
        />
        <path
          d="M128 73c10-6 22-3 32 5l8 47h-40V73Z"
          fill={zoneFill(active, "chest")}
          opacity={zoneOpacity(active, "chest")}
        />
        <path
          d="M94 126h68l-10 45h-48l-10-45Z"
          fill={zoneFill(active, "core")}
          opacity={zoneOpacity(active, "core")}
        />
        <path
          d="M73 74c9 2 17 11 20 23l-9 66c-9-1-17-6-21-15l6-54c1-8 2-14 4-20Z"
          fill={zoneFill(active, "biceps")}
          opacity={zoneOpacity(active, "biceps")}
        />
        <path
          d="M183 74c-9 2-17 11-20 23l9 66c9-1 17-6 21-15l-6-54c-1-8-2-14-4-20Z"
          fill={zoneFill(active, "biceps")}
          opacity={zoneOpacity(active, "biceps")}
        />
        <path
          d="M62 149c6 11 14 18 23 18l-5 31c-10 0-20-8-24-21l6-28Z"
          fill={zoneFill(active, "triceps")}
          opacity={zoneOpacity(active, "triceps")}
        />
        <path
          d="M194 149c-6 11-14 18-23 18l5 31c10 0 20-8 24-21l-6-28Z"
          fill={zoneFill(active, "triceps")}
          opacity={zoneOpacity(active, "triceps")}
        />
        <path
          d="M101 173h25l-5 64H94l7-64Z"
          fill={zoneFill(active, "legs")}
          opacity={zoneOpacity(active, "legs")}
        />
        <path
          d="M130 173h25l7 64h-27l-5-64Z"
          fill={zoneFill(active, "legs")}
          opacity={zoneOpacity(active, "legs")}
        />

        <path
          d="M91 70c21 16 53 16 74 0"
          fill="none"
          stroke="hsl(var(--background) / 0.75)"
          strokeLinecap="round"
          strokeWidth="5"
        />
        <path
          d="M128 74v96M96 126h64M103 173h50"
          fill="none"
          stroke="hsl(var(--background) / 0.55)"
          strokeLinecap="round"
          strokeWidth="4"
        />
        <path
          d="M94 236h28M134 236h28"
          stroke="hsl(var(--muted-foreground) / 0.55)"
          strokeLinecap="round"
          strokeWidth="8"
        />
      </svg>
    </div>
  );
}
