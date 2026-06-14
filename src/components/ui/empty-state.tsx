"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "premium-panel flex flex-col items-center justify-center rounded-3xl border-dashed px-4 py-12 text-center",
        className
      )}
    >
      <div className="premium-glow mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/12 text-brand ring-1 ring-brand/25">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
