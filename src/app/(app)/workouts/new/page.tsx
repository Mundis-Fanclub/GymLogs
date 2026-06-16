"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useConvexUser } from "@/hooks/useConvexUser";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  ChevronRight,
  Clock3,
  Dumbbell,
  ListChecks,
  MoreHorizontal,
  Plus,
  Play,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ActiveWorkout = dynamic(
  () => import("@/components/workout/ActiveWorkout").then((module) => module.ActiveWorkout),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    ),
  }
);

export default function NewWorkoutPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      }
    >
      <NewWorkoutPageContent />
    </Suspense>
  );
}

function NewWorkoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId, isLoaded, isSignedIn } = useConvexUser();
  const { t } = useAppPreferences();
  const templateId = searchParams.get("templateId") as Id<"workout_templates"> | null;
  const workoutIdParam = searchParams.get("id") as Id<"workouts"> | null;
  const [finishedWorkoutId, setFinishedWorkoutId] =
    useState<Id<"workouts"> | null>(null);
  const [canceledWorkoutId, setCanceledWorkoutId] =
    useState<Id<"workouts"> | null>(null);
  const [startingEmpty, setStartingEmpty] = useState(false);
  const createWorkout = useMutation(api.workouts.create);
  const resetEmptyWorkoutStart = useMutation(api.workouts.resetEmptyStart);
  const startFromTemplate = useMutation(api.workouts.startFromTemplate);
  const incompleteWorkout = useQuery(
    api.workouts.getIncomplete,
    userId && !templateId && !workoutIdParam ? { userId } : "skip"
  );
  const selectedWorkout = useQuery(
    api.workouts.get,
    workoutIdParam ? { workoutId: workoutIdParam } : "skip"
  );
  const startTemplate = useQuery(
    api.workouts.getTemplateForStart,
    userId && templateId ? { viewerId: userId, templateId } : "skip"
  );
  const startOptions = useQuery(
    api.workouts.listStartOptions,
    userId && !templateId && !workoutIdParam ? { userId, limit: 8 } : "skip"
  );

  async function beginEmptyWorkout() {
    if (!userId) return;
    setStartingEmpty(true);
    try {
      if (incompleteWorkout) {
        await resetEmptyWorkoutStart({ workoutId: incompleteWorkout._id });
        router.replace(`/workouts/new?id=${incompleteWorkout._id}`);
        return;
      }
      const id = await createWorkout({ userId });
      router.replace(`/workouts/new?id=${id}`);
    } finally {
      setStartingEmpty(false);
    }
  }

  async function confirmTemplateStart() {
    if (!userId || !templateId) return;
    const workoutId = await startFromTemplate({ userId, templateId });
    router.replace(`/workouts/new?id=${workoutId}`);
  }

  if (isLoaded && !isSignedIn) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState
          icon={User}
          title={t("dashboard.signedOutTitle")}
          description={t("dashboard.signedOutCopy")}
          action={
            <Link href="/sign-in">
              <Button>{t("common.signIn")}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (finishedWorkoutId) {
    return (
      <div>
        <h1 className="text-xl font-semibold mb-6">Workout abgeschlossen</h1>
        <ActiveWorkout workoutId={finishedWorkoutId} isFinished />
      </div>
    );
  }

  if (templateId) {
    if (!userId || startTemplate === undefined) {
      return (
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      );
    }

    if (!startTemplate) {
      return (
        <div className="mx-auto max-w-2xl">
          <EmptyState
            icon={Dumbbell}
            title={t("workouts.templateStartUnavailableTitle")}
            description={t("workouts.templateStartUnavailableCopy")}
            action={
              <Link href="/workouts">
                <Button>{t("workouts.backToWorkouts")}</Button>
              </Link>
            }
          />
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Button variant="ghost" className="gap-2 px-0" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          {t("profile.misc.back")}
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              {t("workouts.confirmTemplateStartTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{startTemplate.name}</h1>
              {startTemplate.description && (
                <p className="mt-2 text-sm text-muted-foreground">{startTemplate.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {startTemplate.totalExercises} {t("profile.playlists.exercises")}
                </Badge>
                <Badge variant="secondary">
                  {startTemplate.totalSets} {t("common.sets")}
                </Badge>
                <Badge variant="outline">
                  {startTemplate.executionCount} {t("profile.playlists.performedCount")}
                </Badge>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("workouts.confirmTemplateStartCopy")}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button className="gap-2" onClick={confirmTemplateStart}>
                <Play className="h-4 w-4" />
                {t("workouts.startFromTemplate")}
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                {t("profile.misc.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (workoutIdParam) {
    if (selectedWorkout === undefined) {
      return (
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      );
    }

    if (!selectedWorkout) {
      return (
        <div className="mx-auto max-w-2xl">
          <EmptyState
            icon={Dumbbell}
            title={t("common.notFoundWorkout")}
            description={t("workouts.templateStartUnavailableCopy")}
          />
        </div>
      );
    }

    return (
      <div>
        <h1 className="text-xl font-semibold mb-6">{t("workouts.newTitle")}</h1>
        <ActiveWorkout
          workoutId={selectedWorkout._id}
          onFinished={setFinishedWorkoutId}
          onCanceled={setCanceledWorkoutId}
        />
      </div>
    );
  }

  if (canceledWorkoutId) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isLoaded || incompleteWorkout === undefined || startOptions === undefined) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-52 w-full" />
      </div>
    );
  }

  return (
    <WorkoutStartHome
      options={startOptions}
      startingEmpty={startingEmpty}
      hasIncompleteWorkout={Boolean(incompleteWorkout)}
      onBeginEmpty={beginEmptyWorkout}
      onClose={() => router.back()}
    />
  );
}

type WorkoutStartTemplate = {
  _id: Id<"workout_templates">;
  name: string;
  description?: string;
  visibility: "private" | "friends" | "public";
  totalExercises: number;
  totalSets: number;
  totalVolume: number | null;
  executionCount: number;
  author: null | {
    _id: Id<"users">;
    name: string;
    username?: string;
    avatarUrl?: string | null;
    isPro: boolean;
  };
};

type WorkoutStartOptions = {
  ownTemplates: WorkoutStartTemplate[];
  followedTemplates: WorkoutStartTemplate[];
  activitySuggestions: WorkoutStartTemplate[];
  publicSuggestions: WorkoutStartTemplate[];
  gymLogsSuggestions: WorkoutStartTemplate[];
};

function WorkoutStartHome({
  options,
  startingEmpty,
  hasIncompleteWorkout,
  onBeginEmpty,
  onClose,
}: {
  options: WorkoutStartOptions;
  startingEmpty: boolean;
  hasIncompleteWorkout: boolean;
  onBeginEmpty: () => void;
  onClose: () => void;
}) {
  const [suggestionTab, setSuggestionTab] = useState<"activity" | "gymlogs">("activity");
  const suggestionTemplates =
    suggestionTab === "activity"
      ? options.activitySuggestions.length > 0
        ? options.activitySuggestions
        : options.publicSuggestions
      : options.gymLogsSuggestions;

  return (
    <div data-flush className="-mx-3 min-h-full bg-background px-4 pb-[calc(env(safe-area-inset-bottom)+6.75rem)] pt-4 text-foreground sm:-mx-5 sm:px-8 sm:pt-5 md:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-white/35 sm:mb-6 sm:h-1.5 sm:w-20" />
        <div className="mb-5 flex items-start justify-between gap-3 sm:mb-7 sm:gap-4">
          <div className="min-w-0">
            <h1 className="whitespace-nowrap text-[1.68rem] font-black leading-tight tracking-normal min-[390px]:text-[1.9rem] sm:text-5xl">
              Neues <span className="text-primary">Workout</span> starten
            </h1>
            <p className="mt-1 text-[0.82rem] text-muted-foreground min-[390px]:text-sm sm:mt-2 sm:text-lg">Wähle eine Option, um loszulegen.</p>
          </div>
          <Button type="button" size="icon" variant="outline" className="size-9 shrink-0 rounded-full border-border/80 bg-card/55 sm:size-12" onClick={onClose} aria-label="Schließen">
            <X className="h-4 w-4 sm:h-6 sm:w-6" />
          </Button>
        </div>

        <button
          type="button"
          onClick={onBeginEmpty}
          disabled={startingEmpty}
          className="group mb-6 grid w-full grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[1rem] border border-primary p-3 text-left transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 min-[390px]:grid-cols-[3.25rem_minmax(0,1fr)_auto] sm:mb-9 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:gap-4 sm:rounded-[1.35rem] sm:p-5"
          style={{
            background:
              "linear-gradient(90deg, var(--brand-soft), var(--brand-wash))",
            boxShadow:
              "0 0 28px color-mix(in oklch, var(--primary) 10%, transparent)",
          }}
        >
          <span className="flex size-10 items-center justify-center rounded-full border border-primary/55 bg-black/25 text-primary min-[390px]:size-11 sm:size-16">
            <Plus className="h-5 w-5 sm:h-8 sm:w-8" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[0.98rem] font-extrabold min-[390px]:text-[1.08rem] sm:text-2xl">{hasIncompleteWorkout ? "Leeres Workout beginnen" : "Leeres Workout beginnen"}</span>
            <span className="mt-0.5 block truncate text-[0.72rem] text-muted-foreground min-[390px]:text-xs sm:mt-1 sm:text-base">Erstelle dein Workout von Grund auf</span>
          </span>
          <ChevronRight className="h-4 w-4 text-white/80 transition group-hover:translate-x-1 sm:h-7 sm:w-7" />
        </button>

        <TemplateRail
          icon={Dumbbell}
          title="Meine Playlists"
          templates={options.ownTemplates}
          empty="Noch keine eigenen Workout-Playlists"
          actionHref="/profile#playlists"
        />
        <TemplateRail
          icon={Users}
          title="Playlists, denen du folgst"
          templates={options.followedTemplates}
          empty="Noch keine Playlists von gefolgten Nutzern"
          actionHref="/social"
        />

        <section className="mt-7 sm:mt-10">
          <div className="mb-3 flex items-center gap-2.5 sm:mb-5 sm:gap-3">
            <Sparkles className="h-5 w-5 text-primary sm:h-7 sm:w-7" />
            <h2 className="text-[1.15rem] font-extrabold min-[390px]:text-xl sm:text-2xl">Vorschläge für dich</h2>
          </div>
          <div className="mb-3 grid grid-cols-2 overflow-hidden rounded-[1rem] border border-border/80 bg-card/55 sm:mb-4 sm:rounded-2xl">
            {[
              ["activity", "Basierend auf deinen Aktivitäten"],
              ["gymlogs", "GymLogs Empfehlungen"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSuggestionTab(id as "activity" | "gymlogs")}
                className={cn(
                  "min-h-10 px-2 text-[0.68rem] font-extrabold transition min-[390px]:text-xs sm:min-h-14 sm:px-4 sm:text-base",
                  suggestionTab === id ? "bg-black/45 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="overflow-hidden rounded-[1rem] border border-border/80 bg-card/75 sm:rounded-[1.35rem]">
            {suggestionTemplates.length === 0 ? (
              <div className="flex min-h-32 items-center justify-center px-5 text-center text-sm text-muted-foreground">
                Noch keine passenden Vorschläge vorhanden.
              </div>
            ) : (
              suggestionTemplates.map((template, index) => (
                <SuggestionRow key={template._id} template={template} index={index} />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function TemplateRail({
  icon: Icon,
  title,
  templates,
  empty,
  actionHref,
}: {
  icon: typeof Dumbbell;
  title: string;
  templates: WorkoutStartTemplate[];
  empty: string;
  actionHref: string;
}) {
  return (
    <section className="mt-6 sm:mt-9">
      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4 sm:gap-4">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <Icon className="h-5 w-5 shrink-0 text-primary sm:h-7 sm:w-7" />
          <h2 className="truncate text-[1.15rem] font-extrabold min-[390px]:text-xl sm:text-2xl">{title}</h2>
        </div>
        <Link href={actionHref} className="inline-flex shrink-0 items-center gap-1 text-[0.65rem] font-extrabold text-primary min-[390px]:text-xs sm:text-sm">
          Alle anzeigen
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      {templates.length === 0 ? (
        <div className="rounded-[1rem] border border-border/80 bg-card/55 p-3.5 text-[0.78rem] text-muted-foreground min-[390px]:text-sm sm:rounded-[1.25rem] sm:p-5">{empty}</div>
      ) : (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:gap-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {templates.map((template, index) => (
            <TemplateCard key={template._id} template={template} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}

function TemplateCard({ template, index }: { template: WorkoutStartTemplate; index: number }) {
  return (
    <Link
      href={`/workouts/new?templateId=${template._id}`}
      className="group relative flex min-h-36 w-[10.75rem] shrink-0 flex-col justify-end overflow-hidden rounded-[0.95rem] border border-border/80 bg-card p-3.5 shadow-xl shadow-background/25 min-[390px]:min-h-40 min-[390px]:w-[12.5rem] sm:min-h-56 sm:w-72 sm:rounded-[1.2rem] sm:p-5"
      style={{ backgroundImage: templateBackground(index) }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/88" />
      <div className="relative">
        <p className="truncate text-[0.95rem] font-extrabold min-[390px]:text-base sm:text-2xl">{template.name}</p>
        <p className="mt-0.5 truncate text-[0.72rem] text-white/75 min-[390px]:text-xs sm:mt-1 sm:text-base">{template.author ? `von ${template.author.name}` : `${template.totalExercises} Übungen`}</p>
        <TemplateStats template={template} compact />
      </div>
    </Link>
  );
}

function SuggestionRow({ template, index }: { template: WorkoutStartTemplate; index: number }) {
  return (
    <div className="grid grid-cols-[4.25rem_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-border/60 p-2.5 last:border-b-0 min-[390px]:grid-cols-[4.75rem_minmax(0,1fr)_auto] sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:gap-5 sm:p-4">
      <div className="h-16 overflow-hidden rounded-xl bg-card bg-cover bg-center min-[390px]:h-20 sm:h-28 sm:rounded-2xl" style={{ backgroundImage: templateBackground(index) }} />
      <div className="min-w-0">
        <p className="truncate text-[0.88rem] font-extrabold min-[390px]:text-base sm:text-xl">{template.name}</p>
        <p className="mt-0.5 truncate text-[0.72rem] text-muted-foreground min-[390px]:text-xs sm:mt-1 sm:text-sm">
          {template.author ? `Von ${template.author.name}` : template.description || "Workout-Vorlage"}
        </p>
        <TemplateStats template={template} />
      </div>
      <div className="flex items-center gap-2">
        <Link href={`/workouts/new?templateId=${template._id}`}>
          <Button variant="outline" className="hidden min-w-28 rounded-2xl border-border/80 bg-card/55 text-primary hover:bg-primary/10 sm:inline-flex">
            Öffnen
          </Button>
        </Link>
        <Button size="icon-sm" variant="ghost" className="h-8 w-8 rounded-full text-muted-foreground sm:h-9 sm:w-9" aria-label="Mehr">
          <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </div>
  );
}

function TemplateStats({ template, compact = false }: { template: WorkoutStartTemplate; compact?: boolean }) {
  const estimatedMinutes = Math.max(35, Math.round(template.totalSets * 3.5));
  return (
    <div className={cn("mt-2 flex flex-wrap gap-x-2.5 gap-y-1 text-[0.64rem] text-white/72 min-[390px]:text-[0.7rem] sm:mt-4 sm:gap-x-5 sm:gap-y-2 sm:text-sm", compact && "sm:text-base")}>
      <span className="inline-flex items-center gap-1.5">
        <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4" />
        {template.totalExercises} Übungen
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ListChecks className="h-3 w-3 sm:h-4 sm:w-4" />
        {template.totalSets} Sätze
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock3 className="h-3 w-3 sm:h-4 sm:w-4" />
        {estimatedMinutes} Min
      </span>
      {compact && (
        <span className="inline-flex items-center gap-1.5">
          <Bookmark className="h-3 w-3 sm:h-4 sm:w-4" />
          {template.executionCount}
        </span>
      )}
    </div>
  );
}

function templateBackground(index: number) {
  const backgrounds = [
    "radial-gradient(circle at 22% 18%, var(--brand-wash), transparent 34%), linear-gradient(135deg, var(--card), var(--background))",
    "radial-gradient(circle at 74% 18%, var(--brand-soft), transparent 36%), linear-gradient(135deg, var(--background), var(--card))",
    "radial-gradient(circle at 34% 78%, var(--brand-soft), transparent 38%), linear-gradient(135deg, var(--card), var(--muted))",
    "radial-gradient(circle at 82% 72%, var(--brand-wash), transparent 32%), linear-gradient(135deg, var(--muted), var(--background))",
  ];
  return backgrounds[index % backgrounds.length];
}
