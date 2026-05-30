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
      className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-50 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_28px_-8px_rgba(0,0,0,0.55),0_2px_8px_-2px_rgba(249,115,22,0.35)] ring-1 ring-black/10 transition-transform duration-150 ease-out hover:scale-105 active:scale-95 md:hidden"
    >
      <Plus className="h-5 w-5" strokeWidth={2.5} />
    </Link>
  );
}
