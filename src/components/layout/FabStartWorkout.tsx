"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";

export function FabStartWorkout() {
  const pathname = usePathname();
  const { t } = useAppPreferences();

  const label = t("common.startWorkout");

  return (
    <Link
      href="/workouts/new"
      aria-label={label}
      title={label}
      aria-current={pathname === "/workouts/new" ? "page" : undefined}
      className="absolute bottom-[calc(env(safe-area-inset-bottom)+2.35rem)] left-1/2 z-50 flex size-11 -translate-x-1/2 items-center justify-center rounded-full border border-brand/70 bg-background text-brand shadow-[0_0_0_3px_rgba(0,0,0,0.45),0_0_24px_-4px_var(--brand)] ring-1 ring-white/10 transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
    >
      <Plus className="h-5 w-5" strokeWidth={2.5} />
    </Link>
  );
}
