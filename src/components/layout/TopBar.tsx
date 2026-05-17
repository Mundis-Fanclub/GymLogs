"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, Dumbbell, Moon, Plus, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConvexUser } from "@/hooks/useConvexUser";
import {
  LOCALE_FLAGS,
  LOCALES,
  useAppPreferences,
} from "@/components/providers/AppPreferencesProvider";

export function TopBar() {
  const router = useRouter();
  const { userId } = useConvexUser();
  const { locale, setLocale, theme, toggleTheme, t } = useAppPreferences();

  function handleNewWorkout() {
    if (!userId) return;
    router.push("/workouts/new");
  }

  function toggleLocale() {
    const nextLocale = LOCALES.find((item) => item !== locale) ?? "en";
    setLocale(nextLocale);
  }

  return (
    <header className="sticky top-0 z-30 grid h-[3.75rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur sm:h-14 sm:px-5 md:px-6">
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2 md:hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground sm:h-8 sm:w-8">
            <Dumbbell className="h-4 w-4" />
          </div>
          <span className="truncate text-sm font-semibold leading-none sm:font-heading">{t("common.appName")}</span>
        </Link>
        <div className="hidden md:block">
          <p className="truncate text-sm font-medium">{t("topbar.title")}</p>
          <p className="text-xs text-muted-foreground">
            {t("topbar.subtitle")}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          onClick={toggleLocale}
          aria-label={t("common.openLanguageMenu")}
          title={t("common.openLanguageMenu")}
          className="hidden rounded-full font-heading text-[0.65rem] lg:inline-flex"
        >
          <span aria-hidden="true">{LOCALE_FLAGS[locale]}</span>
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
          className="hidden rounded-full lg:inline-flex"
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
          className="hidden gap-1.5 !border-amber-300 !bg-amber-300 !text-slate-950 hover:!bg-amber-200 lg:inline-flex"
        >
          <Crown className="w-4 h-4" />
          <span className="hidden sm:inline">{t("common.proPrice")}</span>
        </Button>
        <Button
          size="icon-sm"
          onClick={handleNewWorkout}
          aria-label={t("common.newWorkout")}
          className="order-1 lg:hidden"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button size="sm" onClick={handleNewWorkout} className="hidden gap-1.5 lg:inline-flex">
          <Plus className="w-4 h-4" />
          <span>{t("common.newWorkout")}</span>
        </Button>
        <Link href="/profile" className="order-2">
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="Profil öffnen"
            title="Profil öffnen"
            className="rounded-full"
          >
            <User className="h-4 w-4" />
          </Button>
        </Link>
        <UserButton />
      </div>
    </header>
  );
}
