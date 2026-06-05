"use client";

import type { ComponentType } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChoiceCard({
  title,
  description,
  selected,
  icon: Icon,
  onClick,
}: {
  title: string;
  description?: string;
  selected?: boolean;
  icon?: ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex min-h-16 w-full min-w-0 items-center gap-3 rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 hover:bg-muted/40",
        selected ? "border-primary bg-primary/10 shadow-sm shadow-primary/10" : "border-border bg-card"
      )}
    >
      {Icon && (
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground", selected && "bg-primary text-primary-foreground")}>
          <Icon className="h-5 w-5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-tight text-foreground">{title}</span>
        {description && <span className="mt-1 block text-sm leading-5 text-muted-foreground">{description}</span>}
      </span>
      {selected && (
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-4 w-4" />
        </span>
      )}
    </button>
  );
}
