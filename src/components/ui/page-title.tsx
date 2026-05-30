import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageTitleProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Hide visually but keep for screen readers. */
  srOnly?: boolean;
}

/**
 * Single source of truth for page-level headings. Use once per route at
 * the top — keeps font, size and spacing consistent across the app.
 */
export function PageTitle({
  title,
  description,
  action,
  className,
  srOnly,
}: PageTitleProps) {
  if (srOnly) {
    return <h1 className="sr-only">{title}</h1>;
  }
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-3 pb-4",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface SectionTitleProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * For card-header titles or sub-sections within a page. Smaller than
 * PageTitle, less prominent than CardTitle (which is heading font).
 */
export function SectionTitle({
  title,
  description,
  action,
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn("flex items-end justify-between gap-3", className)}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold leading-tight">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
