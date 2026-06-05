"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProgressHeader({
  step,
  total,
  title,
  onBack,
}: {
  step: number;
  total: number;
  title: string;
  onBack?: () => void;
}) {
  const progress = Math.max(0, Math.min(100, (step / total) * 100));

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/92 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        {onBack ? (
          <Button type="button" size="icon-sm" variant="ghost" aria-label="Zurueck" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : (
          <div className="size-9 sm:size-7" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
            <span>{title}</span>
            <span>
              {step}/{total}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </header>
  );
}
