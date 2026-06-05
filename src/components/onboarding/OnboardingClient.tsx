"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Activity, Dumbbell, Flame, Goal, Scale, Timer, Trophy } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { AuthOptions } from "@/components/onboarding/AuthOptions";
import { ChoiceCard } from "@/components/onboarding/ChoiceCard";
import { OnboardingStep } from "@/components/onboarding/OnboardingStep";
import { ProgressHeader } from "@/components/onboarding/ProgressHeader";
import {
  DEFAULT_ONBOARDING_DATA,
  FALLBACK_TEMPLATES,
  INTERESTS,
  TRAINING_GOALS,
  TRAINING_SPLITS,
  loadOnboardingData,
  saveOnboardingData,
  type OnboardingData,
  type TrainingGoal,
  type TrainingSplit,
} from "@/lib/onboarding";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkoutRecommendationCard, type WorkoutRecommendation } from "@/components/onboarding/WorkoutRecommendationCard";

const TOTAL_STEPS = 9;
const DURATIONS = [30, 45, 60, 90];
const FREQUENCIES = [2, 3, 4, 5, 6];

export function OnboardingClient() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const { locale } = useAppPreferences();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(DEFAULT_ONBOARDING_DATA);
  const [loaded, setLoaded] = useState(false);
  const copy = useMemo(() => text[locale], [locale]);

  const communityRecommendations = useQuery(
    api.workouts.listOnboardingRecommendations,
    step >= 7
      ? {
          durationMinutes: data.desiredWorkoutDurationMinutes,
          trainingGoals: data.trainingGoals,
          preferredSplit: data.preferredSplit,
          interests: data.interests,
          limit: 6,
        }
      : "skip"
  );

  useEffect(() => {
    setData(loadOnboardingData());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveOnboardingData(data);
  }, [data, loaded]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    router.replace("/onboarding/complete");
  }, [isLoaded, isSignedIn, router]);

  function update(patch: Partial<OnboardingData>) {
    setData((current) => ({ ...current, ...patch }));
  }

  function next() {
    setStep((current) => Math.min(TOTAL_STEPS - 1, current + 1));
  }

  function back() {
    setStep((current) => Math.max(0, current - 1));
  }

  function toggleInterest(value: string) {
    update({
      interests: data.interests.includes(value)
        ? data.interests.filter((interest) => interest !== value)
        : [...data.interests, value],
    });
  }

  function toggleTemplate(workout: WorkoutRecommendation) {
    if (workout.kind === "community") {
      update({
        selectedCommunityTemplateIds: data.selectedCommunityTemplateIds.includes(workout.id)
          ? data.selectedCommunityTemplateIds.filter((id) => id !== workout.id)
          : [...data.selectedCommunityTemplateIds, workout.id],
      });
      return;
    }
    update({
      selectedPresetIds: data.selectedPresetIds.includes(workout.id)
        ? data.selectedPresetIds.filter((id) => id !== workout.id)
        : [...data.selectedPresetIds, workout.id],
    });
  }

  function toggleGoal(goal: TrainingGoal) {
    const selected = data.trainingGoals.includes(goal);
    const nextGoals = selected
      ? data.trainingGoals.filter((entry) => entry !== goal)
      : [...data.trainingGoals, goal].slice(0, 2);
    update({ trainingGoals: nextGoals, trainingGoal: nextGoals[0] });
  }

  const fallbackRecommendations = useMemo(() => {
    return [...FALLBACK_TEMPLATES]
      .map((template) => ({
        template,
        score:
          (data.desiredWorkoutDurationMinutes ? Math.max(0, 30 - Math.abs(template.durationMinutes - data.desiredWorkoutDurationMinutes)) : 0) +
          (data.trainingGoals.includes(template.trainingGoal) ? 20 : 0) +
          (data.preferredSplit === template.split ? 20 : 0) +
          data.interests.filter((interest) => template.tags.includes(interest)).length * 8,
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ template }) => template);
  }, [data.desiredWorkoutDurationMinutes, data.interests, data.preferredSplit, data.trainingGoals]);

  const communityWorkouts: WorkoutRecommendation[] = (communityRecommendations ?? []).map((workout) => ({
    id: workout.id,
    kind: "community",
    title: workout.title,
    description: workout.description,
    durationMinutes: workout.durationMinutes,
    trainingGoal: workout.trainingGoal,
    split: workout.split,
    totalExercises: workout.totalExercises,
    saves: workout.saves,
    repeats: workout.repeats,
    durationRangeMinutes: workout.durationRangeMinutes ?? undefined,
    repeatSamples: workout.repeatSamples ?? [],
    creator: workout.creator,
    tags: workout.tags,
  }));

  const fallbackWorkouts: WorkoutRecommendation[] = fallbackRecommendations.map((workout) => ({
    id: workout.id,
    kind: workout.kind,
    title: workout.title,
    description: workout.description,
    durationMinutes: workout.durationMinutes,
    trainingGoal: workout.trainingGoal,
    split: workout.split,
    totalExercises: workout.totalExercises,
    saves: workout.saves,
    repeats: workout.repeats,
    creator: workout.creator,
    tags: workout.tags,
  }));

  const selectedCount = data.selectedCommunityTemplateIds.length + data.selectedPresetIds.length;

  if (!loaded) {
    return <div className="min-h-dvh bg-background" />;
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <ProgressHeader step={step + 1} total={TOTAL_STEPS} title={copy.progress} onBack={step > 0 ? back : undefined} />

      {step === 0 && (
        <OnboardingStep
          eyebrow="GymLogs"
          title={copy.welcomeTitle}
          description={copy.welcomeCopy}
          footer={
            <div className="grid gap-2">
              <Button type="button" className="h-12 w-full text-base" onClick={next}>
                {copy.start}
              </Button>
              <Link href="/sign-in">
                <Button type="button" variant="outline" className="h-12 w-full text-base">
                  {copy.haveAccount}
                </Button>
              </Link>
            </div>
          }
        >
          <div className="grid gap-3">
            <HeroStat icon={Dumbbell} title={copy.heroTrack} />
            <HeroStat icon={Trophy} title={copy.heroFlex} />
            <HeroStat icon={Activity} title={copy.heroFind} />
          </div>
        </OnboardingStep>
      )}

      {step === 1 && (
        <OnboardingStep
          eyebrow={copy.required}
          title={copy.nameTitle}
          description={copy.nameCopy}
          footer={
            <Button type="button" className="h-12 w-full text-base" disabled={!data.name.trim()} onClick={next}>
              {copy.next}
            </Button>
          }
        >
          <Input
            autoFocus
            className="h-14 rounded-lg text-lg"
            value={data.name}
            placeholder={copy.namePlaceholder}
            onChange={(event) => update({ name: event.target.value })}
          />
        </OnboardingStep>
      )}

      {step === 2 && (
        <OnboardingStep
          eyebrow={copy.basicData}
          title={copy.bodyTitle}
          description={copy.bodyCopy}
          footer={<StepFooter skip={copy.skip} next={copy.next} onSkip={next} onNext={next} />}
        >
          <Field label={copy.age}>
            <Input type="number" inputMode="numeric" className="h-12" value={data.age ?? ""} onChange={(event) => update({ age: numberOrUndefined(event.target.value) })} />
          </Field>
          <Field label={copy.weight}>
            <Input type="number" inputMode="decimal" className="h-12" value={data.weightKg ?? ""} onChange={(event) => update({ weightKg: numberOrUndefined(event.target.value) })} />
          </Field>
        </OnboardingStep>
      )}

      {step === 3 && (
        <OnboardingStep
          eyebrow={copy.basicData}
          title={copy.frequencyTitle}
          description={copy.frequencyCopy}
          footer={<StepFooter skip={copy.skip} next={copy.next} onSkip={next} onNext={next} />}
        >
          <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3">
            {FREQUENCIES.map((frequency) => (
              <ChoiceCard
                key={frequency}
                title={`${frequency}x`}
                description={copy.perWeek}
                selected={data.trainingFrequencyPerWeek === frequency}
                icon={Flame}
                onClick={() => update({ trainingFrequencyPerWeek: frequency })}
              />
            ))}
          </div>
        </OnboardingStep>
      )}

      {step === 4 && (
        <OnboardingStep
          eyebrow={copy.basicData}
          title={copy.durationTitle}
          description={copy.durationCopy}
          footer={<StepFooter skip={copy.skip} next={copy.next} onSkip={next} onNext={next} />}
        >
          <div className="grid grid-cols-2 gap-2">
            {DURATIONS.map((duration) => (
              <ChoiceCard
                key={duration}
                title={`${duration} min`}
                description={copy.perSession}
                selected={data.desiredWorkoutDurationMinutes === duration}
                icon={Timer}
                onClick={() => update({ desiredWorkoutDurationMinutes: duration })}
              />
            ))}
          </div>
        </OnboardingStep>
      )}

      {step === 5 && (
        <OnboardingStep
          eyebrow={copy.optional}
          title={copy.goalTitle}
          description={copy.goalCopy}
          footer={<StepFooter skip={copy.skip} next={copy.next} onSkip={next} onNext={next} />}
        >
          <p className="rounded-lg border border-border bg-muted/25 p-3 text-sm leading-6 text-muted-foreground">
            {copy.goalLimit}
          </p>
          <div className="grid gap-2">
            {TRAINING_GOALS.map((goal) => (
              <ChoiceCard
                key={goal.value}
                title={locale === "de" ? goal.labelDe : goal.labelEn}
                selected={data.trainingGoals.includes(goal.value)}
                icon={Goal}
                onClick={() => toggleGoal(goal.value as TrainingGoal)}
              />
            ))}
          </div>
          <div className="pt-3">
            <p className="mb-2 text-sm font-semibold text-muted-foreground">{copy.splitTitle}</p>
            <div className="grid gap-2">
              {TRAINING_SPLITS.map((split) => (
                <ChoiceCard
                  key={split.value}
                  title={locale === "de" ? split.labelDe : split.labelEn}
                  description={splitRecommendation(split.value as TrainingSplit, data, locale)}
                  selected={data.preferredSplit === split.value}
                  icon={Scale}
                  onClick={() => update({ preferredSplit: split.value as TrainingSplit })}
                />
              ))}
            </div>
          </div>
        </OnboardingStep>
      )}

      {step === 6 && (
        <OnboardingStep
          eyebrow={copy.optional}
          title={copy.interestsTitle}
          description={copy.interestsCopy}
          footer={<StepFooter skip={copy.skip} next={copy.next} onSkip={next} onNext={next} />}
        >
          <div className="grid grid-cols-2 gap-2">
            {INTERESTS.map((interest) => (
              <ChoiceCard
                key={interest.value}
                title={locale === "de" ? interest.labelDe : interest.labelEn}
                selected={data.interests.includes(interest.value)}
                onClick={() => toggleInterest(interest.value)}
              />
            ))}
          </div>
        </OnboardingStep>
      )}

      {step === 7 && (
        <OnboardingStep
          eyebrow={copy.playlists}
          title={copy.playlistTitle}
          description={copy.playlistCopy}
          footer={
            <div className="grid gap-2">
              <Button type="button" className="h-12 w-full text-base" onClick={next}>
                {selectedCount > 0 ? copy.continueWithSelection(selectedCount) : copy.skipRecommendations}
              </Button>
            </div>
          }
        >
          {communityRecommendations === undefined ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">{copy.loadingRecommendations}</div>
          ) : communityWorkouts.length > 0 ? (
            <>
              <SectionTitle title={copy.communityTitle} />
              {communityWorkouts.map((workout) => (
                <WorkoutRecommendationCard
                  key={workout.id}
                  workout={workout}
                  saved={data.selectedCommunityTemplateIds.includes(workout.id)}
                  viewLabel={copy.view}
                  saveLabel={copy.saveToProfile}
                  savedLabel={copy.saved}
                  exerciseLabel={copy.exercises}
                  savedStatLabel={copy.savedStat}
                  repeatStatLabel={copy.repeatStat}
                  approxLabel={copy.approx}
                  variableTimeLabel={copy.variableTime}
                  goalLabel={copy.goalBadge}
                  splitLabel={copy.splitBadge}
                  formatGoal={(goal) => labelForGoal(goal, locale)}
                  formatSplit={(split) => labelForSplit(split, locale)}
                  onSave={() => toggleTemplate(workout)}
                />
              ))}
            </>
          ) : (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">{copy.noCommunity}</div>
          )}
          <SectionTitle title={copy.gymlogsTitle} />
          {fallbackWorkouts.map((workout) => (
            <WorkoutRecommendationCard
              key={workout.id}
              workout={workout}
              saved={data.selectedPresetIds.includes(workout.id)}
              viewLabel={copy.view}
              saveLabel={copy.saveToProfile}
              savedLabel={copy.saved}
              exerciseLabel={copy.exercises}
              savedStatLabel={copy.savedStat}
              repeatStatLabel={copy.repeatStat}
              approxLabel={copy.approx}
              variableTimeLabel={copy.variableTime}
              goalLabel={copy.goalBadge}
              splitLabel={copy.splitBadge}
              formatGoal={(goal) => labelForGoal(goal, locale)}
              formatSplit={(split) => labelForSplit(split, locale)}
              onSave={() => toggleTemplate(workout)}
            />
          ))}
        </OnboardingStep>
      )}

      {step === 8 && (
        <OnboardingStep
          eyebrow={copy.required}
          title={copy.authStepTitle}
          description={copy.authStepCopy}
          footer={
            <Link href="/sign-in">
              <Button type="button" variant="outline" className="h-12 w-full text-base">
                {copy.haveAccount}
              </Button>
            </Link>
          }
        >
          <AuthOptions
            title={copy.authTitle}
            description={copy.authCopy}
            emailLabel={copy.emailSignup}
            googleLabel={copy.googleSignup}
            appleLabel={copy.appleSignup}
          />
        </OnboardingStep>
      )}
    </div>
  );
}

function StepFooter({
  skip,
  next,
  onSkip,
  onNext,
}: {
  skip: string;
  next: string;
  onSkip: () => void;
  onNext: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" variant="outline" className="h-12 text-base" onClick={onSkip}>
        {skip}
      </Button>
      <Button type="button" className="h-12 text-base" onClick={onNext}>
        {next}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="pt-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">{title}</h2>;
}

function HeroStat({ icon: Icon, title }: { icon: typeof Dumbbell; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <p className="font-semibold text-foreground">{title}</p>
    </div>
  );
}

function numberOrUndefined(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function labelForGoal(goal: string, locale: "de" | "en") {
  const match = TRAINING_GOALS.find((entry) => entry.value === goal);
  return match ? (locale === "de" ? match.labelDe : match.labelEn) : goal;
}

function labelForSplit(split: string, locale: "de" | "en") {
  const match = TRAINING_SPLITS.find((entry) => entry.value === split);
  return match ? (locale === "de" ? match.labelDe : match.labelEn) : split;
}

function splitRecommendation(split: TrainingSplit, data: OnboardingData, locale: "de" | "en") {
  const days = data.trainingFrequencyPerWeek;
  const duration = data.desiredWorkoutDurationMinutes;
  const goals = data.trainingGoals;
  const isStrength = goals.includes("strength");
  const isMuscle = goals.includes("muscle_gain");
  const isFatLoss = goals.includes("fat_loss");

  if (locale === "en") {
    if (split === "full_body") {
      if (!days || days <= 3) return "Recommended for 2-3 days per week or short, simple routines.";
      return "Good when you want fewer sessions with a lot of coverage.";
    }
    if (split === "upper_lower") {
      if (days && days >= 4) return "Recommended for 4 days per week, balanced strength and muscle gain.";
      return "Works well once you train at least 3 focused days.";
    }
    if (duration && duration < 45) return "Usually better with 45-90 minutes per session.";
    if (isMuscle || isStrength) return "Recommended for muscle gain or strength with 5-6 training days.";
    return isFatLoss ? "Useful if you like frequent, focused sessions." : "Best when you train often and enjoy specific days.";
  }

  if (split === "full_body") {
    if (!days || days <= 3) return "Empfohlen bei 2-3 Tagen pro Woche oder wenn es simpel bleiben soll.";
    return "Gut, wenn du weniger Einheiten mit viel Abdeckung willst.";
  }
  if (split === "upper_lower") {
    if (days && days >= 4) return "Empfohlen bei 4 Tagen pro Woche, ausgewogen für Kraft und Muskelaufbau.";
    return "Passt gut, sobald du mindestens 3 fokussierte Tage trainierst.";
  }
  if (duration && duration < 45) return "Meist besser mit 45-90 Minuten pro Einheit.";
  if (isMuscle || isStrength) return "Empfohlen für Muskelaufbau oder Kraft bei 5-6 Trainingstagen.";
  return isFatLoss ? "Sinnvoll, wenn du häufige, fokussierte Einheiten magst." : "Am besten, wenn du oft trainierst und klare Tage magst.";
}

const text = {
  de: {
    progress: "Onboarding",
    welcomeTitle: "Baue dein Training so auf, dass du es gern trackst.",
    welcomeCopy: "GymLogs verbindet schnelle Workouts, Profil-Flex und echte Log-Scores. Wir richten dir in wenigen Schritten einen passenden Start ein.",
    start: "Loslegen",
    haveAccount: "Ich habe schon einen Account",
    heroTrack: "Workouts sauber tracken",
    heroFlex: "Fortschritt im Profil zeigen",
    heroFind: "Passende Pläne finden",
    required: "Pflicht",
    optional: "Optional",
    basicData: "Basisdaten",
    nameTitle: "Wie sollen wir dich nennen?",
    nameCopy: "Ein Name oder Nickname reicht. Alles andere kannst du später anpassen.",
    namePlaceholder: "Name oder Nickname",
    next: "Weiter",
    skip: "Überspringen",
    bodyTitle: "Ein paar Basics für bessere Vorschläge.",
    bodyCopy: "Alter und Gewicht helfen später bei Profil- und Trainingssignalen. Du kannst beides überspringen.",
    age: "Alter",
    weight: "Gewicht in kg",
    frequencyTitle: "Wie oft willst du pro Woche trainieren?",
    frequencyCopy: "Wir nutzen das, um Pläne realistisch zu priorisieren.",
    perWeek: "pro Woche",
    durationTitle: "Wie lang soll eine Einheit dauern?",
    durationCopy: "Die Empfehlungen orientieren sich an dieser Dauer.",
    perSession: "pro Einheit",
    goalTitle: "Was ist dein Ziel?",
    goalCopy: "Optional, aber sehr hilfreich für bessere Workout-Playlists.",
    goalLimit: "Wähle bis zu 2 Ziele aus. So bleiben die Empfehlungen fokussiert.",
    splitTitle: "Bevorzugter Split",
    interestsTitle: "Was interessiert dich?",
    interestsCopy: "Wähle alles aus, was zu dir passt. Du kannst den Schritt überspringen.",
    playlists: "Workout-Playlists",
    playlistTitle: "Das könnte zu dir passen.",
    playlistCopy: "Erst Community-Playlists, danach GymLogs-Templates als sicherer Startpunkt.",
    loadingRecommendations: "Community-Playlists werden geladen...",
    communityTitle: "Community",
    gymlogsTitle: "GymLogs Templates",
    noCommunity: "Noch keine passenden Community-Playlists gefunden. Die App-Templates springen ein.",
    view: "Ansehen",
    saveToProfile: "In Profil speichern",
    saved: "Gespeichert",
    exercises: "Übungen",
    savedStat: "gespeichert",
    repeatStat: "absolviert",
    approx: "ca.",
    variableTime: "Dauer variiert je nach Pausen und Tempo",
    goalBadge: "Ziel",
    splitBadge: "Split",
    continueWithSelection: (count: number) => `${count} Auswahl speichern und Account erstellen`,
    skipRecommendations: "Ohne Auswahl Account erstellen",
    authStepTitle: "Fast fertig. Sichere deinen Start.",
    authStepCopy: "Erstelle jetzt deinen Account. Danach übernehmen wir deine Antworten und gespeicherten Playlists automatisch.",
    authTitle: "Account erstellen",
    authCopy: "Nach der Registrierung speichern wir deine Eingaben und ausgewählten Playlists in deinem Profil.",
    emailSignup: "E-Mail + Passwort",
    googleSignup: "Mit Google fortfahren",
    appleSignup: "Mit Apple fortfahren",
  },
  en: {
    progress: "Onboarding",
    welcomeTitle: "Build training you actually want to track.",
    welcomeCopy: "GymLogs combines fast workout logging, profile flex, and verified log scores. We will set up a strong start in a few steps.",
    start: "Get started",
    haveAccount: "I already have an account",
    heroTrack: "Track workouts cleanly",
    heroFlex: "Show progress on your profile",
    heroFind: "Find matching plans",
    required: "Required",
    optional: "Optional",
    basicData: "Basics",
    nameTitle: "What should we call you?",
    nameCopy: "A name or nickname is enough. You can change everything later.",
    namePlaceholder: "Name or nickname",
    next: "Next",
    skip: "Skip",
    bodyTitle: "A few basics for better suggestions.",
    bodyCopy: "Age and weight help later with profile and training signals. You can skip both.",
    age: "Age",
    weight: "Weight in kg",
    frequencyTitle: "How often do you want to train?",
    frequencyCopy: "We use this to prioritize realistic plans.",
    perWeek: "per week",
    durationTitle: "How long should a session take?",
    durationCopy: "Recommendations will be tuned around this duration.",
    perSession: "per session",
    goalTitle: "What is your goal?",
    goalCopy: "Optional, but useful for better workout playlists.",
    goalLimit: "Pick up to 2 goals. This keeps recommendations focused.",
    splitTitle: "Preferred split",
    interestsTitle: "What are you into?",
    interestsCopy: "Pick anything that fits. You can skip this step.",
    playlists: "Workout playlists",
    playlistTitle: "These should fit you.",
    playlistCopy: "Community playlists first, then GymLogs templates as a reliable fallback.",
    loadingRecommendations: "Loading community playlists...",
    communityTitle: "Community",
    gymlogsTitle: "GymLogs templates",
    noCommunity: "No matching community playlists yet. App templates are ready instead.",
    view: "View",
    saveToProfile: "Save to profile",
    saved: "Saved",
    exercises: "exercises",
    savedStat: "saved",
    repeatStat: "completed",
    approx: "approx.",
    variableTime: "Duration varies by rest times and pace",
    goalBadge: "Goal",
    splitBadge: "Split",
    continueWithSelection: (count: number) => `Save ${count} and create account`,
    skipRecommendations: "Create account without picks",
    authStepTitle: "Almost done. Save your start.",
    authStepCopy: "Create your account now. After that we apply your answers and saved playlists automatically.",
    authTitle: "Create account",
    authCopy: "After registration we save your answers and selected playlists to your profile.",
    emailSignup: "Email + password",
    googleSignup: "Continue with Google",
    appleSignup: "Continue with Apple",
  },
};
