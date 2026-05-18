"use client";

import dynamic from "next/dynamic";

const ProfilePageClient = dynamic(
  () => import("./ProfilePageClient").then((module) => module.ProfilePageClient),
  {
    loading: () => (
      <div className="mx-auto grid max-w-7xl gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4 sm:space-y-5">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="min-h-40 bg-muted/40 sm:min-h-44" />
            <div className="space-y-4 p-4 sm:p-6">
              <div className="h-10 rounded-lg bg-muted/40" />
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                <div className="h-20 rounded-lg bg-muted/30" />
                <div className="h-20 rounded-lg bg-muted/30" />
                <div className="h-20 rounded-lg bg-muted/30" />
              </div>
              <p className="text-sm text-muted-foreground">Profil wird geladen...</p>
            </div>
          </div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export function ProfilePageIsland() {
  return <ProfilePageClient />;
}
