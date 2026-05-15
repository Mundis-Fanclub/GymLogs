"use client";

import { usePathname } from "next/navigation";
import {
  BarChart2,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  Trophy,
  MessageSquareText,
} from "lucide-react";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { cn } from "@/lib/utils";
import { AppNavLink } from "./AppNavLink";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "common.dashboard", icon: LayoutDashboard },
  { href: "/logs", labelKey: "common.logs", icon: Trophy },
  { href: "/workouts", labelKey: "common.workouts", icon: ClipboardList },
  { href: "/exercises", labelKey: "common.exercises", icon: Dumbbell },
  { href: "/analytics", labelKey: "common.analytics", icon: BarChart2 },
  { href: "/social", labelKey: "common.social", icon: MessageSquareText },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useAppPreferences();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 backdrop-blur md:hidden">
      <div className="grid grid-cols-6 gap-1">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <AppNavLink
              key={href}
              href={href}
              active={active}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[0.68rem] font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97]",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="max-w-full truncate">{t(labelKey)}</span>
            </AppNavLink>
          );
        })}
      </div>
    </nav>
  );
}
