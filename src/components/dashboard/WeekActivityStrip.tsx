import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

type DayBucket = { bucketStart: number; count: number };

interface WeekActivityStripProps {
  buckets: DayBucket[];
  className?: string;
}

/**
 * Compact 7-day habit-tracker strip. Each day shows one of three states:
 * inactive (grey dot), single workout (brand outline + dot), or multiple
 * workouts (filled brand pill with the number). Today is highlighted via
 * a non-muted weekday label so the user can locate themselves in the row.
 */
export function WeekActivityStrip({ buckets, className }: WeekActivityStripProps) {
  const todayIndex = (() => {
    const day = new Date().getDay();
    return (day + 6) % 7; // Monday = 0
  })();

  return (
    <div className={cn("grid grid-cols-7 gap-1.5 sm:gap-2", className)}>
      {buckets.slice(0, 7).map((bucket, idx) => {
        const count = bucket.count;
        const isToday = idx === todayIndex;
        return (
          <div
            key={bucket.bucketStart}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wider",
                isToday ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {WEEKDAY_LABELS[idx]}
            </span>
            <span
              aria-label={`${WEEKDAY_LABELS[idx]}: ${count} Workout${count === 1 ? "" : "s"}`}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors sm:h-9 sm:w-9",
                count === 0
                  ? "bg-muted/40 text-muted-foreground/40 ring-1 ring-inset ring-border/40"
                  : count === 1
                    ? "bg-brand/15 text-brand ring-1 ring-brand/40"
                    : "bg-brand text-brand-foreground shadow-sm",
                isToday && count === 0 && "ring-foreground/30"
              )}
            >
              {count === 0 ? (
                <span className="h-1 w-1 rounded-full bg-current opacity-60" />
              ) : count === 1 ? (
                <span className="h-2 w-2 rounded-full bg-current" />
              ) : (
                count
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
