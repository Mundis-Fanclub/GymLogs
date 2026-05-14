"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, Dumbbell, Moon, Plus, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import {
  LOCALES,
  useAppPreferences,
} from "@/components/providers/AppPreferencesProvider";

export function TopBar() {
  const router = useRouter();
  const { userId } = useConvexUser();
  const { locale, setLocale, theme, toggleTheme, t } = useAppPreferences();
  const createWorkout = useMutation(api.workouts.create);
  const incompleteWorkout = useQuery(
    api.workouts.getIncomplete,
    userId ? { userId } : "skip"
  );

  async function handleNewWorkout() {
    if (!userId) return;
    if (incompleteWorkout) {
      router.push(`/workouts/new`);
      return;
    }
    await createWorkout({ userId });
    router.push("/workouts/new");
  }

  function toggleLocale() {
    const nextLocale = LOCALES.find((item) => item !== locale) ?? "en";
    setLocale(nextLocale);
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-3 backdrop-blur sm:px-5 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2 md:hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Dumbbell className="h-4 w-4" />
          </div>
          <span className="truncate font-heading text-sm">{t("common.appName")}</span>
        </Link>
        <div className="hidden md:block">
          <p className="truncate text-sm font-medium">{t("topbar.title")}</p>
          <p className="text-xs text-muted-foreground">
            {t("topbar.subtitle")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          onClick={toggleLocale}
          aria-label={t("common.openLanguageMenu")}
          title={t("common.openLanguageMenu")}
          className="rounded-full font-heading text-[0.65rem]"
        >
          <span aria-hidden="true">
            {locale === "de" ? "\uD83C\uDDE9\uD83C\uDDEA" : "\uD83C\uDDEC\uD83C\uDDE7"}
          </span>
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          onClick={toggleTheme}
          aria-label={
            theme === "dark" ? t("common.switchToLight") : t("common.switchToDark")
          }
          title={
            theme === "dark" ? t("common.switchToLight") : t("common.switchToDark")
          }
          className="rounded-full"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="hidden gap-1.5 !border-amber-300 !bg-amber-300 !text-slate-950 hover:!bg-amber-200 sm:inline-flex"
        >
          <Crown className="w-4 h-4" />
          <span className="hidden sm:inline">{t("common.proPrice")}</span>
        </Button>
        <Button
          size="icon-sm"
          onClick={handleNewWorkout}
          aria-label={t("common.newWorkout")}
          className="sm:hidden"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button size="sm" onClick={handleNewWorkout} className="hidden gap-1.5 sm:inline-flex">
          <Plus className="w-4 h-4" />
          <span>{t("common.newWorkout")}</span>
        </Button>
        <UserButton />
      </div>
    </header>
  );
}
