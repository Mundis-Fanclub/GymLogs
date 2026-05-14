export type MockLogEntry = {
  rank: number;
  athlete: string;
  exercise: string;
  score: number;
  lift: string;
  bodyweightClass: string;
  status: "verified" | "pending";
};

export const FEATURED_LOGS: MockLogEntry[] = [
  {
    rank: 1,
    athlete: "Luca M.",
    exercise: "Bench Press",
    score: 100,
    lift: "160 kg x 1",
    bodyweightClass: "-83 kg",
    status: "verified",
  },
  {
    rank: 2,
    athlete: "Eren K.",
    exercise: "Bench Press",
    score: 99,
    lift: "157.5 kg x 1",
    bodyweightClass: "-83 kg",
    status: "verified",
  },
  {
    rank: 3,
    athlete: "Noah S.",
    exercise: "Bench Press",
    score: 96,
    lift: "150 kg x 2",
    bodyweightClass: "-93 kg",
    status: "verified",
  },
  {
    rank: 11,
    athlete: "You",
    exercise: "Bench Press",
    score: 84,
    lift: "132.5 kg x 3",
    bodyweightClass: "-83 kg",
    status: "pending",
  },
];

export const PRODUCT_PILLARS = [
  {
    title: "Track fast",
    description: "Workout logging needs to stay frictionless and usable mid-set.",
  },
  {
    title: "Rank fairly",
    description: "Percentiles only make sense with brackets, exercise variants, and consent.",
  },
  {
    title: "Verify later",
    description: "Video and AI should upgrade trust, not block the first version from shipping.",
  },
];

export const PRICING_PLANS = [
  {
    name: "Free",
    price: "0 EUR",
    description: "Full workout tracking plus limited leaderboard browsing.",
    bullets: [
      "Workout logging, PR tracking, analytics",
      "One lightweight sponsored slot outside active workouts",
      "Community leaderboards with delayed refresh",
    ],
  },
  {
    name: "Pro",
    price: "4.99 EUR / month",
    description: "Ad-free, faster, and built for lifters who want more signal.",
    bullets: [
      "No ads anywhere in the app",
      "Priority video review and richer log insights",
      "Profile badges, advanced filters, export, compare tools",
    ],
  },
];

export const MVP_EXERCISES = [
  "Bench Press",
  "Squat",
  "Deadlift",
];
