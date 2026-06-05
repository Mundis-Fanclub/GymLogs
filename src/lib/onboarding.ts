export const ONBOARDING_STORAGE_KEY = "gymlogs-onboarding-v1";

export type TrainingGoal = "muscle_gain" | "strength" | "fat_loss" | "general_fitness";
export type TrainingSplit = "full_body" | "upper_lower" | "push_pull_legs";
export type TrainingLevel = "beginner" | "intermediate" | "advanced";

export type OnboardingData = {
  name: string;
  age?: number;
  weightKg?: number;
  trainingFrequencyPerWeek?: number;
  desiredWorkoutDurationMinutes?: number;
  trainingGoals: TrainingGoal[];
  trainingGoal?: TrainingGoal;
  preferredSplit?: TrainingSplit;
  interests: string[];
  selectedCommunityTemplateIds: string[];
  selectedPresetIds: string[];
};

export type ProfileCompletionData = {
  bio?: string;
  heightCm?: number;
  favoriteLift?: string;
  location?: string;
  trainingLevel?: TrainingLevel;
};

export type OnboardingTemplate = {
  id: string;
  kind: "preset";
  title: string;
  description: string;
  durationMinutes: number;
  trainingGoal: TrainingGoal;
  split: TrainingSplit;
  totalExercises: number;
  saves: number;
  repeats: number;
  creator: {
    name: string;
    username?: string;
  };
  tags: string[];
};

export const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  name: "",
  trainingGoals: [],
  interests: [],
  selectedCommunityTemplateIds: [],
  selectedPresetIds: [],
};

export const TRAINING_GOALS = [
  { value: "muscle_gain", labelDe: "Muskelaufbau", labelEn: "Muscle gain" },
  { value: "strength", labelDe: "Kraft", labelEn: "Strength" },
  { value: "fat_loss", labelDe: "Abnehmen", labelEn: "Fat loss" },
  { value: "general_fitness", labelDe: "Allgemeine Fitness", labelEn: "General fitness" },
] as const;

export const TRAINING_SPLITS = [
  { value: "full_body", labelDe: "Ganzkörper", labelEn: "Full body" },
  { value: "upper_lower", labelDe: "Oberkörper/Unterkörper", labelEn: "Upper/lower" },
  { value: "push_pull_legs", labelDe: "Push/Pull/Legs", labelEn: "Push/pull/legs" },
] as const;

export const TRAINING_LEVELS = [
  { value: "beginner", labelDe: "Anfänger", labelEn: "Beginner" },
  { value: "intermediate", labelDe: "Fortgeschritten", labelEn: "Intermediate" },
  { value: "advanced", labelDe: "Sehr erfahren", labelEn: "Advanced" },
] as const;

export const INTERESTS = [
  { value: "strength", labelDe: "Krafttraining", labelEn: "Strength training" },
  { value: "bodybuilding", labelDe: "Bodybuilding", labelEn: "Bodybuilding" },
  { value: "powerlifting", labelDe: "Powerlifting", labelEn: "Powerlifting" },
  { value: "calisthenics", labelDe: "Calisthenics", labelEn: "Calisthenics" },
  { value: "fat_loss", labelDe: "Abnehmen", labelEn: "Fat loss" },
  { value: "mobility", labelDe: "Mobility", labelEn: "Mobility" },
  { value: "beginner", labelDe: "Anfängerfreundlich", labelEn: "Beginner friendly" },
  { value: "short", labelDe: "Kurze Workouts", labelEn: "Short workouts" },
  { value: "gym", labelDe: "Gym Workouts", labelEn: "Gym workouts" },
  { value: "home", labelDe: "Home Workouts", labelEn: "Home workouts" },
] as const;

export const FALLBACK_TEMPLATES: OnboardingTemplate[] = [
  {
    id: "full_body_beginner",
    kind: "preset",
    title: "Ganzkörper Anfänger",
    description: "Ein ruhiger Einstieg mit Grundübungen für den ganzen Körper.",
    durationMinutes: 45,
    trainingGoal: "general_fitness",
    split: "full_body",
    totalExercises: 5,
    saves: 0,
    repeats: 0,
    creator: { name: "GymLogs" },
    tags: ["beginner", "gym", "strength"],
  },
  {
    id: "upper_60",
    kind: "preset",
    title: "Oberkörper 60 Min",
    description: "Brust, Rücken, Schultern und Arme in einer fokussierten Einheit.",
    durationMinutes: 60,
    trainingGoal: "muscle_gain",
    split: "upper_lower",
    totalExercises: 6,
    saves: 0,
    repeats: 0,
    creator: { name: "GymLogs" },
    tags: ["gym", "bodybuilding", "upper"],
  },
  {
    id: "lower_60",
    kind: "preset",
    title: "Unterkörper 60 Min",
    description: "Solide Unterkörper-Einheit mit Squat-Fokus und Zubehör.",
    durationMinutes: 60,
    trainingGoal: "strength",
    split: "upper_lower",
    totalExercises: 5,
    saves: 0,
    repeats: 0,
    creator: { name: "GymLogs" },
    tags: ["gym", "legs", "strength"],
  },
  {
    id: "push_day",
    kind: "preset",
    title: "Push Day",
    description: "Drücken für Brust, Schultern und Trizeps.",
    durationMinutes: 60,
    trainingGoal: "muscle_gain",
    split: "push_pull_legs",
    totalExercises: 5,
    saves: 0,
    repeats: 0,
    creator: { name: "GymLogs" },
    tags: ["push", "gym", "bodybuilding"],
  },
  {
    id: "pull_day",
    kind: "preset",
    title: "Pull Day",
    description: "Rücken und Bizeps mit starkem Zug-Fokus.",
    durationMinutes: 60,
    trainingGoal: "muscle_gain",
    split: "push_pull_legs",
    totalExercises: 5,
    saves: 0,
    repeats: 0,
    creator: { name: "GymLogs" },
    tags: ["pull", "gym", "bodybuilding"],
  },
  {
    id: "leg_day",
    kind: "preset",
    title: "Leg Day",
    description: "Beine schwer, sauber und gut strukturiert.",
    durationMinutes: 60,
    trainingGoal: "strength",
    split: "push_pull_legs",
    totalExercises: 5,
    saves: 0,
    repeats: 0,
    creator: { name: "GymLogs" },
    tags: ["legs", "gym", "powerlifting"],
  },
  {
    id: "short_30",
    kind: "preset",
    title: "Kurzes 30-Minuten-Workout",
    description: "Kurze, dichte Einheit für Tage mit wenig Zeit.",
    durationMinutes: 30,
    trainingGoal: "general_fitness",
    split: "full_body",
    totalExercises: 4,
    saves: 0,
    repeats: 0,
    creator: { name: "GymLogs" },
    tags: ["short", "beginner", "home"],
  },
];

export function loadOnboardingData(): OnboardingData {
  if (typeof window === "undefined") return DEFAULT_ONBOARDING_DATA;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return DEFAULT_ONBOARDING_DATA;
    const parsed = { ...DEFAULT_ONBOARDING_DATA, ...JSON.parse(raw) } as OnboardingData;
    if (!parsed.trainingGoals.length && parsed.trainingGoal) {
      parsed.trainingGoals = [parsed.trainingGoal];
    }
    return parsed;
  } catch {
    return DEFAULT_ONBOARDING_DATA;
  }
}

export function saveOnboardingData(data: OnboardingData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data));
}

export function clearOnboardingData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
}
