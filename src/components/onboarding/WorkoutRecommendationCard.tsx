"use client";

import Link from "next/link";
import { Bookmark, Clock, Dumbbell, Eye, Save, Target, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type WorkoutRecommendation = {
  id: string;
  kind: "community" | "preset";
  title: string;
  description?: string;
  durationMinutes: number;
  trainingGoal?: string;
  split?: string;
  totalExercises: number;
  saves: number;
  repeats: number;
  durationRangeMinutes?: {
    min: number;
    max: number;
  };
  repeatSamples?: Array<{
    name: string;
    username?: string;
    durationMinutes: number;
  }>;
  creator: null | {
    id?: string;
    name: string;
    username?: string;
    avatarUrl?: string;
  };
  tags?: string[];
};

export function WorkoutRecommendationCard({
  workout,
  saved,
  viewLabel,
  saveLabel,
  savedLabel,
  exerciseLabel,
  savedStatLabel,
  repeatStatLabel,
  approxLabel,
  variableTimeLabel,
  goalLabel,
  splitLabel,
  formatGoal,
  formatSplit,
  onSave,
}: {
  workout: WorkoutRecommendation;
  saved?: boolean;
  viewLabel: string;
  saveLabel: string;
  savedLabel: string;
  exerciseLabel: string;
  savedStatLabel: string;
  repeatStatLabel: string;
  approxLabel: string;
  variableTimeLabel: string;
  goalLabel: string;
  splitLabel: string;
  formatGoal: (goal: string) => string;
  formatSplit: (split: string) => string;
  onSave: () => void;
}) {
  const creatorHref = workout.creator?.id ? `/profile/${workout.creator.id}` : undefined;
  const durationLabel = workout.durationRangeMinutes
    ? `${workout.durationRangeMinutes.min}-${workout.durationRangeMinutes.max} min`
    : `${approxLabel} ${workout.durationMinutes} min`;

  return (
    <article className={cn("rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30", saved && "border-primary/40 bg-primary/5")}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge variant={workout.kind === "community" ? "secondary" : "outline"} className="mb-2">
            {workout.kind === "community" ? "Community" : "GymLogs"}
          </Badge>
          <h3 className="text-lg font-bold leading-tight text-foreground">{workout.title}</h3>
          {workout.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{workout.description}</p>}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm min-[460px]:grid-cols-4">
        <Meta icon={Clock} label={durationLabel} />
        <Meta icon={Dumbbell} label={`${workout.totalExercises} ${exerciseLabel}`} />
        <Meta icon={Bookmark} label={`${workout.saves} ${savedStatLabel}`} />
        <Meta icon={Users} label={`${workout.repeats} ${repeatStatLabel}`} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {workout.trainingGoal && (
          <Badge variant="outline">
            <Target className="h-3 w-3" />
            {goalLabel}: {formatGoal(workout.trainingGoal)}
          </Badge>
        )}
        {workout.split && <Badge variant="outline">{splitLabel}: {formatSplit(workout.split)}</Badge>}
      </div>

      <div className="mt-3 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm leading-6 text-muted-foreground">
        {workout.repeatSamples && workout.repeatSamples.length > 0 ? (
          <div className="space-y-1">
            {workout.repeatSamples.map((sample) => (
              <p key={`${sample.username ?? sample.name}-${sample.durationMinutes}`}>
                {sample.name} · {sample.durationMinutes} min
              </p>
            ))}
          </div>
        ) : (
          <p>{variableTimeLabel}</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
        <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
            {workout.creator?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={workout.creator.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </span>
          <span className="min-w-0 truncate">{workout.creator?.name ?? "GymLogs"}</span>
        </div>
        <div className="flex shrink-0 gap-2">
          {creatorHref ? (
            <Link href={creatorHref}>
              <Button type="button" size="sm" variant="outline">
                <Eye className="h-4 w-4" />
                {viewLabel}
              </Button>
            </Link>
          ) : (
            <Button type="button" size="sm" variant="outline">
              <Eye className="h-4 w-4" />
              {viewLabel}
            </Button>
          )}
          <Button type="button" size="sm" onClick={onSave} variant={saved ? "secondary" : "default"}>
            <Save className="h-4 w-4" />
            {saved ? savedLabel : saveLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}

function Meta({ icon: Icon, label }: { icon: typeof Clock; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg bg-muted/35 px-2.5 py-2 text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}
