"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  ClipboardList,
  BarChart2,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { AppNavLink } from "./AppNavLink";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "common.dashboard", icon: LayoutDashboard },
  { href: "/logs", labelKey: "common.logs", icon: Trophy },
  { href: "/workouts", labelKey: "common.workouts", icon: ClipboardList },
  { href: "/exercises", labelKey: "common.exercises", icon: Dumbbell },
  { href: "/analytics", labelKey: "common.analytics", icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useAppPreferences();

  return (
    <aside className="hidden w-64 min-h-screen flex-col bg-card border-r border-border text-card-foreground md:flex">
      <div className="px-4 py-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[linear-gradient(135deg,var(--color-primary),color-mix(in_oklab,var(--color-primary)_68%,#f59e0b))] flex items-center justify-center shadow-sm">
            <Dumbbell className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <span className="font-semibold text-base tracking-tight block">
              {t("common.appName")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("common.navSubtitle")}
            </span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <AppNavLink
              key={href}
              href={href}
              active={active}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.99]",
                active
                  ? "bg-primary text-primary-foreground font-medium shadow-sm"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {t(labelKey)}
            </AppNavLink>
          );
        })}
      </nav>
      <div className="p-3">
        <div className="rounded-2xl border border-border bg-muted p-3 text-sm text-foreground">
          <p className="font-medium">{t("sidebar.mvpTitle")}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("sidebar.mvpCopy")}
          </p>
        </div>
      </div>
    </aside>
  );
}
