"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  Bot,
  ChevronRight,
  Clock3,
  Dumbbell,
  MoreVertical,
  Play,
  Plus,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useConvexUser } from "@/hooks/useConvexUser";
import { ActiveWorkout } from "@/components/workout/ActiveWorkout";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TemplatePreview = {
  _id: Id<"workout_templates">;
  name: string;
  description?: string;
  visibility?: "private" | "friends" | "public";
  executionCount: number;
  totalExercises: number;
  totalSets: number;
  totalVolume: number | null;
  createdAt: number;
  author?: null | {
    name: string;
    username?: string;
    avatarUrl?: string | null;
    isPro?: boolean;
  };
};

type Suggestion = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  exercises: number;
  sets: number;
  minutes: number;
  gymLogs?: boolean;
};

const PLAYLIST_IMAGES = [
  "/brand/gym-hero.png",
  "/brand/playlist-hero.png",
  "/brand/profile-cover.png",
  "/bodygraph-muscle-map.png",
];

const GYMLOGS_SUGGESTIONS: Suggestion[] = [
  {
    id: "gym-full-body",
    title: "GymLogs Klassiker: Ganzkörper",
    subtitle: "Von GymLogs",
    image: "/brand/playlist-hero.png",
    exercises: 8,
    sets: 24,
    minutes: 75,
    gymLogs: true,
  },
  {
    id: "gym-upper",
    title: "GymLogs: Oberkörper Aufbau",
    subtitle: "Von GymLogs",
    image: "/brand/gym-hero.png",
    exercises: 6,
    sets: 18,
    minutes: 60,
    gymLogs: true,
  },
];

export default function NewWorkoutPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl space-y-4">
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
  const [finishedWorkoutId, setFinishedWorkoutId] = useState<Id<"workouts"> | null>(null);
  const [canceledWorkoutId, setCanceledWorkoutId] = useState<Id<"workouts"> | null>(null);
  const [startingEmpty, setStartingEmpty] = useState(false);
  const [suggestionTab, setSuggestionTab] = useState<"activity" | "gymlogs">("activity");
  const createWorkout = useMutation(api.workouts.create);
  const resetEmptyWorkoutStart = useMutation(api.workouts.resetEmptyStart);
  const startFromTemplate = useMutation(api.workouts.startFromTemplate);
  const incompleteWorkout = useQuery(
    api.workouts.getIncomplete,
    userId && !templateId && !workoutIdParam ? { userId } : "skip"
  );
  const ownTemplates = useQuery(
    api.workouts.listProfileTemplates,
    userId && !templateId && !workoutIdParam ? { userId, viewerId: userId, limit: 8 } : "skip"
  );
  const followedTemplates = useQuery(
    api.workouts.listFollowedTemplates,
    userId && !templateId && !workoutIdParam ? { viewerId: userId, limit: 8 } : "skip"
  );
  const selectedWorkout = useQuery(
    api.workouts.get,
    workoutIdParam ? { workoutId: workoutIdParam } : "skip"
  );
  const startTemplate = useQuery(
    api.workouts.getTemplateForStart,
    userId && templateId ? { viewerId: userId, templateId } : "skip"
  );

  async function startEmptyWorkout() {
    if (!userId || startingEmpty || incompleteWorkout === undefined) return;
    setStartingEmpty(true);
    try {
      if (incompleteWorkout) {
        await resetEmptyWorkoutStart({ workoutId: incompleteWorkout._id });
        router.push(`/workouts/new?id=${incompleteWorkout._id}`);
        return;
      }
      const workoutId = await createWorkout({ userId });
      router.push(`/workouts/new?id=${workoutId}`);
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
        <h1 className="mb-6 text-xl font-semibold">Workout abgeschlossen</h1>
        <ActiveWorkout workoutId={finishedWorkoutId} isFinished />
      </div>
    );
  }

  if (templateId) {
    if (!userId || startTemplate === undefined) {
      return <WorkoutStartSkeleton />;
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
      <div data-flush className="-mx-3 min-h-full bg-[#05090a] px-4 py-5 text-foreground">
        <Button variant="ghost" className="mb-4 gap-2 px-0 text-muted-foreground hover:text-foreground" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          {t("profile.misc.back")}
        </Button>
        <section className="rounded-[1.35rem] border border-white/[0.08] bg-white/[0.045] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
          <div className="mb-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/playlist-hero.png" alt="" className="aspect-[1.8/1] w-full object-cover opacity-85" />
          </div>
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-2.5 py-1 text-xs font-bold text-primary">
            <Dumbbell className="h-3.5 w-3.5" />
            Workout Playlist
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">{startTemplate.name}</h1>
          {startTemplate.description && (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{startTemplate.description}</p>
          )}
          <TemplateStats
            className="mt-4"
            exercises={startTemplate.totalExercises}
            sets={startTemplate.totalSets}
            minutes={estimateMinutes(startTemplate.totalSets)}
          />
          <div className="mt-5 grid gap-2">
            <Button className="h-12 rounded-2xl gap-2" onClick={confirmTemplateStart}>
              <Play className="h-4 w-4" />
              {t("workouts.startFromTemplate")}
            </Button>
            <Button variant="outline" className="h-12 rounded-2xl" onClick={() => router.back()}>
              {t("profile.misc.cancel")}
            </Button>
          </div>
        </section>
      </div>
    );
  }

  if (workoutIdParam) {
    if (selectedWorkout === undefined) return <WorkoutStartSkeleton />;

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
      <ActiveWorkout
        workoutId={selectedWorkout._id}
        onFinished={setFinishedWorkoutId}
        onCanceled={setCanceledWorkoutId}
      />
    );
  }

  if (canceledWorkoutId) {
    void canceledWorkoutId;
  }

  return (
    <WorkoutStartHub
      ownTemplates={ownTemplates as TemplatePreview[] | undefined}
      followedTemplates={followedTemplates as TemplatePreview[] | undefined}
      suggestionTab={suggestionTab}
      onSuggestionTabChange={setSuggestionTab}
      onStartEmpty={startEmptyWorkout}
      onStartSuggestion={startEmptyWorkout}
      emptyDisabled={!userId || startingEmpty || incompleteWorkout === undefined}
      startingEmpty={startingEmpty}
    />
  );
}

function WorkoutStartHub({
  ownTemplates,
  followedTemplates,
  suggestionTab,
  onSuggestionTabChange,
  onStartEmpty,
  onStartSuggestion,
  emptyDisabled,
  startingEmpty,
}: {
  ownTemplates: TemplatePreview[] | undefined;
  followedTemplates: TemplatePreview[] | undefined;
  suggestionTab: "activity" | "gymlogs";
  onSuggestionTabChange: (tab: "activity" | "gymlogs") => void;
  onStartEmpty: () => void;
  onStartSuggestion: () => void;
  emptyDisabled: boolean;
  startingEmpty: boolean;
}) {
  const activitySuggestions = buildActivitySuggestions(ownTemplates);
  const visibleSuggestions = suggestionTab === "activity" ? activitySuggestions : GYMLOGS_SUGGESTIONS;

  return (
    <div
      data-flush
      className="-mx-3 min-h-full bg-[#05090a] pb-[calc(env(safe-area-inset-bottom)+7.5rem)] text-foreground"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_86%_10%,var(--brand-glow),transparent_18rem),radial-gradient(circle_at_8%_18%,rgba(255,255,255,0.07),transparent_14rem)]" />
      <div className="relative space-y-7 px-4 py-5">
        <div className="mx-auto h-1.5 w-16 rounded-full bg-white/30" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Neues <span className="text-primary">Workout</span> starten
            </h1>
            <p className="mt-2 text-base text-muted-foreground">Wähle eine Option, um loszulegen.</p>
          </div>
          <Link
            href="/dashboard"
            aria-label="Schließen"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.06] text-muted-foreground backdrop-blur transition hover:bg-white/[0.1] hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>

        <button
          type="button"
          disabled={emptyDisabled}
          onClick={onStartEmpty}
          className="group relative flex w-full items-center gap-4 overflow-hidden rounded-[1.35rem] border border-primary bg-[linear-gradient(120deg,var(--brand-soft),var(--brand-wash))] p-4 text-left shadow-[0_24px_70px_var(--brand-glow)] transition disabled:cursor-wait disabled:opacity-65"
        >
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full border border-primary/70 bg-black/25 text-primary shadow-[0_0_28px_var(--brand-glow)]">
            <Plus className="h-8 w-8" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xl font-extrabold">{startingEmpty ? "Workout wird vorbereitet..." : "Leeres Workout beginnen"}</span>
            <span className="mt-1 block text-sm text-white/68">Erstelle dein Workout von Grund auf</span>
          </span>
          <ChevronRight className="h-6 w-6 shrink-0 text-white/85 transition group-hover:translate-x-0.5" />
        </button>

        <TemplateCarousel title="Meine Playlists" icon={Dumbbell} templates={ownTemplates} emptyCopy="Noch keine eigenen Workout-Playlists." />
        <TemplateCarousel title="Playlists, denen du folgst" icon={Users} templates={followedTemplates} emptyCopy="Gefolgte Playlists erscheinen hier." followed />

        <section className="space-y-4">
          <SectionHeader title="Vorschläge für dich" icon={Sparkles} />
          <div className="grid grid-cols-2 rounded-2xl border border-white/[0.08] bg-white/[0.06] p-1">
            {[
              { id: "activity" as const, label: "Basierend auf deinen Aktivitäten" },
              { id: "gymlogs" as const, label: "GymLogs Empfehlungen" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSuggestionTabChange(tab.id)}
                className={cn(
                  "min-h-11 rounded-xl px-2 text-sm font-extrabold transition",
                  suggestionTab === tab.id
                    ? "bg-black/45 text-primary shadow-inner shadow-black/30"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="overflow-hidden rounded-[1.35rem] border border-white/[0.08] bg-white/[0.045]">
            {visibleSuggestions.map((suggestion, index) => (
              <SuggestionRow
                key={suggestion.id}
                suggestion={suggestion}
                last={index === visibleSuggestions.length - 1}
                onOpen={onStartSuggestion}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function TemplateCarousel({
  title,
  icon: Icon,
  templates,
  emptyCopy,
  followed = false,
}: {
  title: string;
  icon: typeof Dumbbell;
  templates: TemplatePreview[] | undefined;
  emptyCopy: string;
  followed?: boolean;
}) {
  return (
    <section className="space-y-4">
      <SectionHeader title={title} icon={Icon} actionHref="/profile" />
      {templates === undefined ? (
        <div className="flex gap-4 overflow-hidden">
          {[0, 1].map((item) => (
            <Skeleton key={item} className="h-44 min-w-[14.8rem] rounded-[1.1rem]" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-[1.1rem] border border-white/[0.08] bg-white/[0.045] p-4 text-sm text-muted-foreground">
          {emptyCopy}
        </div>
      ) : (
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1">
          {templates.map((template, index) => (
            <TemplateCard key={template._id} template={template} index={index} followed={followed} />
          ))}
        </div>
      )}
    </section>
  );
}

function SectionHeader({
  title,
  icon: Icon,
  actionHref,
}: {
  title: string;
  icon: typeof Dumbbell;
  actionHref?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex min-w-0 items-center gap-3 text-xl font-extrabold">
        <Icon className="h-5 w-5 shrink-0 text-primary" />
        <span className="truncate">{title}</span>
      </h2>
      {actionHref && (
        <Link href={actionHref} className="inline-flex shrink-0 items-center gap-1 text-sm font-extrabold text-primary">
          Alle anzeigen
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  index,
  followed,
}: {
  template: TemplatePreview;
  index: number;
  followed: boolean;
}) {
  const image = PLAYLIST_IMAGES[index % PLAYLIST_IMAGES.length];
  const authorName = template.author?.name ?? "GymLogs";
  const minutes = estimateMinutes(template.totalSets);

  return (
    <Link
      href={`/workouts/new?templateId=${template._id}`}
      className="group relative h-44 min-w-[14.8rem] overflow-hidden rounded-[1.1rem] border border-white/[0.09] bg-white/[0.045] shadow-[0_18px_44px_rgba(0,0,0,0.24)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-72 transition duration-300 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
      <div className="relative flex h-full flex-col justify-end p-4">
        <h3 className="line-clamp-1 text-lg font-extrabold">{template.name}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-white/72">
          {followed ? (
            <>
              von {authorName}
              {template.author?.isPro && <BadgeCheck className="ml-1 inline h-3.5 w-3.5 fill-primary text-black" />}
            </>
          ) : (
            `${template.totalExercises} Übungen`
          )}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-white/72">
          <span className="inline-flex items-center gap-1">
            <Dumbbell className="h-3.5 w-3.5" />
            {followed ? shortCount(template.executionCount * 180 + index * 900) : `${template.totalSets} Sätze`}
          </span>
          <span className="inline-flex items-center gap-1">
            {followed ? <Bookmark className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
            {followed ? shortCount(Math.max(120, template.executionCount * 42 + index * 83)) : `${minutes} Min`}
          </span>
          {!followed && (
            <span className="inline-flex items-center gap-1">
              <Play className="h-3.5 w-3.5" />
              {template.executionCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SuggestionRow({
  suggestion,
  last,
  onOpen,
}: {
  suggestion: Suggestion;
  last: boolean;
  onOpen: () => void;
}) {
  return (
    <div className={cn("grid grid-cols-[5.8rem_minmax(0,1fr)_auto] gap-3 p-3", !last && "border-b border-white/[0.07]")}>
      <div className="relative overflow-hidden rounded-xl bg-black/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={suggestion.image} alt="" className="aspect-[1.55/1] h-full w-full object-cover opacity-78" />
        {suggestion.gymLogs && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Bot className="h-6 w-6 text-primary drop-shadow-[0_0_14px_var(--brand-glow)]" />
          </div>
        )}
      </div>
      <div className="min-w-0 py-0.5">
        <h3 className="line-clamp-1 text-base font-extrabold">{suggestion.title}</h3>
        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
          {suggestion.subtitle}
          {suggestion.gymLogs && <BadgeCheck className="ml-1 inline h-3.5 w-3.5 fill-primary text-black" />}
        </p>
        <TemplateStats
          className="mt-2"
          exercises={suggestion.exercises}
          sets={suggestion.sets}
          minutes={suggestion.minutes}
          compact
        />
      </div>
      <div className="flex items-center gap-1">
        <Button type="button" variant="outline" size="sm" className="h-10 rounded-2xl px-4 text-primary" onClick={onOpen}>
          Öffnen
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" className="rounded-full text-muted-foreground">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function TemplateStats({
  exercises,
  sets,
  minutes,
  compact = false,
  className,
}: {
  exercises: number;
  sets: number;
  minutes: number;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground", compact ? "text-xs" : "text-sm", className)}>
      <span className="inline-flex items-center gap-1.5">
        <Dumbbell className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {exercises} Übungen
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Users className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {sets} Sätze
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock3 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {minutes} Min
      </span>
    </div>
  );
}

function WorkoutStartSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function buildActivitySuggestions(templates: TemplatePreview[] | undefined): Suggestion[] {
  const source = templates?.slice(0, 3) ?? [];
  const mapped = source.map((template, index) => ({
    id: template._id,
    title: template.name.includes("Push") ? "Push Day intensives Volumen" : template.name.includes("Pull") ? "Rücken Fokus" : `${template.name} Variation`,
    subtitle: `Ähnlich wie ${template.name}`,
    image: PLAYLIST_IMAGES[index % PLAYLIST_IMAGES.length],
    exercises: Math.max(5, template.totalExercises),
    sets: Math.max(12, template.totalSets),
    minutes: estimateMinutes(template.totalSets),
  }));

  return [
    ...mapped,
    {
      id: "fallback-push",
      title: "Push Day intensives Volumen",
      subtitle: "Ähnlich wie Push Day",
      image: "/brand/gym-hero.png",
      exercises: 7,
      sets: 22,
      minutes: 70,
    },
    {
      id: "fallback-back",
      title: "Rücken Fokus",
      subtitle: "Ähnlich wie Pull Day",
      image: "/brand/playlist-hero.png",
      exercises: 6,
      sets: 18,
      minutes: 60,
    },
    {
      id: "fallback-legs",
      title: "Beine Power",
      subtitle: "Ähnlich wie Leg Day",
      image: "/brand/profile-cover.png",
      exercises: 6,
      sets: 20,
      minutes: 65,
    },
  ].slice(0, 5);
}

function estimateMinutes(sets: number) {
  return Math.max(35, Math.round(sets * 3.2));
}

function shortCount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  return String(value);
}
