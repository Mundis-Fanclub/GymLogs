"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Camera, Dumbbell, MapPin, Ruler, UserRound } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ChoiceCard } from "@/components/onboarding/ChoiceCard";
import { OnboardingStep } from "@/components/onboarding/OnboardingStep";
import { ProgressHeader } from "@/components/onboarding/ProgressHeader";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { useConvexUser } from "@/hooks/useConvexUser";
import {
  DEFAULT_ONBOARDING_DATA,
  TRAINING_LEVELS,
  clearOnboardingData,
  loadOnboardingData,
  saveOnboardingData,
  type OnboardingData,
  type ProfileCompletionData,
  type TrainingLevel,
} from "@/lib/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function OnboardingCompleteClient() {
  const router = useRouter();
  const { locale } = useAppPreferences();
  const { userId, convexUser, isLoaded } = useConvexUser();
  const applyOnboarding = useMutation(api.users.applyOnboarding);
  const saveRecommendedTemplate = useMutation(api.workouts.saveRecommendedTemplate);
  const generateProfileUploadUrl = useMutation(api.users.generateProfileUploadUrl);
  const [data, setData] = useState<OnboardingData>(DEFAULT_ONBOARDING_DATA);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [profile, setProfile] = useState<ProfileCompletionData>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [syncState, setSyncState] = useState<"loading" | "syncing" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const appliedRef = useRef(false);
  const copy = useMemo(() => text[locale], [locale]);

  useEffect(() => {
    setData(loadOnboardingData());
    setDataLoaded(true);
  }, []);

  useEffect(() => {
    if (!dataLoaded || !isLoaded || !userId || appliedRef.current) return;
    appliedRef.current = true;
    setSyncState("syncing");

    async function sync() {
      if (!userId) return;
      try {
        await applyOnboarding({
          userId,
          name: data.name || convexUser?.name || "GymLogs User",
          age: data.age,
          weightKg: data.weightKg,
          trainingFrequencyPerWeek: data.trainingFrequencyPerWeek,
          desiredWorkoutDurationMinutes: data.desiredWorkoutDurationMinutes,
          trainingGoal: data.trainingGoal,
          trainingGoals: data.trainingGoals,
          preferredSplit: data.preferredSplit,
          onboardingInterests: data.interests,
        });

        for (const templateId of data.selectedCommunityTemplateIds) {
          await saveRecommendedTemplate({ userId, templateId: templateId as Id<"workout_templates"> });
        }
        for (const presetId of data.selectedPresetIds) {
          await saveRecommendedTemplate({ userId, presetId });
        }

        saveOnboardingData({
          ...data,
          selectedCommunityTemplateIds: [],
          selectedPresetIds: [],
        });
        setSyncState("ready");
      } catch (syncError) {
        setError(syncError instanceof Error ? syncError.message : copy.genericError);
        setSyncState("error");
      }
    }

    void sync();
  }, [applyOnboarding, convexUser?.name, copy.genericError, data, dataLoaded, isLoaded, saveRecommendedTemplate, userId]);

  async function finish(skipProfile: boolean) {
    if (!userId) return;
    try {
      setSyncState("syncing");
      let avatarStorageId: Id<"_storage"> | undefined;
      if (!skipProfile && avatarFile) {
        const uploadUrl = await generateProfileUploadUrl({ userId, kind: "avatar" });
        const upload = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": avatarFile.type },
          body: avatarFile,
        });
        if (!upload.ok) throw new Error(copy.uploadError);
        const result = (await upload.json()) as { storageId: Id<"_storage"> };
        avatarStorageId = result.storageId;
      }

      await applyOnboarding({
        userId,
        name: data.name || convexUser?.name || "GymLogs User",
        age: data.age,
        weightKg: data.weightKg,
        trainingFrequencyPerWeek: data.trainingFrequencyPerWeek,
        desiredWorkoutDurationMinutes: data.desiredWorkoutDurationMinutes,
        trainingGoal: data.trainingGoal,
        trainingGoals: data.trainingGoals,
        preferredSplit: data.preferredSplit,
        onboardingInterests: data.interests,
        avatarStorageId,
        bio: skipProfile ? undefined : profile.bio,
        heightCm: skipProfile ? undefined : profile.heightCm,
        favoriteLift: skipProfile ? undefined : profile.favoriteLift,
        location: skipProfile ? undefined : profile.location,
        trainingLevel: skipProfile ? undefined : profile.trainingLevel,
      });

      clearOnboardingData();
      router.replace("/dashboard");
    } catch (finishError) {
      setError(finishError instanceof Error ? finishError.message : copy.genericError);
      setSyncState("error");
    }
  }

  if (!dataLoaded || syncState === "loading" || syncState === "syncing") {
    return (
      <div className="min-h-dvh bg-background text-foreground">
        <ProgressHeader step={9} total={9} title={copy.progress} />
        <OnboardingStep eyebrow="GymLogs" title={copy.syncTitle} description={copy.syncCopy}>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
          </div>
        </OnboardingStep>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <ProgressHeader step={9} total={9} title={copy.progress} />
      <OnboardingStep
        eyebrow={copy.optional}
        title={copy.title}
        description={copy.description}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="h-12 text-base" onClick={() => finish(true)}>
              {copy.skip}
            </Button>
            <Button type="button" className="h-12 text-base" onClick={() => finish(false)}>
              {copy.finish}
            </Button>
          </div>
        }
      >
        {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        <label className="flex min-h-20 cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-3 transition hover:bg-muted/40">
          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
            <Camera className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{copy.avatar}</span>
            <span className="mt-1 block truncate text-sm text-muted-foreground">{avatarFile?.name ?? copy.avatarHint}</span>
          </span>
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)} />
        </label>

        <Field label={copy.bio} icon={UserRound}>
          <Textarea rows={3} value={profile.bio ?? ""} onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))} />
        </Field>
        <Field label={copy.height} icon={Ruler}>
          <Input type="number" inputMode="numeric" className="h-12" value={profile.heightCm ?? ""} onChange={(event) => setProfile((current) => ({ ...current, heightCm: numberOrUndefined(event.target.value) }))} />
        </Field>
        <Field label={copy.favoriteLift} icon={Dumbbell}>
          <Input className="h-12" value={profile.favoriteLift ?? ""} onChange={(event) => setProfile((current) => ({ ...current, favoriteLift: event.target.value }))} />
        </Field>
        <Field label={copy.location} icon={MapPin}>
          <Input className="h-12" value={profile.location ?? ""} onChange={(event) => setProfile((current) => ({ ...current, location: event.target.value }))} />
        </Field>

        <div className="pt-2">
          <p className="mb-2 text-sm font-semibold text-muted-foreground">{copy.level}</p>
          <div className="grid gap-2">
            {TRAINING_LEVELS.map((level) => (
              <ChoiceCard
                key={level.value}
                title={locale === "de" ? level.labelDe : level.labelEn}
                selected={profile.trainingLevel === level.value}
                onClick={() => setProfile((current) => ({ ...current, trainingLevel: level.value as TrainingLevel }))}
              />
            ))}
          </div>
        </div>
      </OnboardingStep>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <label className="block rounded-lg border border-border bg-card p-3">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      {children}
    </label>
  );
}

function numberOrUndefined(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

const text = {
  de: {
    progress: "Onboarding",
    optional: "Optional",
    syncTitle: "Wir richten dein Profil ein.",
    syncCopy: "Deine Angaben und gespeicherten Playlists werden übernommen.",
    title: "Profil noch etwas abrunden?",
    description: "Diese Angaben sind freiwillig. Du kannst direkt starten oder dein Profil jetzt persönlicher machen.",
    avatar: "Profilbild",
    avatarHint: "Bild auswählen",
    bio: "Biografie",
    height: "Körpergröße in cm",
    favoriteLift: "Lieblingslift",
    location: "Ort / Gym",
    level: "Trainingslevel",
    skip: "Überspringen",
    finish: "Fertig",
    uploadError: "Profilbild konnte nicht hochgeladen werden.",
    genericError: "Onboarding konnte nicht gespeichert werden.",
  },
  en: {
    progress: "Onboarding",
    optional: "Optional",
    syncTitle: "Setting up your profile.",
    syncCopy: "Your answers and saved playlists are being applied.",
    title: "Want to round out your profile?",
    description: "These details are optional. Start right away or make the profile feel more like you.",
    avatar: "Profile picture",
    avatarHint: "Choose image",
    bio: "Biography",
    height: "Height in cm",
    favoriteLift: "Favorite lift",
    location: "Location / gym",
    level: "Training level",
    skip: "Skip",
    finish: "Finish",
    uploadError: "Profile picture could not be uploaded.",
    genericError: "Onboarding could not be saved.",
  },
};
