"use client";

import type { ReactNode } from "react";

export function OnboardingStep({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="mx-auto flex min-h-[calc(100dvh-4.25rem)] w-full max-w-2xl flex-col px-4 py-6 sm:px-6">
      <div className="flex-1">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-wide text-primary">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-black leading-tight tracking-normal text-foreground sm:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">{description}</p>}
        <div className="mt-7 space-y-3">{children}</div>
      </div>
      {footer && <div className="sticky bottom-0 -mx-4 mt-6 border-t border-border bg-background/92 p-4 backdrop-blur sm:-mx-6 sm:px-6">{footer}</div>}
    </section>
  );
}
