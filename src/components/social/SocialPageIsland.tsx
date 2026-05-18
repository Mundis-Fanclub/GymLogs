"use client";

import dynamic from "next/dynamic";

const SocialPageClient = dynamic(
  () => import("./SocialPageClient").then((module) => module.SocialPageClient),
  {
    loading: () => (
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,40rem)_18rem] lg:justify-center">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h1 className="text-base font-semibold leading-none">Social</h1>
          </div>
          <div className="space-y-3 p-4">
            <div className="h-10 rounded-lg bg-muted/40" />
            <div className="h-24 rounded-lg bg-muted/30" />
            <p className="text-sm text-muted-foreground">Social wird geladen...</p>
          </div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export function SocialPageIsland() {
  return <SocialPageClient />;
}
