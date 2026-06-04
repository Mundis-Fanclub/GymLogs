"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";

export function FabStartWorkout() {
  const pathname = usePathname();
  const { t } = useAppPreferences();

  if (pathname === "/workouts/new") return null;

  const label = t("common.startWorkout");

  return (
    <Link
      href="/workouts/new"
      aria-label={label}
      title={label}
      className="fixed right-5 bottom-[calc(env(safe-area-inset-bottom)+5.1rem)] z-50 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_14px_32px_-12px_rgba(0,0,0,0.65),0_3px_10px_-4px_rgba(249,115,22,0.45)] ring-1 ring-black/10 transition-transform duration-150 ease-out hover:scale-105 active:scale-95 md:hidden"
    >
      <Plus className="h-5 w-5" strokeWidth={2.5} />
    </Link>
  );
}
