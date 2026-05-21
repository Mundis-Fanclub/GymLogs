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
      className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/30 ring-1 ring-black/5 transition-transform duration-150 ease-out hover:scale-105 active:scale-95 md:hidden"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </Link>
  );
}
