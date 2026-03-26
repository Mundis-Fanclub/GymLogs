export function estimated1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

export type SetData = {
  weight: number;
  reps: number;
  rir?: number;
};

export type PRResult = {
  heaviestWeight: number;
  best1RM: number;
  highestVolume: number;
  mostRepsAtWeight: Array<{ weight: number; reps: number }>;
};

export function computePRs(sets: SetData[]): PRResult | null {
  if (sets.length === 0) return null;

  let heaviestWeight = 0;
  let best1RM = 0;
  let highestVolume = 0;
  const repsByWeight = new Map<number, number>();

  for (const set of sets) {
    if (set.weight > heaviestWeight) heaviestWeight = set.weight;
    const e1rm = estimated1RM(set.weight, set.reps);
    if (e1rm > best1RM) best1RM = e1rm;
    const vol = set.weight * set.reps;
    if (vol > highestVolume) highestVolume = vol;
    const existing = repsByWeight.get(set.weight) ?? 0;
    if (set.reps > existing) repsByWeight.set(set.weight, set.reps);
  }

  return {
    heaviestWeight,
    best1RM: Math.round(best1RM * 10) / 10,
    highestVolume,
    mostRepsAtWeight: Array.from(repsByWeight.entries()).map(
      ([weight, reps]) => ({ weight, reps })
    ),
  };
}

export type PRCheck = {
  isHeaviest: boolean;
  isBest1RM: boolean;
  isMostReps: boolean;
};

export function checkIsPR(
  existingPRs: PRResult | null,
  weight: number,
  reps: number
): PRCheck {
  if (!existingPRs) {
    return { isHeaviest: true, isBest1RM: true, isMostReps: true };
  }

  const maxRepsAtThisWeight =
    existingPRs.mostRepsAtWeight.find((m) => m.weight === weight)?.reps ?? 0;

  return {
    isHeaviest: weight >= existingPRs.heaviestWeight,
    isBest1RM: estimated1RM(weight, reps) >= existingPRs.best1RM,
    isMostReps: reps > maxRepsAtThisWeight,
  };
}

export function formatWeight(weight: number): string {
  return weight % 1 === 0 ? `${weight}` : `${weight.toFixed(1)}`;
}

export function formatVolume(volume: number): string {
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`;
  return `${Math.round(volume)}`;
}
