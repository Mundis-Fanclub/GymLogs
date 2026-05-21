"use client";

import { usePathname } from "next/navigation";
import {
  BarChart2,
  LayoutDashboard,
  MessageSquareText,
} from "lucide-react";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { cn } from "@/lib/utils";
import { AppNavLink } from "./AppNavLink";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "common.dashboard", icon: LayoutDashboard },
  { href: "/analytics", labelKey: "common.analytics", icon: BarChart2 },
  { href: "/social", labelKey: "common.social", icon: MessageSquareText },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useAppPreferences();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-2.5 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur md:hidden">
      <div className="mx-auto grid w-full max-w-md grid-cols-3 gap-1">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <AppNavLink
              key={href}
              href={href}
              active={active}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[3.25rem] min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-0.5 text-xs font-semibold leading-none transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] min-[390px]:text-[0.8rem]",
                active
                  ? "bg-primary text-primary-foreground shadow-sm shadow-black/15"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate">{t(labelKey)}</span>
            </AppNavLink>
          );
        })}
      </div>
    </nav>
  );
}
